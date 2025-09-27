import * as THREE from 'three';

const HOURS_PER_DAY = 24;

const daySkyColor = new THREE.Color(0x87ceeb);
const nightSkyColor = new THREE.Color(0x050b1a);
const daySunColor = new THREE.Color(0xffffff);
const nightSunColor = new THREE.Color(0x223655);
const sunsetSunColor = new THREE.Color(0xffc98a);
const dayAmbientColor = new THREE.Color(0xfefefe);
const nightAmbientColor = new THREE.Color(0x111a26);
const warmAmbientColor = new THREE.Color(0xffd9a3);

const tmpSunColor = new THREE.Color();
const tmpAmbientColor = new THREE.Color();
const tmpSkyColor = new THREE.Color();
const tmpFogColor = new THREE.Color();
const tmpOffset = new THREE.Vector3();

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (edge0, edge1, x) => {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export function applyDayNightCycle({ scene, directionalLight, ambientLight, timeOfDayHours = 12 }) {
  if (!directionalLight) return;
  const hour = ((timeOfDayHours % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;

  const daylightBlend = clamp01(smoothstep(6, 7, hour) - smoothstep(19, 20, hour));
  const twilightBlend = clamp01(smoothstep(5, 6, hour) + (1 - smoothstep(20, 21, hour)));
  const brightnessFloor = 0.12;
  const brightness = brightnessFloor + daylightBlend * (1 - brightnessFloor);

  const sunriseWarm = clamp01(1 - Math.abs(hour - 6) / 2);
  const sunsetWarm = clamp01(1 - Math.abs(hour - 18) / 2);
  const warmMix = Math.max(sunriseWarm, sunsetWarm);
  const combinedWarm = Math.max(warmMix, twilightBlend * 0.5);

  const sunColor = tmpSunColor.copy(nightSunColor)
    .lerp(daySunColor, daylightBlend)
    .lerp(sunsetSunColor, combinedWarm);
  directionalLight.color.copy(sunColor);
  directionalLight.intensity = 0.15 + daylightBlend * 1.35;

  if (ambientLight) {
    const ambientColor = tmpAmbientColor.copy(nightAmbientColor)
      .lerp(dayAmbientColor, daylightBlend)
      .lerp(warmAmbientColor, combinedWarm * 0.6);
    ambientLight.color.copy(ambientColor);
    ambientLight.intensity = 0.18 + daylightBlend * 0.5;
  }

  if (scene?.background && scene.background.isColor) {
    tmpSkyColor.copy(nightSkyColor).lerp(daySkyColor, daylightBlend);
    if (combinedWarm > 0) {
      tmpSkyColor.lerp(sunsetSunColor, combinedWarm * 0.2);
    }
    scene.background.copy(tmpSkyColor);
  }

  if (scene?.fog?.color && scene.fog.color.isColor) {
    tmpFogColor.copy(nightSkyColor).lerp(daySkyColor, daylightBlend * 0.8);
    scene.fog.color.copy(tmpFogColor);
  }

  const defaultOffset = directionalLight.userData?.defaultOffset;
  if (defaultOffset) {
    const radius = directionalLight.userData.horizontalRadius || Math.hypot(defaultOffset.x, defaultOffset.z) || 1;
    directionalLight.userData.horizontalRadius = radius;

    const azimuth = (hour / HOURS_PER_DAY) * Math.PI * 2 - Math.PI / 2;
    const elevationRaw = Math.sin(((hour - 6) / HOURS_PER_DAY) * Math.PI * 2);
    const elevationFactor = clamp01((elevationRaw + 1) / 2);
    const minHeight = Math.max(10, defaultOffset.y * 0.25);
    const height = THREE.MathUtils.lerp(minHeight, defaultOffset.y, elevationFactor);

    tmpOffset.set(
      Math.cos(azimuth) * radius,
      height,
      Math.sin(azimuth) * radius
    );

    if (!directionalLight.userData.sunOffset || !directionalLight.userData.sunOffset.isVector3) {
      directionalLight.userData.sunOffset = tmpOffset.clone();
    } else {
      directionalLight.userData.sunOffset.copy(tmpOffset);
    }
  }
}

