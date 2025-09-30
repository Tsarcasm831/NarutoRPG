import * as THREE from 'three';
import { createPlayer } from '../game/player/index.js';
import { playAnimation } from '../game/player/animations.js';
import { getCharacterByKey, getDefaultCharacter } from '../game/player/characterCatalog.js';
import { getPlayerIdentity } from '../game/player/identity.js';

const PRESENCE_INTERVAL_MS = 50;
const REMOTE_LERP_SPEED = 6;
const REMOTE_SNAP_DISTANCE = 25;

const normalizeAngle = (angle) => {
  if (!Number.isFinite(angle)) return 0;
  const twoPi = Math.PI * 2;
  angle = angle % twoPi;
  if (angle <= -Math.PI) angle += twoPi;
  if (angle > Math.PI) angle -= twoPi;
  return angle;
};

const coerceNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const pickIdentity = (key) => {
  if (typeof key === 'string' && key.trim().length > 0) {
    return getCharacterByKey(key.trim());
  }
  return getDefaultCharacter();
};

class RemotePlayer {
  constructor(manager, peerId) {
    this.manager = manager;
    this.peerId = peerId;
    this.identity = getDefaultCharacter();
    this.group = null;
    this.ready = false;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = 0;
    this.desiredAnimation = null;
    this.lastPresence = 0;
    this.displayName = null;
  }

  dispose() {
    if (this.group) {
      try {
        if (this.group.parent) {
          this.group.parent.remove(this.group);
        }
      } catch (_) {}
    }
    this.group = null;
    this.ready = false;
  }

  ensureInstance(identity, initialPosition, displayName) {
    const scene = this.manager.scene;
    if (!scene) return;
    const identityKeyChanged = identity?.key !== this.identity?.key;
    if (identityKeyChanged) {
      this.dispose();
      this.identity = identity || getDefaultCharacter();
    }
    if (displayName) {
      this.displayName = displayName;
    }
    if (this.group) return;

    const spawn = initialPosition ? { x: initialPosition.x, y: initialPosition.y, z: initialPosition.z } : undefined;
    this.group = createPlayer(scene, this.manager.currentSettings, null, {
      isLocal: false,
      identity: this.identity,
      identityKey: this.identity?.key,
      spawnPosition: spawn,
      displayName: this.displayName || undefined,
      onModelLoaded: () => {
        this.ready = true;
        if (this.desiredAnimation) {
          try { playAnimation(this.group, this.desiredAnimation); } catch (_) {}
        }
      }
    });
    this.group.userData.isRemote = true;
    this.group.userData.peerId = this.peerId;
    this.group.userData.identityKey = this.identity?.key || null;
    this.group.userData.displayName = this.displayName || this.identity?.name || null;
    this.group.visible = false;
  }

  applyPresence(presence) {
    if (!presence) return;
    const identity = pickIdentity(presence.identityKey || presence.identity);
    const displayName = presence.displayName || this.manager.getPeerDisplayName(this.peerId);
    const initialPos = {
      x: coerceNumber(presence.x, this.targetPosition.x),
      y: coerceNumber(presence.y, this.targetPosition.y),
      z: coerceNumber(presence.z, this.targetPosition.z)
    };
    this.ensureInstance(identity, initialPos, displayName);
    if (!this.group) return;

    this.group.visible = true;
    this.identity = identity;
    this.displayName = displayName || this.displayName;
    if (this.group && this.group.userData) {
      this.group.userData.displayName = this.displayName || this.group.userData.displayName || null;
    }

    this.targetPosition.set(initialPos.x, initialPos.y, initialPos.z);
    this.targetRotation = normalizeAngle(coerceNumber(presence.rotationY, this.targetRotation));
    if (typeof presence.animation === 'string') {
      this.desiredAnimation = presence.animation;
      if (this.ready && this.group.userData.currentAnimation !== presence.animation) {
        try { playAnimation(this.group, presence.animation); } catch (_) {}
      }
    }
    this.lastPresence = presence.timestamp || Date.now();

    if (!this.ready && this.group) {
      this.group.position.set(initialPos.x, initialPos.y, initialPos.z);
      if (this.group.userData.model) {
        this.group.userData.model.rotation.y = this.targetRotation;
      }
    }
  }

  update(delta) {
    if (!this.group || !this.group.userData) return;
    if (this.group.userData.mixer) {
      try { this.group.userData.mixer.update(delta); } catch (_) {}
    }
    if (!this.ready) return;

    const current = this.group.position;
    const distance = current.distanceTo(this.targetPosition);
    if (distance > REMOTE_SNAP_DISTANCE) {
      current.copy(this.targetPosition);
    } else {
      const t = Math.min(1, delta * REMOTE_LERP_SPEED);
      current.lerp(this.targetPosition, t);
    }

    const model = this.group.userData.model;
    if (model) {
      const currentYaw = model.rotation.y || 0;
      const diff = normalizeAngle(this.targetRotation - currentYaw);
      model.rotation.y = currentYaw + diff * Math.min(1, delta * REMOTE_LERP_SPEED);
    }
  }
}

class MultiplayerManager {
  constructor() {
    this.enabled = true;
    this.scene = null;
    this.currentSettings = {};
    this.room = null;
    this.presenceUnsub = null;
    this.roomStateUnsub = null;
    this.remotePlayers = new Map();
    this.localPlayer = null;
    this.localIdentityKey = getPlayerIdentity()?.key || getDefaultCharacter()?.key;
    this.localDisplayName = getPlayerIdentity()?.name || getDefaultCharacter()?.name;
    this.localPresence = {
      identityKey: this.localIdentityKey,
      displayName: this.localDisplayName,
      x: 0,
      y: 0,
      z: 0,
      rotationY: 0,
      animation: 'idle11',
      timestamp: Date.now()
    };
    this.presenceDirty = false;
    this.lastSentAt = 0;
    this.connectingPromise = null;
  }

  getPeerDisplayName(peerId) {
    if (!this.room || !this.room.peers) return null;
    return this.room.peers[peerId]?.username || null;
  }

  setSettings(settings) {
    this.currentSettings = settings || {};
  }

  attachScene(scene) {
    this.scene = scene;
    this.syncRemotePlayers();
  }

  async connect() {
    if (!this.enabled) return null;
    if (this.room) return this.room;
    if (this.connectingPromise) return this.connectingPromise;
    if (typeof WebsimSocket === 'undefined') {
      console.warn('[Multiplayer] WebsimSocket not available; multiplayer disabled.');
      this.enabled = false;
      return null;
    }
    this.connectingPromise = (async () => {
      try {
        const room = new WebsimSocket();
        await room.initialize();
        this.room = room;
        this.setupSubscriptions();
        this.syncRemotePlayers();
        this.markPresenceDirty();
        return room;
      } catch (err) {
        console.error('[Multiplayer] Failed to initialize:', err);
        this.enabled = false;
        this.room = null;
        return null;
      } finally {
        this.connectingPromise = null;
      }
    })();
    return this.connectingPromise;
  }

  setupSubscriptions() {
    if (!this.room) return;
    this.teardownSubscriptions();
    this.presenceUnsub = this.room.subscribePresence(() => {
      this.syncRemotePlayers();
    });
    this.roomStateUnsub = this.room.subscribeRoomState(() => {
      this.syncRemotePlayers();
    });
  }

  teardownSubscriptions() {
    try { this.presenceUnsub?.(); } catch (_) {}
    try { this.roomStateUnsub?.(); } catch (_) {}
    this.presenceUnsub = null;
    this.roomStateUnsub = null;
  }

  registerLocalPlayer(player, identityKey, displayName) {
    this.localPlayer = player;
    if (identityKey) this.localIdentityKey = identityKey;
    if (displayName) this.localDisplayName = displayName;
    this.localPresence.identityKey = this.localIdentityKey;
    this.localPresence.displayName = this.localDisplayName;
    this.markPresenceDirty();
  }

  setIdentity(identityKey, displayName) {
    if (identityKey) this.localIdentityKey = identityKey;
    if (displayName) this.localDisplayName = displayName;
    this.localPresence.identityKey = this.localIdentityKey;
    this.localPresence.displayName = this.localDisplayName;
    this.markPresenceDirty();
  }

  markPresenceDirty() {
    this.presenceDirty = true;
  }

  updateLocalFromPlayer() {
    if (!this.localPlayer || !this.localPlayer.userData) return;
    const player = this.localPlayer;
    const model = player.userData.model;
    this.localPresence.x = player.position.x;
    this.localPresence.y = player.position.y;
    this.localPresence.z = player.position.z;
    this.localPresence.rotationY = model ? model.rotation.y : this.localPresence.rotationY;
    this.localPresence.animation = player.userData.currentAnimation || player.userData.defaultAnimation || this.localPresence.animation;
    this.localPresence.identityKey = this.localIdentityKey;
    this.localPresence.displayName = this.localDisplayName;
    this.localPresence.timestamp = Date.now();
    this.markPresenceDirty();
  }

  flushPresence(now) {
    if (!this.room || !this.presenceDirty) return;
    if (now - this.lastSentAt < PRESENCE_INTERVAL_MS) return;
    this.lastSentAt = now;
    this.presenceDirty = false;
    try {
      this.room.updatePresence({ ...this.localPresence });
    } catch (err) {
      console.error('[Multiplayer] Failed to update presence:', err);
    }
  }

  syncRemotePlayers() {
    if (!this.room) return;
    const peers = this.room.peers || {};
    const peerIds = new Set(Object.keys(peers));

    // Remove players who left
    for (const [peerId, remote] of this.remotePlayers) {
      if (!peerIds.has(peerId)) {
        remote.dispose();
        this.remotePlayers.delete(peerId);
      }
    }

    if (!this.scene) return;

    // Ensure remote players exist
    for (const peerId of peerIds) {
      if (peerId === this.room.clientId) continue;
      const presence = this.room.presence?.[peerId];
      if (!presence) continue;
      let remote = this.remotePlayers.get(peerId);
      if (!remote) {
        remote = new RemotePlayer(this, peerId);
        this.remotePlayers.set(peerId, remote);
      }
      remote.applyPresence(presence);
    }
  }

  update(delta, now) {
    if (!this.enabled) return;
    if (this.localPlayer) {
      this.updateLocalFromPlayer();
      this.flushPresence(now);
    }

    for (const remote of this.remotePlayers.values()) {
      remote.update(delta);
    }
  }

  removeAllRemotePlayers() {
    for (const remote of this.remotePlayers.values()) {
      remote.dispose();
    }
    this.remotePlayers.clear();
  }

  cleanup() {
    this.removeAllRemotePlayers();
    this.teardownSubscriptions();
    if (this.room) {
      try { this.room.close?.(); } catch (_) {}
    }
    this.room = null;
  }
}

export const multiplayerManager = new MultiplayerManager();
