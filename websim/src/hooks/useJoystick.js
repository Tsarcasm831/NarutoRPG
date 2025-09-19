import { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';

const DEADZONE = 0.12;
const SMOOTHING = 0.18;

export function useJoystick(joystickRef, visible) {
  const zoneRef = useRef(null);
  const managerRef = useRef(null);
  const smoothedRef = useRef({ force: 0, angle: { radian: 0 } });
  const targetRef = useRef({ force: 0, angle: { radian: 0 } });
  const rafRef = useRef(null);

  useEffect(() => {
    if (!zoneRef.current) return;
    const preventDefault = (e) => {
      if (e.cancelable) e.preventDefault();
    };
    if (visible) {
      zoneRef.current.addEventListener('touchmove', preventDefault, { passive: false });
      zoneRef.current.addEventListener('touchstart', preventDefault, { passive: false });
      zoneRef.current.addEventListener('touchend', preventDefault, { passive: false });
    }
    if (visible) {
      const manager = nipplejs.create({
        zone: zoneRef.current,
        mode: 'dynamic',
        color: 'rgba(255, 255, 255, 0.85)',
        size: 130,
        restJoystick: true,
        multitouch: false,
        maxNumberOfNipples: 1,
        fadeTime: 100,
      });
      managerRef.current = manager;
      manager.on('start', () => {});
      manager.on('move', (_, data) => {
        const rawForce = Math.max(0, data.force || 0);
        const force = rawForce < DEADZONE ? 0 : Math.min(1, rawForce);
        const rad = data.angle?.radian ?? 0;
        targetRef.current = { force, angle: { radian: rad } };
      });
      manager.on('end', () => {
        targetRef.current = { force: 0, angle: { radian: smoothedRef.current.angle.radian } };
      });
    }
    const tick = () => {
      const s = smoothedRef.current;
      const t = targetRef.current;
      s.force += (t.force - s.force) * SMOOTHING;
      let delta = t.angle.radian - s.angle.radian;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      s.angle.radian = s.angle.radian + delta * SMOOTHING;
      if (joystickRef) {
        joystickRef.current = { force: s.force, angle: { radian: s.angle.radian } };
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
      if (zoneRef.current) {
        zoneRef.current.removeEventListener('touchmove', preventDefault);
        zoneRef.current.removeEventListener('touchstart', preventDefault);
        zoneRef.current.removeEventListener('touchend', preventDefault);
      }
    };
  }, [joystickRef, visible]);

  return zoneRef;
}
