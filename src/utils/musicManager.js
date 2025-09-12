// Simple global music manager used to preload and control background music.
// Exposes a singleton on window.__music for easy access across components.

import playlist from '/src/assets/songs/playlist.js';

function ensureGlobal() {
  if (!window.__music) {
    window.__music = {
      playlist: playlist.slice(),
      audios: [],
      index: 0,
      isPlaying: false,
      ready: false,
      volume: (() => {
        try {
          const saved = localStorage.getItem('musicVolume');
          const v = saved != null ? Number(saved) : 0.05; // default 5%
          if (!Number.isFinite(v)) return 0.05;
          return Math.min(1, Math.max(0, v));
        } catch (_) { return 0.05; }
      })(),
      // lightweight subscribers to UI changes
      listeners: new Set(),
      notify() {
        for (const fn of this.listeners) {
          try { fn(this.getState()); } catch (_) {}
        }
      },
      getState() {
        const track = this.playlist[this.index] || null;
        const audio = this.audios[this.index] || null;
        return {
          ready: this.ready,
          isPlaying: this.isPlaying,
          index: this.index,
          track,
          currentTime: audio ? audio.currentTime : 0,
          duration: audio && Number.isFinite(audio.duration) ? audio.duration : 0,
          volume: this.volume,
          hasPrev: this.playlist.length > 1,
          hasNext: this.playlist.length > 1
        };
      },
      subscribe(fn) {
        if (typeof fn !== 'function') return () => {};
        this.listeners.add(fn);
        // send initial
        try { fn(this.getState()); } catch (_) {}
        return () => this.listeners.delete(fn);
      },
    };
  }
  return window.__music;
}

async function waitForCanPlay(audio, timeoutMs = 20000) {
  if (audio.readyState >= 3) return; // HAVE_FUTURE_DATA
  await new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; cleanup(); resolve(); } };
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', finish);
      audio.removeEventListener('loadeddata', finish);
      audio.removeEventListener('error', finish);
    };
    audio.addEventListener('canplaythrough', finish, { once: true });
    audio.addEventListener('loadeddata', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    setTimeout(finish, timeoutMs);
    try { audio.load(); } catch (_) {}
  });
}

export async function preloadMusic(onProgress) {
  const M = ensureGlobal();
  if (M.ready && M.audios.length) {
    if (onProgress) onProgress(100);
    return;
  }

  const tracks = M.playlist;
  const total = tracks.length || 1;
  let completed = 0;
  const update = () => {
    completed += 1;
    if (onProgress) onProgress(Math.round((completed / total) * 100));
  };

  M.audios = [];
  let cache = null;
  try { cache = await caches.open('music-assets-v1'); } catch (_) { cache = null; }
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    const a = new Audio();
    a.src = t.src;
    a.preload = 'auto';
    a.crossOrigin = 'anonymous';
    a.volume = M.volume; // default volume
    // set up end listener when active
    a.addEventListener('ended', () => {
      const G = ensureGlobal();
      // advance to next track when active one ends
      if (G.audios[G.index] === a) {
        G._nextInternal(true);
      }
    });
    M.audios.push(a);
    // opportunistically store in Cache Storage to keep them warm for future loads
    if (cache) {
      try { await cache.add(new Request(t.src, { mode: 'no-cors', credentials: 'omit' })); } catch (_) {}
    }
    try { await waitForCanPlay(a); } catch (_) {}
    update();
  }

  M.ready = true;
  M.notify();
}

function applyTrack(index) {
  const M = ensureGlobal();
  const bounded = ((index % M.playlist.length) + M.playlist.length) % M.playlist.length;
  if (bounded === M.index) return;
  // pause current
  try { M.audios[M.index]?.pause(); } catch (_) {}
  M.index = bounded;
  M.notify();
}

function playCurrent() {
  const M = ensureGlobal();
  const a = M.audios[M.index];
  if (!a) return;
  const p = a.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      M.isPlaying = true;
      M.notify();
    }).catch(() => {
      // Autoplay might be blocked; keep state paused
      M.isPlaying = false;
      M.notify();
    });
  } else {
    M.isPlaying = true;
    M.notify();
  }
}

function pauseCurrent() {
  const M = ensureGlobal();
  try { M.audios[M.index]?.pause(); } catch (_) {}
  M.isPlaying = false;
  M.notify();
}

function nextTrack(autoplay = true) {
  const M = ensureGlobal();
  applyTrack(M.index + 1);
  if (autoplay) playCurrent();
}

function prevTrack(autoplay = true) {
  const M = ensureGlobal();
  applyTrack(M.index - 1);
  if (autoplay) playCurrent();
}

// Internal next used by 'ended' handler; loops playlist
ensureGlobal()._nextInternal = (autoplay) => {
  const M = ensureGlobal();
  applyTrack(M.index + 1);
  if (autoplay) playCurrent();
};

export function musicPlay() { playCurrent(); }
export function musicPause() { pauseCurrent(); }
export function musicToggle() {
  const M = ensureGlobal();
  if (!M.ready) return;
  if (M.isPlaying) pauseCurrent(); else playCurrent();
}
export function musicNext() { nextTrack(true); }
export function musicPrev() { prevTrack(true); }
export function musicSubscribe(fn) { return ensureGlobal().subscribe(fn); }
export function musicState() { return ensureGlobal().getState(); }

export function musicSetVolume(v) {
  const M = ensureGlobal();
  let vol = Number(v);
  if (!Number.isFinite(vol)) return;
  vol = Math.min(1, Math.max(0, vol));
  if (M.volume === vol) return;
  M.volume = vol;
  for (const a of M.audios) {
    try { a.volume = vol; } catch (_) {}
  }
  try { localStorage.setItem('musicVolume', String(vol)); } catch (_) {}
  M.notify();
}