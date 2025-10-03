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
const daySkyTopColor = new THREE.Color('#7cc4ff');
const daySkyBottomColor = new THREE.Color('#cde9ff');
const duskSkyTopColor = new THREE.Color('#ff9159');
const duskSkyBottomColor = new THREE.Color('#ffd6a6');
const nightSkyTopColor = new THREE.Color('#07112c');
const nightSkyBottomColor = new THREE.Color('#030a17');
const moonGlowColor = new THREE.Color('#f4f6ff');

const tmpSunColor = new THREE.Color();
const tmpAmbientColor = new THREE.Color();
const tmpSkyColor = new THREE.Color();
const tmpFogColor = new THREE.Color();
const tmpOffset = new THREE.Vector3();
const tmpWindowColor = new THREE.Color();
const tmpWindowEmissive = new THREE.Color();
const tmpSkyTop = new THREE.Color();
const tmpSkyBottom = new THREE.Color();
const tmpNightTop = new THREE.Color();
const tmpNightBottom = new THREE.Color();
const tmpSunGlow = new THREE.Color();
const tmpMoonColor = new THREE.Color();
const tmpSunDirection = new THREE.Vector3();
const tmpMoonDirection = new THREE.Vector3();

const KITBASH_DAY_START = 6;
const KITBASH_EVENING_START = 18;
const KITBASH_LATE_NIGHT_START = 22;
const KITBASH_LIGHT_ON_COLOR = new THREE.Color('#ffd97a');
const KITBASH_LIGHT_EMISSIVE = new THREE.Color('#fff3b0');

const KITBASH_LIGHTING_PHASE = {
  DAY: 'day',
  EVENING: 'evening',
  LATE_NIGHT: 'late-night'
};

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
  const nightBlend = 1 - daylightBlend;

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

  const sky = directionalLight.userData?.sky;
  if (sky) {
    const { uniforms, sun, moon } = sky;
    if (uniforms) {
      tmpSkyTop.copy(daySkyTopColor).lerp(duskSkyTopColor, combinedWarm * 0.7);
      tmpSkyBottom.copy(daySkyBottomColor).lerp(duskSkyBottomColor, combinedWarm * 0.9);
      tmpNightTop.copy(nightSkyTopColor);
      tmpNightBottom.copy(nightSkyBottomColor);

      uniforms.topColor.value.copy(tmpSkyTop);
      uniforms.bottomColor.value.copy(tmpSkyBottom);
      uniforms.nightTopColor.value.copy(tmpNightTop);
      uniforms.nightBottomColor.value.copy(tmpNightBottom);
      uniforms.horizonBlend.value = clamp01(0.1 + daylightBlend * 0.9);
      uniforms.duskFactor.value = clamp01(combinedWarm * 0.8 + twilightBlend * 0.4);
      const starIntensity = clamp01(Math.pow(nightBlend, 1.4) + Math.max(0, twilightBlend - 0.3) * 0.5);
      uniforms.starIntensity.value = starIntensity;
    }

    if (sun?.material) {
      const opacity = clamp01(0.15 + daylightBlend * 0.9 + combinedWarm * 0.3);
      sun.material.opacity = opacity;
      sun.visible = opacity > 0.02;
      if (sun.material.color) {
        sun.material.color.copy(tmpSunGlow.copy(daySunColor).lerp(sunsetSunColor, combinedWarm));
      }
    }

    if (moon?.material) {
      const moonStrength = clamp01(Math.pow(nightBlend, 1.2) + Math.max(0, twilightBlend - 0.4) * 0.2);
      moon.material.opacity = 0.1 + moonStrength * 0.9;
      moon.visible = moon.material.opacity > 0.05;
      if (moon.material.color) {
        moon.material.color.copy(tmpMoonColor.copy(moonGlowColor).lerp(nightSunColor, 0.25));
      }
    }
  }

  if (scene?.fog?.color && scene.fog.color.isColor) {
    tmpFogColor.copy(nightSkyColor).lerp(daySkyColor, daylightBlend * 0.8);
    scene.fog.color.copy(tmpFogColor);
  }

  if (scene) {
    updateKitbashWindowLighting({ scene, hour, lightUserData: directionalLight.userData });
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

    const sunDir = tmpSunDirection.copy(tmpOffset).normalize();
    if (!directionalLight.userData.sunDirection || !directionalLight.userData.sunDirection.isVector3) {
      directionalLight.userData.sunDirection = sunDir.clone();
    } else {
      directionalLight.userData.sunDirection.copy(sunDir);
    }

    const moonDir = tmpMoonDirection.copy(sunDir).multiplyScalar(-1);
    if (!directionalLight.userData.moonDirection || !directionalLight.userData.moonDirection.isVector3) {
      directionalLight.userData.moonDirection = moonDir.clone();
    } else {
      directionalLight.userData.moonDirection.copy(moonDir);
    }

    directionalLight.userData.daylightBlend = daylightBlend;
    directionalLight.userData.twilightBlend = twilightBlend;
    directionalLight.userData.nightBlend = nightBlend;
    directionalLight.userData.sunWarmth = combinedWarm;
  }
}

function getLightingPhase(hour) {
  if (hour >= KITBASH_LATE_NIGHT_START || hour < KITBASH_DAY_START) {
    return KITBASH_LIGHTING_PHASE.LATE_NIGHT;
  }
  if (hour >= KITBASH_EVENING_START) {
    return KITBASH_LIGHTING_PHASE.EVENING;
  }
  return KITBASH_LIGHTING_PHASE.DAY;
}

function ensureKitbashBuildingInfo(building) {
  if (!building.userData) building.userData = {};
  if (!building.userData.__kitbashWindowLighting) {
    building.userData.__kitbashWindowLighting = {};
  }
  return building.userData.__kitbashWindowLighting;
}

function collectKitbashBuildings(scene) {
  const buildings = [];
  scene.traverse(obj => {
    if (!obj?.userData?.isBuilding || !obj.userData.paletteName) return;
    const info = ensureKitbashBuildingInfo(obj);
    if (!info.materials || info.materials.length === 0) {
      const materials = new Set();
      obj.traverse(child => {
        if (!child?.isMesh) return;
        if (child.userData?.role !== 'window' || !child.material) return;
        const mat = child.material;
        materials.add(mat);
        mat.userData = mat.userData || {};
        if (!mat.userData.__kitbashWindowBase) {
          mat.userData.__kitbashWindowBase = {
            color: mat.color?.clone?.() || new THREE.Color(0xffffff),
            emissive: mat.emissive?.clone?.() || new THREE.Color(0x000000),
            intensity: typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : 0.7
          };
        }
      });
      info.materials = Array.from(materials);
      info.lastAppliedState = undefined;
      info.nightCycleId = undefined;
      info.nightLightsOn = undefined;
    }
    if (info.materials && info.materials.length > 0) {
      buildings.push({ building: obj, info });
    }
  });
  return buildings;
}

function applyMaterialState(materials, state) {
  for (const material of materials) {
    const base = material?.userData?.__kitbashWindowBase;
    if (!base) continue;

    if (state === 'day') {
      material.color.copy(base.color);
      material.emissive.copy(base.emissive);
      material.emissiveIntensity = base.intensity;
    } else if (state === 'night-on') {
      material.color.copy(tmpWindowColor.copy(base.color).lerp(KITBASH_LIGHT_ON_COLOR, 0.85));
      material.emissive.copy(KITBASH_LIGHT_EMISSIVE);
      material.emissiveIntensity = 1.4;
    } else if (state === 'night-off') {
      material.color.copy(tmpWindowColor.copy(base.color).multiplyScalar(0.4));
      material.emissive.copy(tmpWindowEmissive.copy(base.emissive || base.color).multiplyScalar(0.15));
      material.emissiveIntensity = 0.05;
    }

    material.needsUpdate = true;
  }
}

function updateKitbashWindowLighting({ scene, hour, lightUserData }) {
  const buildings = collectKitbashBuildings(scene);
  if (!buildings.length) return;

  if (!lightUserData.__kitbashLightingState) {
    lightUserData.__kitbashLightingState = {
      phase: null,
      nightCycleId: 0,
      nightOnProbability: 0.3
    };
  }

  const lightingState = lightUserData.__kitbashLightingState;
  const phase = getLightingPhase(hour);
  if (lightingState.phase !== phase) {
    if (phase === KITBASH_LIGHTING_PHASE.LATE_NIGHT) {
      lightingState.nightCycleId += 1;
    }
    lightingState.phase = phase;
  }

  for (const { info } of buildings) {
    if (!info.materials || info.materials.length === 0) continue;

    if (phase === KITBASH_LIGHTING_PHASE.LATE_NIGHT) {
      if (info.nightCycleId !== lightingState.nightCycleId) {
        info.nightCycleId = lightingState.nightCycleId;
        info.nightLightsOn = Math.random() < lightingState.nightOnProbability;
      }
      const desiredState = info.nightLightsOn ? 'night-on' : 'night-off';
      if (info.lastAppliedState !== desiredState) {
        applyMaterialState(info.materials, desiredState);
        info.lastAppliedState = desiredState;
      }
    } else {
      const desiredState = phase === KITBASH_LIGHTING_PHASE.EVENING ? 'night-on' : 'day';
      if (info.lastAppliedState !== desiredState) {
        applyMaterialState(info.materials, desiredState);
        info.lastAppliedState = desiredState;
      }
      info.nightCycleId = undefined;
      info.nightLightsOn = undefined;
    }
  }
}

