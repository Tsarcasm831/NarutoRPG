import * as THREE from 'three';
import { playAnimation } from '../animations.js';
import { walkSpeed, runSpeed, flySpeed, GRAVITY, JUMP_FORCE, PLAYER_RADIUS } from './constants.js';
import { getGroundYAt } from './ground.js';
import { resolveCollisions } from './collision.js';

const moveDirection = new THREE.Vector2();
const inputDirection = new THREE.Vector2();
const tmpPos = { x: 0, z: 0 };

/* @tweakable when true, clamps flight to stay above the terrain surface (legacy behavior) */
const FLIGHT_CLAMP_TO_GROUND = false;
/* @tweakable minimum Y position while in dev flight; set to null to disable */
const FLIGHT_MIN_Y = null;

export function updatePlayerMovement(player, keys, joystick, delta, objectGrid, cameraYaw, cameraPitch = 0, isFirstPerson = false) {
    let moved = false;
    moveDirection.set(0, 0);
    inputDirection.set(0, 0);
    let verticalFromCamera = 0;

    if (keys['DevFlightToggle']) {
        keys['DevFlightToggle'] = false;
        player.userData.devFlight = !player.userData.devFlight;
        player.userData.velocity.y = 0;
        player.userData.actionLocked = false;

        if (player.userData.devFlight) {
            player.userData.onGround = false;
            player.position.y = Math.max(
                player.position.y,
                getGroundYAt(player.position.x, player.position.z) + 2
            );
        } else {
            const groundY = getGroundYAt(player.position.x, player.position.z);
            player.position.y = groundY;
            player.userData.onGround = true;
        }
    }

    const isDevFlight = !!player.userData.devFlight;
    const isActionLocked = !!player.userData.actionLocked;

    const isRunning = (keys['ShiftLeft'] || (joystick && joystick.force > 0.8)) &&
        player.userData.onGround && !isActionLocked;
    const currentMoveSpeed = isDevFlight ? flySpeed : (isRunning ? runSpeed : walkSpeed);
    const moveDistance = currentMoveSpeed * delta;
    const wasOnGround = player.userData.onGround;
    let landedThisFrame = false;
    let groundY = getGroundYAt(player.position.x, player.position.z);
    if (!isDevFlight && keys['Space'] && player.userData.onGround && !isActionLocked) {
        player.userData.velocity.y = JUMP_FORCE;
        player.userData.onGround = false;
        playAnimation(player, 'regularJump');
    }
    if (!isDevFlight && !player.userData.onGround) {
        player.userData.velocity.y -= GRAVITY * delta;
    }
    if (isDevFlight) {
        if (keys['Space']) {
            player.position.y += currentMoveSpeed * delta;
        }
        if (keys['ControlLeft']) {
            player.position.y -= currentMoveSpeed * delta;
        }
        // Free flight: do not force the player back to ground unless explicitly enabled
        if (FLIGHT_CLAMP_TO_GROUND) {
            const minY = groundY + 0.1;
            if (player.position.y < minY) player.position.y = minY;
        } else if (typeof FLIGHT_MIN_Y === 'number') {
            if (player.position.y < FLIGHT_MIN_Y) player.position.y = FLIGHT_MIN_Y;
        }
    } else {
        player.position.y += player.userData.velocity.y * delta;
    }

    groundY = getGroundYAt(player.position.x, player.position.z);
    if (!isDevFlight) {
        if (player.position.y <= groundY) {
            if (!player.userData.onGround) {
                landedThisFrame = true;
            }
            player.position.y = groundY;
            player.userData.velocity.y = 0;
            player.userData.onGround = true;
            if (player.userData.currentAnimation === 'regularJump' || player.userData.currentAnimation === 'fall1') {
                if (player.userData.mixer && player.userData.actionFinishListener) {
                    try {
                        player.userData.mixer.removeEventListener('finished', player.userData.actionFinishListener);
                    } catch (_) {}
                    player.userData.actionFinishListener = null;
                }
                player.userData.actionLocked = false;
            }
        } else {
            player.userData.onGround = false;
        }
    } else {
        player.userData.onGround = false;
    }
    if (!isDevFlight && player.userData.onGround) {
        if (keys['MouseLeftClicked']) {
            keys['MouseLeftClicked'] = false;
            if (!isActionLocked) {
                playAnimation(player, 'punchCombo1');
            }
        } else if (keys['ControlLeft'] && !isActionLocked) {
            playAnimation(player, 'rollDodge');
        }
    }

    const prevX = player.position.x;
    const prevZ = player.position.z;
    const allowMovement = isDevFlight || !isActionLocked ||
        player.userData.currentAnimation === 'regularJump' || !player.userData.onGround;
    if (allowMovement) {
        if (joystick && joystick.force > 0.1) {
            // Map joystick angle (0 = right, pi/2 = up) to our input axes:
            // x = strafe (right positive), y = forward (positive for forward)
            const rad = joystick.angle.radian;
            const f = joystick.force;
            const dx = Math.cos(rad);
            const dy = Math.sin(rad);
            inputDirection.set(dx * f, dy * f);
        }

        let keyMoveX = 0;
        let keyMoveZ = 0;
        if (keys['KeyW'] || keys['ArrowUp']) keyMoveZ = 1;     // forward
        if (keys['KeyS'] || keys['ArrowDown']) keyMoveZ = -1;  // backward
        if (keys['KeyA'] || keys['ArrowLeft']) keyMoveX = -1;  // left
        if (keys['KeyD'] || keys['ArrowRight']) keyMoveX = 1;  // right

        if ((keys['KeyW'] || keys['ArrowUp']) && (keys['KeyS'] || keys['ArrowDown'])) keyMoveZ = 0;
        if ((keys['KeyA'] || keys['ArrowLeft']) && (keys['KeyD'] || keys['ArrowRight'])) keyMoveX = 0;

        if (keyMoveX !== 0 || keyMoveZ !== 0) {
            inputDirection.set(keyMoveX, keyMoveZ).normalize();
        }
        if (inputDirection.lengthSq() > 0) {
            const cosYaw = Math.cos(cameraYaw);
            const sinYaw = Math.sin(cameraYaw);
            // Camera-relative basis on XZ; invert forward in 3rd person so W pushes "into" the screen
            const forwardSign = isFirstPerson ? 1 : -1;
            const rightSign   = isFirstPerson ? -1 : 1;
            const forwardX =  forwardSign * sinYaw, forwardZ =  forwardSign * cosYaw;
            const rightX   =  rightSign * cosYaw,  rightZ   =  rightSign * -sinYaw;
            // Map inputs: x = A/D (strafe), y = W/S (forward); W now sets +1
            moveDirection.x = rightX * inputDirection.x + forwardX * (inputDirection.y);
            moveDirection.y = rightZ * inputDirection.x + forwardZ * (inputDirection.y);
            if (isDevFlight) {
                const cosPitch = Math.cos(cameraPitch);
                const sinPitch = Math.sin(cameraPitch);
                moveDirection.x *= cosPitch;
                moveDirection.y *= cosPitch;
                verticalFromCamera = (inputDirection.y) * sinPitch;
            }
        }
        if (moveDirection.lengthSq() > 0 || verticalFromCamera !== 0) {
            tmpPos.x = player.position.x + moveDirection.x * moveDistance;
            tmpPos.z = player.position.z + moveDirection.y * moveDistance;
            let newPos = tmpPos;
            if (!isDevFlight) {
                newPos = resolveCollisions(newPos, PLAYER_RADIUS, objectGrid);
            }
            player.position.x = newPos.x;
            player.position.z = newPos.z;
            if (isDevFlight && verticalFromCamera !== 0) {
                player.position.y += verticalFromCamera * moveDistance;
            }
            if (!isDevFlight) {
                const newGroundY = getGroundYAt(player.position.x, player.position.z);
                if (player.userData.onGround) {
                    player.position.y = newGroundY;
                }
            }
        }
    }

    const dx = player.position.x - prevX;
    const dz = player.position.z - prevZ;
    moved = (dx * dx + dz * dz) > 1e-6 || (verticalFromCamera * verticalFromCamera) > 1e-6;

    if (moved && player.userData.model && moveDirection.lengthSq() > 0) {
        const angle = Math.atan2(moveDirection.x, moveDirection.y);
        player.userData.model.rotation.y = angle;
    }

    player.userData.movedLastFrame = moved;
    if (isDevFlight) {
        if (moved) {
            playAnimation(player, 'running');
        } else {
            playAnimation(player, 'idle11');
        }
    } else if (landedThisFrame) {
        player.userData.actionLocked = false;

        if (moved) {
            playAnimation(player, (keys['ShiftLeft'] || (joystick && joystick.force > 0.8)) ? 'running' : 'walking');
        } else {
            playAnimation(player, 'idle11');
        }
    } else if (isActionLocked) {
    } else if (player.userData.onGround) {
        if (!wasOnGround) {
            playAnimation(player, 'idle11');
        } else if (moved) {
            playAnimation(player, isRunning ? 'running' : 'walking');
        } else {
            playAnimation(player, 'idle11');
        }
    } else {
        if (player.userData.currentAnimation !== 'regularJump' && player.userData.velocity.y < 0) {
            playAnimation(player, 'fall1');
        }
    }
}