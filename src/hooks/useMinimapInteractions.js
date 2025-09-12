import { useEffect, useState } from 'react';

export const useMinimapInteractions = (minimapState, setMinimapState) => {
    const [interaction, setInteraction] = useState({
        active: false,
        type: null, // 'move', 'resize-br', 'resize-bl', 'resize-tr', 'resize-tl'
        initialMouse: { x: 0, y: 0 },
        initialState: {},
    });

    const handleInteractionStart = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setInteraction({
            active: true,
            type,
            initialMouse: { x: e.clientX, y: e.clientY },
            initialState: { ...minimapState },
        });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!interaction.active) return;

            const dx = e.clientX - interaction.initialMouse.x;
            const dy = e.clientY - interaction.initialMouse.y;

            let newState = {};
            const minSize = 64;

            switch (interaction.type) {
                case 'move':
                    newState = {
                        top: interaction.initialState.top + dy,
                        left: interaction.initialState.left + dx,
                    };
                    break;
                case 'resize-br': {
                    const dSize = Math.abs(dx) > Math.abs(dy) ? dx : dy;
                    const newSize = Math.max(minSize, interaction.initialState.width + dSize);
                    newState = { width: newSize, height: newSize };
                    break;
                }
                case 'resize-bl': {
                    const dSize = Math.abs(dx) > Math.abs(dy) ? -dx : dy;
                    const newSize = Math.max(minSize, interaction.initialState.width + dSize);
                    const sizeChange = newSize - interaction.initialState.width;
                    newState = {
                        width: newSize,
                        height: newSize,
                        left: interaction.initialState.left - sizeChange
                    };
                    break;
                }
                case 'resize-tr': {
                    const dSize = Math.abs(dx) > Math.abs(dy) ? dx : -dy;
                    const newSize = Math.max(minSize, interaction.initialState.width + dSize);
                    const sizeChange = newSize - interaction.initialState.width;
                    newState = {
                        width: newSize,
                        height: newSize,
                        top: interaction.initialState.top - sizeChange
                    };
                    break;
                }
                case 'resize-tl': {
                    const dSize = Math.abs(dx) > Math.abs(dy) ? -dx : -dy;
                    const newSize = Math.max(minSize, interaction.initialState.width + dSize);
                    const sizeChange = newSize - interaction.initialState.width;
                    newState = {
                        width: newSize,
                        height: newSize,
                        left: interaction.initialState.left - sizeChange,
                        top: interaction.initialState.top - sizeChange,
                    };
                    break;
                }
                default:
                    return;
            }
            setMinimapState(prev => ({ ...prev, ...newState }));
        };

        const handleMouseUp = () => {
            if (!interaction.active) return;
            setInteraction(prev => ({ ...prev, active: false }));
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interaction, setMinimapState]);

    return { handleInteractionStart };
};