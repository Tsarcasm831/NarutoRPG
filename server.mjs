import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = process.env.NARUTORPG_ROOT_DIR ? path.resolve(process.env.NARUTORPG_ROOT_DIR) : __dirname;
const HOST = process.env.NARUTORPG_HOST || "0.0.0.0";
const PORT = Number.parseInt(process.env.NARUTORPG_PORT || "8000", 10);
const MAX_PLAYERS = Math.max(1, Number.parseInt(process.env.NARUTORPG_MAX_PLAYERS || "4", 10));
const SESSION_TTL_MS = Math.max(15_000, Number.parseInt(process.env.NARUTORPG_SESSION_TTL_MS || "180000", 10));
const SESSION_REFRESH_MS = Math.max(5_000, Math.min(SESSION_TTL_MS / 2, 60_000));
const MAX_BODY_SIZE = 8 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".jsx": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".wasm": "application/wasm"
};

const activeSessions = new Map();

const respondJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
};

const respondError = (res, statusCode, message, extra = {}) => {
  respondJson(res, statusCode, {
    ok: false,
    message,
    ...extra
  });
};

const sanitizePath = (rawPath) => {
  const decoded = decodeURIComponent(rawPath);
  const normalized = path.normalize(decoded).replace(/^\\+|^\/+/g, "");
  const resolved = path.join(ROOT_DIR, normalized);
  if (!resolved.startsWith(ROOT_DIR)) {
    return null;
  }
  return resolved;
};

const serveStatic = async (req, res, pathname) => {
  const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = sanitizePath(requestedPath);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  let finalPath = filePath;
  try {
    const stats = await fs.promises.stat(finalPath);
    if (stats.isDirectory()) {
      finalPath = path.join(finalPath, "index.html");
    }
  } catch (_) {
    const maybeHtml = `${filePath}.html`;
    try {
      await fs.promises.access(maybeHtml, fs.constants.R_OK);
      finalPath = maybeHtml;
    } catch (_) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
  }

  try {
    const data = await fs.promises.readFile(finalPath);
    const ext = path.extname(finalPath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-store, no-cache, must-revalidate" : "public, max-age=3600",
      "Content-Length": data.length
    });
    res.end(data);
  } catch (_) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
};

const clampNumber = (value, fallback = 0, min = -100_000, max = 100_000) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
};

const sanitizeVector3 = (vector = {}) => ({
  x: clampNumber(vector.x, 0, -5000, 5000),
  y: clampNumber(vector.y, 0, -2000, 2000),
  z: clampNumber(vector.z, 0, -5000, 5000)
});

const sanitizeRotation = (rotation = {}) => ({
  y: clampNumber(rotation.y, 0, -Math.PI * 4, Math.PI * 4)
});

const countActivePlayers = () => {
  let count = 0;
  for (const session of activeSessions.values()) {
    if (session.characterKey) count += 1;
  }
  return count;
};

const getTakenCharacters = (excludeSessionId = null) => {
  const taken = new Set();
  for (const [id, session] of activeSessions.entries()) {
    if (excludeSessionId && id === excludeSessionId) continue;
    if (session.characterKey) taken.add(session.characterKey);
  }
  return Array.from(taken);
};

const readJsonBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  let received = 0;

  req.on("data", (chunk) => {
    received += chunk.length;
    if (received > MAX_BODY_SIZE) {
      reject(new Error("Payload too large"));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", () => {
    if (!received) {
      resolve({});
      return;
    }
    try {
      const buffer = Buffer.concat(chunks);
      resolve(JSON.parse(buffer.toString("utf8")));
    } catch (_) {
      reject(new Error("Invalid JSON"));
    }
  });

  req.on("error", (error) => reject(error));
});

const buildPlayerSnapshot = (sessionId, session) => ({
  sessionId,
  characterKey: session.characterKey,
  characterName: session.characterName,
  position: session.state?.position || { x: 0, y: 0, z: 0 },
  rotation: session.state?.rotation || { y: 0 },
  updatedAt: session.state?.updatedAt || null
});

const broadcast = (payload, { exceptSessionId = null } = {}) => {
  const data = JSON.stringify(payload);
  for (const [id, session] of activeSessions.entries()) {
    if (exceptSessionId && id === exceptSessionId) continue;
    const ws = session.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) continue;
    try {
      ws.send(data);
    } catch (_) {}
  }
};

const destroySession = (sessionId, reason = "user_exit", { skipClose = false } = {}) => {
  const session = activeSessions.get(sessionId);
  if (!session) return false;
  activeSessions.delete(sessionId);

  try {
    console.log(`[session] ${sessionId} released (${reason})`);
  } catch (_) {}

  const socket = session.ws;
  if (!skipClose && socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.close(4000, reason);
    } catch (_) {}
  }

  if (session.characterKey) {
    broadcast({ type: "player:leave", sessionId }, { exceptSessionId: sessionId });
  }

  return true;
};

const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      destroySession(id, "timeout", { skipClose: true });
    }
  }
};

const registerSession = (req) => {
  cleanupExpiredSessions();
  if (activeSessions.size >= MAX_PLAYERS) {
    return { ok: false, status: 429, error: "server_full", message: `Server is at capacity (${MAX_PLAYERS} players).` };
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  activeSessions.set(id, {
    createdAt: now,
    lastSeen: now,
    expiresAt: now + SESSION_TTL_MS,
    address: req.socket.remoteAddress || null,
    userAgent: req.headers["user-agent"] || null,
    characterKey: null,
    characterName: null,
    state: null,
    ws: null
  });

  try {
    console.log(`[session] reserved ${id} (sessions=${activeSessions.size}, players=${countActivePlayers()})`);
  } catch (_) {}

  return {
    ok: true,
    status: 201,
    payload: {
      ok: true,
      sessionId: id,
      expiresIn: SESSION_TTL_MS,
      refreshIn: SESSION_REFRESH_MS,
      maxPlayers: MAX_PLAYERS,
      activePlayers: countActivePlayers(),
      takenCharacters: getTakenCharacters(id)
    }
  };
};

const touchSession = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (!session) return false;
  const now = Date.now();
  session.lastSeen = now;
  session.expiresAt = now + SESSION_TTL_MS;
  activeSessions.set(sessionId, session);
  return true;
};

const claimCharacter = (sessionId, characterKey, characterName = null) => {
  cleanupExpiredSessions();
  const session = activeSessions.get(sessionId);
  if (!session) {
    return { ok: false, status: 404, message: "Session not found." };
  }

  const rawKey = typeof characterKey === "string" ? characterKey.trim() : "";
  if (!rawKey) {
    return { ok: false, status: 400, message: "characterKey is required." };
  }
  const keyLower = rawKey.toLowerCase();

  for (const [id, other] of activeSessions.entries()) {
    if (id === sessionId) continue;
    if (other.characterKey && other.characterKey.toLowerCase() === keyLower) {
      return { ok: false, status: 409, message: "Character already taken." };
    }
  }

  session.characterKey = rawKey;
  session.characterName = characterName || null;
  activeSessions.set(sessionId, session);

  try {
    console.log(`[session] ${sessionId} claimed '${rawKey}'`);
  } catch (_) {}

  return {
    ok: true,
    status: 200,
    payload: {
      ok: true,
      sessionId,
      characterKey: rawKey,
      characterName: session.characterName,
      takenCharacters: getTakenCharacters(sessionId),
      activePlayers: countActivePlayers(),
      maxPlayers: MAX_PLAYERS
    }
  };
};

const unclaimCharacter = (sessionId, notify = true) => {
  const session = activeSessions.get(sessionId);
  if (!session) return false;
  if (!session.characterKey) return true;
  const hadCharacter = !!session.characterKey;
  session.characterKey = null;
  session.characterName = null;
  session.state = null;
  activeSessions.set(sessionId, session);
  if (notify && hadCharacter) {
    broadcast({ type: "player:leave", sessionId }, { exceptSessionId: sessionId });
  }
  return true;
};

const server = http.createServer(async (req, res) => {
  const originHeader = req.headers["origin"];
  if (originHeader) {
    res.setHeader("Access-Control-Allow-Origin", originHeader);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const { pathname } = url;

  if (pathname === "/api/session" && req.method === "GET") {
    cleanupExpiredSessions();
    const requester = url.searchParams.get("sessionId");
    respondJson(res, 200, {
      ok: true,
      maxPlayers: MAX_PLAYERS,
      activePlayers: countActivePlayers(),
      sessions: activeSessions.size,
      takenCharacters: getTakenCharacters(requester)
    });
    return;
  }

  if (pathname === "/api/session" && req.method === "POST") {
    const result = registerSession(req);
    if (!result.ok) {
      respondError(res, result.status, result.message, { code: result.error, maxPlayers: MAX_PLAYERS, activePlayers: countActivePlayers() });
      return;
    }
    respondJson(res, result.status, result.payload);
    return;
  }

  if (pathname === "/api/session" && req.method === "DELETE") {
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      respondError(res, 400, "sessionId query parameter required");
      return;
    }
    const removed = destroySession(sessionId, "explicit_release");
    if (!removed) {
      respondError(res, 404, "Session not found.");
      return;
    }
    res.writeHead(204);
    res.end();
    return;
  }

  const sessionRouteMatch = pathname.match(/^\/api\/session\/([A-Za-z0-9_-]+)(?:\/(heartbeat|release))?$/);
  if (sessionRouteMatch) {
    const [, sessionId, action] = sessionRouteMatch;

    if (req.method === "POST" && action === "heartbeat") {
      try {
        await readJsonBody(req);
      } catch (error) {
        respondError(res, 400, error.message || "Unable to parse request body.");
        return;
      }
      const ok = touchSession(sessionId);
      if (!ok) {
        respondError(res, 404, "Session not found.");
        return;
      }
      respondJson(res, 200, {
        ok: true,
        sessionId,
        expiresIn: SESSION_TTL_MS,
        maxPlayers: MAX_PLAYERS,
        activePlayers: countActivePlayers(),
        takenCharacters: getTakenCharacters(sessionId)
      });
      return;
    }

    if ((req.method === "POST" && action === "release") || (req.method === "DELETE" && !action)) {
      if (req.method === "POST") {
        try {
          await readJsonBody(req);
        } catch (error) {
          respondError(res, 400, error.message || "Unable to parse request body.");
          return;
        }
      }
      const removed = destroySession(sessionId, action === "release" ? "explicit_release" : "delete_session");
      if (!removed) {
        respondError(res, 404, "Session not found.");
        return;
      }
      res.writeHead(204);
      res.end();
      return;
    }

    respondError(res, 405, "Method not allowed.");
    return;
  }

  const characterMatch = pathname.match(/^\/api\/session\/([A-Za-z0-9_-]+)\/character$/);
  if (characterMatch) {
    const [, sessionId] = characterMatch;

    if (req.method === "POST") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        respondError(res, 400, error.message || "Unable to parse request body.");
        return;
      }
      const result = claimCharacter(sessionId, body?.characterKey, body?.characterName);
      if (!result.ok) {
        respondError(res, result.status, result.message);
        return;
      }
      respondJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "DELETE") {
      const existed = activeSessions.has(sessionId);
      if (!existed) {
        respondError(res, 404, "Session not found.");
        return;
      }
      const notify = Boolean(req.headers["x-notify"]);
      unclaimCharacter(sessionId, notify);
      res.writeHead(204);
      res.end();
      return;
    }

    respondError(res, 405, "Method not allowed.");
    return;
  }

  if (pathname.startsWith("/api/session")) {
    respondError(res, 405, "Method not allowed.");
    return;
  }

  await serveStatic(req, res, pathname);
});

const wss = new WebSocketServer({ noServer: true });

const sendWs = (ws, payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (_) {}
};

server.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId || !activeSessions.has(sessionId)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, sessionId);
    });
  } catch (_) {
    socket.destroy();
  }
});

wss.on("connection", (ws, _req, sessionId) => {
  let alive = true;
  const markDead = () => { alive = false; };

  try {
    console.log(`[ws] connection opened for session ${sessionId}`);
  } catch (_) {}

  ws.on("close", (code, reason) => {
    if (!alive) return;
    markDead();
    try {
      console.log(`[ws] session ${sessionId} closed (code=${code || 0}, reason=${reason ? reason.toString() : ""})`);
    } catch (_) {}
    destroySession(sessionId, "socket_closed", { skipClose: true });
  });

  ws.on("error", (error) => {
    if (!alive) return;
    markDead();
    try {
      console.error(`[ws] session ${sessionId} socket error`, error);
    } catch (_) {}
    destroySession(sessionId, "socket_error", { skipClose: true });
  });

  const announceJoinIfNeeded = () => {
    const session = activeSessions.get(sessionId);
    if (!session || !session.characterKey) return;
    if (!session.__announced) {
      session.__announced = true;
      activeSessions.set(sessionId, session);
      const snapshot = buildPlayerSnapshot(sessionId, session);
      try {
        console.log(`[ws] session ${sessionId} joined world as '${session.characterKey}'`);
      } catch (_) {}
      broadcast({ type: "player:join", player: snapshot }, { exceptSessionId: sessionId });
    }
  };

  const sendHello = () => {
    const session = activeSessions.get(sessionId);
    if (!session) {
      sendWs(ws, { type: "error", code: "session_missing", message: "Session expired." });
      ws.close(4001, "session_missing");
      return;
    }
    session.ws = ws;
    session.lastSeen = Date.now();
    activeSessions.set(sessionId, session);

    if (!session.characterKey) {
      sendWs(ws, { type: "error", code: "character_missing", message: "Select a character before joining the world." });
      return;
    }

    const roster = [];
    for (const [id, other] of activeSessions.entries()) {
      if (id === sessionId) continue;
      if (!other.characterKey) continue;
      roster.push(buildPlayerSnapshot(id, other));
    }

    sendWs(ws, {
      type: "hello",
      sessionId,
      player: buildPlayerSnapshot(sessionId, session),
      players: roster,
      maxPlayers: MAX_PLAYERS,
      activePlayers: countActivePlayers(),
      takenCharacters: getTakenCharacters(sessionId)
    });

    announceJoinIfNeeded();
  };

  ws.on("message", (raw) => {
    let payload;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch (_) {
      return;
    }
    if (!payload || typeof payload.type !== "string") return;

    const session = activeSessions.get(sessionId);
    if (!session) {
      sendWs(ws, { type: "error", code: "session_missing", message: "Session expired." });
      ws.close(4001, "session_missing");
      return;
    }

    switch (payload.type) {
      case "hello": {
        sendHello();
        break;
      }
      case "state:update": {
        if (!session.characterKey) return;
        const position = sanitizeVector3(payload.position);
        const rotation = sanitizeRotation(payload.rotation);
        const animation = typeof payload.animation === "string" ? payload.animation.slice(0, 64) : null;
        session.state = {
          position,
          rotation,
          animation,
          updatedAt: Date.now()
        };
        session.lastSeen = Date.now();
        activeSessions.set(sessionId, session);
        announceJoinIfNeeded();
        try {
          if (!session.__loggedFirstState) {
            session.__loggedFirstState = true;
            console.log(`[ws] first state received from ${sessionId}`, position);
          }
        } catch (_) {}
        broadcast({
          type: "player:update",
          sessionId,
          position,
          rotation,
          animation,
          characterKey: session.characterKey
        }, { exceptSessionId: sessionId });
        break;
      }
      case "state:ping": {
        sendWs(ws, { type: "state:pong", now: Date.now() });
        break;
      }
      case "player:leave": {
        destroySession(sessionId, "client_leave");
        break;
      }
      default:
        break;
    }
  });

  // Automatically trigger hello so the client gets the roster on connect
  sendHello();
});

server.listen(PORT, HOST, () => {
  console.log(`NarutoRPG server listening on http://${HOST}:${PORT} (max players: ${MAX_PLAYERS})`);
});

const cleanupInterval = setInterval(cleanupExpiredSessions, Math.min(SESSION_TTL_MS, 60_000));
cleanupInterval.unref();

const shutdown = () => {
  clearInterval(cleanupInterval);
  for (const sessionId of [...activeSessions.keys()]) {
    destroySession(sessionId, "server_shutdown");
  }
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1_000).unref();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
