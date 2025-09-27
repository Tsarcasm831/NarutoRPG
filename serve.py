#!/usr/bin/env python3
import os
import sys
import signal
import argparse
import shutil
import threading
import subprocess
import atexit
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

def load_dotenv(path=".env"):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js":   "text/javascript; charset=utf-8",
        ".mjs":  "text/javascript; charset=utf-8",
        ".jsx":  "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".wasm": "application/wasm",
    }
    def end_headers(self):  # type: ignore[override]
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

class QuietHTTPServer(ThreadingHTTPServer):
    # Fast restart & fast shutdown behavior
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, request, client_address):  # type: ignore[override]
        exc = sys.exc_info()[1]
        if isinstance(exc, (BrokenPipeError, ConnectionResetError, ConnectionAbortedError)):
            return
        return super().handle_error(request, client_address)

def stream_proc(prefix, proc):
    """Stream a subprocess's stdout to our stdout without blocking exit."""
    stop = threading.Event()

    def run():
        for line in iter(proc.stdout.readline, ''):
            if not line and proc.poll() is not None:
                break
            try:
                sys.stdout.write(f"[{prefix}] {line}")
                sys.stdout.flush()
            except Exception:
                # Don't let logging kill us
                pass

    t = threading.Thread(target=run, daemon=True)
    t.start()
    return stop, t

def start_cloudflared(token):
    exe = shutil.which("cloudflared")
    if not exe:
        print("ERROR: cloudflared not found in PATH. Install it first.", file=sys.stderr)
        return None, None, None
    cmd = [exe, "tunnel", "run", "--token", token]
    print("Starting Cloudflare Tunnel with token from .env")
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,             # line-buffered text mode
        bufsize=1,             # line-buffer stdout
        preexec_fn=os.setsid   # new process group (Linux/macOS)
    )
    stop_evt, thread = stream_proc("cloudflared", proc)
    return proc, stop_evt, thread

def kill_cloudflared(proc, timeout=5):
    if proc is None:
        return
    if proc.poll() is not None:
        return
    try:
        # Terminate the whole process group
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except Exception:
        try:
            proc.terminate()
        except Exception:
            pass
    try:
        proc.wait(timeout=timeout)
    except Exception:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass

def main():
    load_dotenv(".env")

    parser = argparse.ArgumentParser(description="Dev server with optional Cloudflare Tunnel")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000, help="Use 0 for a random free port")
    parser.add_argument("--tunnel", action="store_true", help="Start cloudflared tunnel using CF_TUNNEL_TOKEN")
    parser.add_argument("--chdir", default=None, help="Serve this directory (defaults to script dir)")
    args = parser.parse_args()

    if args.chdir:
        os.chdir(args.chdir)
    else:
        os.chdir(os.path.dirname(os.path.abspath(__file__)))

    tunnel_proc = None
    tunnel_thread = None

    if args.tunnel:
        token = os.environ.get("CF_TUNNEL_TOKEN")
        if not token:
            print("ERROR: --tunnel was set but CF_TUNNEL_TOKEN is missing in .env or environment.", file=sys.stderr)
            sys.exit(2)
        tunnel_proc, _stop_evt, tunnel_thread = start_cloudflared(token)

    httpd = QuietHTTPServer((args.host, args.port), Handler)
    sa = httpd.socket.getsockname()
    print(f"Serving HTTP on {sa[0]} port {sa[1]} (http://{sa[0]}:{sa[1]}/) ...", flush=True)

    def cleanup():
        try:
            httpd.shutdown()
        except Exception:
            pass
        try:
            httpd.server_close()
        except Exception:
            pass
        kill_cloudflared(tunnel_proc)
        # Best-effort TTY reset if your terminal got "stuck"
        try:
            subprocess.run(["stty", "sane"], check=False)
        except Exception:
            pass

    atexit.register(cleanup)

    def _signal_handler(signum, frame):
        # shutdown() must be called from a different thread than serve_forever()
        print("\nShutting down…", flush=True)
        threading.Thread(target=cleanup, daemon=True).start()

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    try:
        httpd.serve_forever()
    finally:
        cleanup()

if __name__ == "__main__":
    # Make sure stdout is unbuffered in case prints appear "late"
    if os.environ.get("PYTHONUNBUFFERED") != "1":
        os.environ["PYTHONUNBUFFERED"] = "1"
    main()
