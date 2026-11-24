import * as THREE from "three";

// Galaxia espiral de partículas, portada de galaxia.html.
// El shader hace la rotación diferencial, la repulsión del ratón y la onda expansiva.

export const GALAXY = {
  estrellas: 150000,
  radio: 9,
  brazos: 4,
  torsion: 0.9,
  dispersion: 0.35,
  concentracion: 3,
  colorInterior: "#ff9a3c",
  colorExterior: "#3a6bff",
  tamano: 28,
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3  uMouse;
  uniform float uMouseStrength;
  uniform vec3  uShockOrigin;
  uniform float uShockTime;

  attribute float aScale;
  attribute vec3  aRandom;

  varying vec3  vColor;
  varying float vBoost;

  void main() {
    vec3 p = position;

    // Rotación diferencial: el centro gira más rápido que los bordes
    float r = max(length(p.xz), 0.25);
    float ang = atan(p.z, p.x) + (1.0 / r) * uTime * 0.6;
    p.x = cos(ang) * r;
    p.z = sin(ang) * r;
    p += aRandom;

    // Repulsión del ratón (o de la nave)
    vec3 d = p - uMouse;
    float dist = length(d);
    float f = smoothstep(2.8, 0.0, dist) * uMouseStrength;
    p += normalize(d + vec3(0.0001)) * f * 1.6;
    p.y += f * 0.8;

    // Onda expansiva
    float sd = length(p.xz - uShockOrigin.xz);
    float frente = uShockTime * 9.0;
    float onda = exp(-pow((sd - frente) * 1.4, 2.0)) * exp(-uShockTime * 1.1);
    p.y += onda * 1.8;
    p.xz += normalize(p.xz - uShockOrigin.xz + vec2(0.0001)) * onda * 0.6;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mv.z) * (1.0 + onda * 1.5 + f);

    vColor = color;
    vBoost = onda * 2.5 + f * 1.5;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uShockColor;
  varying vec3  vColor;
  varying float vBoost;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float s = pow(1.0 - smoothstep(0.0, 0.5, d), 3.0);
    vec3 col = mix(vColor, uShockColor, clamp(vBoost * 0.5, 0.0, 0.8)) * (1.0 + vBoost);
    gl_FragColor = vec4(col * 0.35, s);
  }
`;

export type GalaxyUniforms = {
  uTime: { value: number };
  uSize: { value: number };
  uPixelRatio: { value: number };
  uMouse: { value: THREE.Vector3 };
  uMouseStrength: { value: number };
  uShockOrigin: { value: THREE.Vector3 };
  uShockTime: { value: number };
  uShockColor: { value: THREE.Color };
};

export function createGalaxy(pixelRatio: number) {
  const uniforms: GalaxyUniforms = {
    uTime: { value: 0 },
    uSize: { value: GALAXY.tamano },
    uPixelRatio: { value: pixelRatio },
    uMouse: { value: new THREE.Vector3(999, 0, 999) },
    uMouseStrength: { value: 0 },
    uShockOrigin: { value: new THREE.Vector3() },
    uShockTime: { value: 99 },
    uShockColor: { value: new THREE.Color(1, 1, 1) },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const n = GALAXY.estrellas;
  const pos = new Float32Array(n * 3);
  const rnd = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const esc = new Float32Array(n);
  const cIn = new THREE.Color(GALAXY.colorInterior);
  const cOut = new THREE.Color(GALAXY.colorExterior);
  const tmp = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const i3 = i * 3;
    const radio = Math.pow(Math.random(), 1.1) * GALAXY.radio;
    const brazo = ((i % GALAXY.brazos) / GALAXY.brazos) * Math.PI * 2;
    const giro = radio * GALAXY.torsion;

    pos[i3] = Math.cos(brazo + giro) * radio;
    pos[i3 + 1] = 0;
    pos[i3 + 2] = Math.sin(brazo + giro) * radio;

    const aleat = () =>
      Math.pow(Math.random(), GALAXY.concentracion) *
      (Math.random() < 0.5 ? 1 : -1) *
      GALAXY.dispersion *
      (radio + 0.5);
    rnd[i3] = aleat();
    rnd[i3 + 1] = aleat() * 0.6;
    rnd[i3 + 2] = aleat();

    tmp.copy(cIn).lerp(cOut, Math.min((radio / GALAXY.radio) * 1.3, 1));
    // algunas estrellas blancas/azuladas sueltas para dar textura
    if (Math.random() < 0.04) tmp.setRGB(0.9, 0.95, 1.0);
    col[i3] = tmp.r;
    col[i3 + 1] = tmp.g;
    col[i3 + 2] = tmp.b;

    esc[i] = Math.random() * 0.9 + 0.1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aRandom", new THREE.BufferAttribute(rnd, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aScale", new THREE.BufferAttribute(esc, 1));

  const points = new THREE.Points(geo, material);
  return { points, uniforms };
}

/** Esfera lejana de estrellas de fondo. */
export function createBackgroundStars() {
  const n = 6000;
  const p = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.randomDirection().multiplyScalar(60 + Math.random() * 60);
    p.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({
      size: 0.2,
      color: 0x8899cc,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
}
