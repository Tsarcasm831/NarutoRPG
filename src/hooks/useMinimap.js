import { useState, useEffect, useRef } from 'react';
import { useMinimapInteractions } from './useMinimapInteractions.js';
import { useWorldMinimapCanvas } from './useWorldMinimapCanvas.js';
import { useMinimapRenderer } from './useMinimapRenderer.js';

export const useMinimap = ({ playerRef, worldObjects, zoomRef, options = {} }) => {
    const minimapCanvasRef = useRef();
    const posXRef = useRef();
    const posZRef = useRef();
    const zoomLevelRef = useRef();
    const biomeRef = useRef(); // NEW: biome line under minimap
    // NEW: district/road HUD lines
    const districtRef = useRef();
    const roadRef = useRef();

    // Build world minimap canvas and load optional live model
    const { worldMinimapCanvasRef, liveModelRef } = useWorldMinimapCanvas();

    const initialSize = Math.max(64, Math.min(256, options.size ?? 128));
    const [minimapState, setMinimapState] = useState({
        left: window.innerWidth - 16 - initialSize,
        top: 16,
        width: initialSize,
        height: initialSize,
    });

    // Hook managing drag/resize interactions
    const { handleInteractionStart } = useMinimapInteractions(minimapState, setMinimapState);

    // Update minimap position on window resize
    useEffect(() => {
        const handleResize = () => {
            setMinimapState(prev => ({
                ...prev,
                left: Math.min(prev.left, window.innerWidth - prev.width - 16),
                top: Math.min(prev.top, window.innerHeight - prev.height - 16),
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Render minimap and update HUD elements
    useMinimapRenderer({
        playerRef,
        worldObjects,
        minimapState,
        minimapCanvasRef,
        worldMinimapCanvasRef,
        posXRef,
        posZRef,
        zoomRef,
        zoomLevelRef,
        biomeRef,
        districtRef,
        roadRef,
        liveModelRef,
        options
    });

    return { minimapState, minimapCanvasRef, posXRef, posZRef, zoomLevelRef, biomeRef, handleInteractionStart,
        // NEW: expose refs
        districtRef, roadRef
    };
};