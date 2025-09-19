import { useEffect, useRef } from 'react';

export const usePlayerControls = ({ setShowCharacter, setShowInventory, setShowWorldMap, setShowSettings, setShowMobileControls, setShowAnimations, setShowJutsuModal, setShowKakashi, gameState, setSettings, setShowPause }) => {
    const keysRef = useRef({});

    useEffect(() => {
        const exitPointerLockSafely = () => {
            if (typeof document.exitPointerLock !== 'function') return;
            const isPointerLocked = document.pointerLockElement != null;
            if (!isPointerLocked) return;
            try {
                document.exitPointerLock();
            } catch (_) {
                // Some browsers throw if pointer lock isn't actually engaged
            }
        };

        const applyPauseState = (shouldPause) => {
            if (shouldPause) {
                const wasPausedBefore = !!window.__gamePaused;
                window.__pauseMenuWasPausedBefore = wasPausedBefore;
                window.__pauseMenuActive = true;
                window.__gamePaused = true;
                keysRef.current = {};
                exitPointerLockSafely();
            } else {
                const wasPausedBefore = window.__pauseMenuWasPausedBefore;
                delete window.__pauseMenuActive;
                delete window.__pauseMenuWasPausedBefore;
                if (!wasPausedBefore) {
                    window.__gamePaused = false;
                }
            }
        };

        const handleKeyDown = (event) => {
            // Prevent panel toggling if an input field is focused
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
                return;
            }

            if (event.code === 'Backquote') {
                if (typeof setShowPause === 'function' && gameState === 'Playing') {
                    setShowPause(prev => {
                        const next = !prev;
                        applyPauseState(next);
                        return next;
                    });
                }
                return;
            }

            if (window.__gamePaused) {
                return;
            }

            keysRef.current[event.code] = true;

            // Edge-triggered click flag for Interact (F)
            if (event.code === 'KeyF') {
                keysRef.current['KeyFClicked'] = true;
            }

            // NEW: Double-tap Space toggles Dev Flight mode
            if (event.code === 'Space') {
                const now = performance.now();
                const last = keysRef.current.__lastSpaceTs || 0;
                keysRef.current.__lastSpaceTs = now;
                if (now - last < 300) {
                    // Signal toggle; movement system will consume this
                    keysRef.current['DevFlightToggle'] = true;
                }
            }

            const closeAllPanels = () => {
                setShowCharacter(false);
                setShowInventory(false);
                setShowWorldMap(false);
                if (typeof setShowJutsuModal === 'function') setShowJutsuModal(false);
                if (gameState === 'Playing') { // Only close settings in-game with Esc
                    setShowSettings(false);
                    setShowAnimations(false);
                    if (setShowKakashi) setShowKakashi(false);
                }
            };

            const togglePanel = (setter, key) => {
                setter(prev => {
                    const willOpen = !prev;

                    if (willOpen) {
                        if (gameState !== 'Playing' && key !== 'p') {
                            // In main menu, only allow settings to open
                            return false;
                        }

                        if (gameState === 'Playing') {
                            if (key !== 'c') setShowCharacter(false);
                            if (key !== 'i') setShowInventory(false);
                            if (key !== 'm') setShowWorldMap(false);
                            if (key !== 'p') setShowSettings(false);
                            if (key !== 'b') setShowAnimations(false);
                            if (key !== 'j' && typeof setShowJutsuModal === 'function') setShowJutsuModal(false);
                            if (key !== 'y' && setShowKakashi) setShowKakashi(false);
                        }

                        // Opening a panel should free the cursor if pointer lock is active
                        exitPointerLockSafely();
                    }

                    return willOpen;
                });
            };

            switch (event.code) {
                case 'KeyC':
                    togglePanel(setShowCharacter, 'c');
                    break;
                case 'KeyI':
                    togglePanel(setShowInventory, 'i');
                    break;
                case 'KeyM':
                    togglePanel(setShowWorldMap, 'm');
                    break;
                case 'KeyP':
                    togglePanel(setShowSettings, 'p');
                    break;
                case 'KeyB':
                    if (gameState === 'Playing' && setShowAnimations) {
                        togglePanel(setShowAnimations, 'b');
                    }
                    break;
                case 'KeyJ':
                    if (gameState === 'Playing' && typeof setShowJutsuModal === 'function') {
                        togglePanel(setShowJutsuModal, 'j');
                    }
                    break;
                case 'KeyY':
                    if (gameState === 'Playing' && setShowKakashi) {
                        togglePanel(setShowKakashi, 'y');
                    }
                    break;
                case 'KeyG':
                    if (setSettings && gameState === 'Playing') {
                        setSettings(prev => ({ ...prev, grid: !prev.grid }));
                    }
                    break;
                case 'KeyZ':
                    if (setShowMobileControls && gameState === 'Playing') {
                        setShowMobileControls(prev => !prev);
                    }
                    break;
                case 'KeyV': {
                    // Toggle first-person view. Prefer Pointer Lock when supported (must be called from user gesture).
                    if (event.cancelable) event.preventDefault();
                    const canvas = document.querySelector('canvas');
                    const supportsPointerLock = !!(canvas && canvas.requestPointerLock);
                    if (supportsPointerLock) {
                        if (document.pointerLockElement === canvas) {
                            document.exitPointerLock();
                        } else {
                            canvas.requestPointerLock();
                        }
                        // Do NOT flip FPV state here; it will sync via pointerlockchange.
                    } else {
                        // Fallback: no Pointer Lock available, request manual FPV toggle handled in loop
                        keysRef.current['ToggleFirstPerson'] = true;
                    }
                    break;
                }
                case 'Equal': // '=' zoom in
                    keysRef.current['ZoomInClicked'] = true;
                    break;
                case 'Minus': // '-' zoom out
                    keysRef.current['ZoomOutClicked'] = true;
                    break;
                case 'Escape':
                    closeAllPanels();
                    break;
            }
        };

        const handleKeyUp = (event) => {
            keysRef.current[event.code] = false;
        };

        // Mouse buttons (bind left-click for attack)
        const handleMouseDown = (event) => {
            if (window.__gamePaused) {
                return;
            }
            // Only register attacks when clicking on the game canvas to avoid UI clicks triggering attacks
            if (event.button === 0 && event.target && event.target.tagName === 'CANVAS') {
                keysRef.current['MouseLeft'] = true;
                // Edge-triggered click flag (consumed by game logic)
                keysRef.current['MouseLeftClicked'] = true;
            }
        };
        const handleMouseUp = (event) => {
            if (event.button === 0) {
                keysRef.current['MouseLeft'] = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [setShowCharacter, setShowInventory, setShowWorldMap, setShowSettings, setShowMobileControls, setShowAnimations, setShowJutsuModal, setShowKakashi, gameState, setSettings, setShowPause]);

    return keysRef;
};
