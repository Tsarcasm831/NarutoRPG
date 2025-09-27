const EXIT_LOCK_ERROR_SAFE = true;

function exitPointerLockSafely() {
    if (typeof document === 'undefined') return;
    const exitFn = document.exitPointerLock;
    if (typeof exitFn !== 'function') return;
    if (!document.pointerLockElement) return;
    try {
        exitFn.call(document);
    } catch (err) {
        if (!EXIT_LOCK_ERROR_SAFE) {
            console.warn('exitPointerLock failed:', err);
        }
    }
}

function openPauseGate({ rememberPrevious = true, forcePointerUnlock = true } = {}) {
    if (typeof window === 'undefined') return;
    const wasPausedBefore = !!window.__gamePaused;
    if (rememberPrevious) {
        window.__pauseMenuWasPausedBefore = wasPausedBefore;
    }
    window.__pauseMenuActive = true;
    window.__gamePaused = true;
    if (forcePointerUnlock) exitPointerLockSafely();
    return wasPausedBefore;
}

function closePauseGate({ restorePrevious = true } = {}) {
    if (typeof window === 'undefined') return;
    const wasPausedBefore = window.__pauseMenuWasPausedBefore;
    if (restorePrevious) {
        if (!wasPausedBefore) {
            window.__gamePaused = false;
        }
    }
    delete window.__pauseMenuActive;
    delete window.__pauseMenuWasPausedBefore;
}

export { exitPointerLockSafely, openPauseGate, closePauseGate };
