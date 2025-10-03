import * as THREE from 'three';

const SKY_RADIUS = 5000;
const SUN_DISTANCE = 3000;
const MOON_DISTANCE = 2800;

function createRadialTexture({ innerColor, outerColor, size = 256, alpha = true }) {
  if (typeof document === 'undefined') {
    const data = new Uint8Array([255, 255, 255, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.anisotropy = 1;
    return texture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, alpha ? `${outerColor}00` : outerColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function createSkyEnvironment() {
  const uniforms = {
    topColor: { value: new THREE.Color('#74b6ff') },
    bottomColor: { value: new THREE.Color('#88c9ff') },
    nightTopColor: { value: new THREE.Color('#08163a') },
    nightBottomColor: { value: new THREE.Color('#0a2348') },
    horizonBlend: { value: 0.0 },
    duskFactor: { value: 0.0 },
    starIntensity: { value: 0.0 },
  };

  const skyGeometry = new THREE.SphereGeometry(SKY_RADIUS, 64, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 nightTopColor;
      uniform vec3 nightBottomColor;
      uniform float horizonBlend;
      uniform float duskFactor;
      uniform float starIntensity;

      float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        vec3 direction = normalize(vWorldPosition - cameraPosition);
        float h = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);

        vec3 dayGradient = mix(bottomColor, topColor, pow(h, 1.6));
        vec3 nightGradient = mix(nightBottomColor, nightTopColor, pow(h, 2.5));
        vec3 baseColor = mix(nightGradient, dayGradient, horizonBlend);

        // Warm dusk tint near horizon
        float horizon = smoothstep(0.0, 0.45, h);
        vec3 duskColor = mix(vec3(1.0, 0.58, 0.28), vec3(0.8, 0.35, 0.5), h);
        baseColor = mix(baseColor, duskColor, duskFactor * (1.0 - horizon));

        // Procedural stars
        float starNoise = rand(direction.xz * 100.0) * rand(direction.yx * 120.0);
        float stars = smoothstep(0.995, 1.0, starNoise);
        vec3 starColor = vec3(1.0) * stars * starIntensity;

        gl_FragColor = vec4(baseColor + starColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  skyMaterial.toneMapped = false;

  const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
  skyDome.name = 'SkyDome';
  skyDome.frustumCulled = false;

  const sunTexture = createRadialTexture({ innerColor: '#fff7c8', outerColor: '#ffcf33', size: 256 });
  const sunMaterial = new THREE.SpriteMaterial({
    map: sunTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const sunSprite = new THREE.Sprite(sunMaterial);
  sunSprite.scale.setScalar(180);
  sunSprite.name = 'SunSprite';
  sunSprite.userData.distance = SUN_DISTANCE;

  const moonTexture = createRadialTexture({ innerColor: '#f4f7ff', outerColor: '#b6c1d9', size: 256 });
  const moonMaterial = new THREE.SpriteMaterial({
    map: moonTexture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const moonSprite = new THREE.Sprite(moonMaterial);
  moonSprite.scale.setScalar(140);
  moonSprite.name = 'MoonSprite';
  moonSprite.userData.distance = MOON_DISTANCE;

  return {
    skyDome,
    sun: sunSprite,
    moon: moonSprite,
    uniforms,
  };
}
