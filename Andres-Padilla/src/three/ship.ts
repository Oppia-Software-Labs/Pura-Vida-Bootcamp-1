import * as THREE from "three";

// Nave espacial hecha con primitivas, con estela de partículas y física de vuelo.
// Portada de galaxia.html.

export type ShipInput = {
  acel: number; // -0.6 … 1
  yaw: number; // -1 … 1
  pitch: number; // -1 … 1
  roll: number; // -1 … 1
  turbo: boolean;
  freno: boolean;
};

export const NO_INPUT: ShipInput = { acel: 0, yaw: 0, pitch: 0, roll: 0, turbo: false, freno: false };

const RASTRO = 2000;
const UNIVERSE_LIMIT = 38;

function buildModel() {
  const nave = new THREE.Group();
  const modelo = new THREE.Group(); // se inclina visualmente al girar
  nave.add(modelo);

  const casco = new THREE.MeshStandardMaterial({ color: 0x9aa3b2, metalness: 0.5, roughness: 0.4 });
  const oscuro = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, metalness: 0.5, roughness: 0.5 });
  const acento = new THREE.MeshStandardMaterial({
    color: 0xff5a1f,
    metalness: 0.3,
    roughness: 0.4,
    emissive: 0x501000,
  });
  const cristal = new THREE.MeshStandardMaterial({
    color: 0x113355,
    metalness: 0.9,
    roughness: 0.05,
    emissive: 0x1a66ff,
    emissiveIntensity: 0.6,
  });

  // Fuselaje + morro (el frente de la nave es -Z)
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 1.3, 20), casco);
  cuerpo.rotation.x = -Math.PI / 2;
  modelo.add(cuerpo);
  const morro = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.6, 20), casco);
  morro.rotation.x = -Math.PI / 2;
  morro.position.z = -0.95;
  modelo.add(morro);
  const franja = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 32), acento);
  franja.position.z = -0.2;
  modelo.add(franja);

  // Cabina
  const cabina = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), cristal);
  cabina.scale.set(1, 0.75, 2.4);
  cabina.position.set(0, 0.1, -0.42);
  modelo.add(cabina);

  // Alas en flecha (forma extruida, reflejada para el otro lado)
  const forma = new THREE.Shape();
  forma.moveTo(0, -0.35);
  forma.lineTo(0.95, 0.3);
  forma.lineTo(0.95, 0.45);
  forma.lineTo(0, 0.5);
  forma.closePath();
  const geoAla = new THREE.ExtrudeGeometry(forma, { depth: 0.035, bevelEnabled: false });
  geoAla.rotateX(Math.PI / 2);
  for (const lado of [-1, 1]) {
    const ala = new THREE.Mesh(geoAla, casco);
    ala.scale.x = lado;
    ala.position.set(lado * 0.1, 0.0, 0.05);
    modelo.add(ala);
    const punta = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.32), acento);
    punta.position.set(lado * 1.05, -0.015, 0.47);
    modelo.add(punta);
    const luzNav = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      new THREE.MeshBasicMaterial({ color: lado < 0 ? 0xff2244 : 0x22ff88 }),
    );
    luzNav.position.set(lado * 1.05, -0.015, 0.3);
    modelo.add(luzNav);
  }

  // Aleta de cola
  const formaCola = new THREE.Shape();
  formaCola.moveTo(0, 0);
  formaCola.lineTo(0.45, 0);
  formaCola.lineTo(0.5, 0.38);
  formaCola.lineTo(0.32, 0.38);
  formaCola.closePath();
  const geoCola = new THREE.ExtrudeGeometry(formaCola, { depth: 0.03, bevelEnabled: false });
  geoCola.rotateY(-Math.PI / 2);
  const cola = new THREE.Mesh(geoCola, acento);
  cola.position.set(0.015, 0.12, 0.15);
  modelo.add(cola);

  // Motores con llamas
  const llamas: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = [];
  const toberas: THREE.Object3D[] = [];
  for (const lado of [-1, 1]) {
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.45, 16), oscuro);
    motor.rotation.x = Math.PI / 2;
    motor.position.set(lado * 0.26, -0.02, 0.45);
    modelo.add(motor);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 8, 24), acento);
    aro.position.set(lado * 0.26, -0.02, 0.67);
    modelo.add(aro);
    const brillo = new THREE.Mesh(
      new THREE.CircleGeometry(0.075, 20),
      new THREE.MeshBasicMaterial({ color: 0x3f8fd0 }),
    );
    brillo.position.set(lado * 0.26, -0.02, 0.681);
    modelo.add(brillo);

    const geoLlama = new THREE.ConeGeometry(0.07, 0.6, 16, 1, true);
    geoLlama.rotateX(Math.PI / 2);
    geoLlama.translate(0, 0, 0.3);
    const llama = new THREE.Mesh(
      geoLlama,
      new THREE.MeshBasicMaterial({
        color: 0x55bbff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    llama.position.set(lado * 0.26, -0.02, 0.68);
    modelo.add(llama);
    llamas.push(llama);

    const tobera = new THREE.Object3D();
    tobera.position.set(lado * 0.26, -0.02, 0.8);
    modelo.add(tobera);
    toberas.push(tobera);
  }
  const luzMotor = new THREE.PointLight(0x66ccff, 0.3, 1.5, 2);
  luzMotor.position.set(0, 0, 1.0);
  modelo.add(luzMotor);

  nave.scale.setScalar(0.35);
  return { nave, modelo, llamas, toberas, luzMotor };
}

/** Textura circular difusa para que las partículas no sean cuadradas. */
function makePointTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Ship {
  readonly group: THREE.Group;
  readonly trail: THREE.Points;
  readonly velocity = new THREE.Vector3();

  private modelo: THREE.Group;
  private llamas: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[];
  private toberas: THREE.Object3D[];
  private luzMotor: THREE.PointLight;
  private giro = { yaw: 0, pitch: 0, roll: 0 };
  private empuje = 0;

  private rPos = new Float32Array(RASTRO * 3);
  private rCol = new Float32Array(RASTRO * 3);
  private rVida = new Float32Array(RASTRO);
  private rIdx = 0;
  private geoRastro = new THREE.BufferGeometry();
  private colRastro = new THREE.Color(0x55bbff);
  private colTurbo = new THREE.Color(0xff7a2a);
  private colActual = new THREE.Color();

  private _fwd = new THREE.Vector3();
  private _tmp = new THREE.Vector3();
  private _look = new THREE.Vector3();
  private _m = new THREE.Matrix4();
  private _q = new THREE.Quaternion();

  constructor() {
    const m = buildModel();
    this.group = m.nave;
    this.modelo = m.modelo;
    this.llamas = m.llamas;
    this.toberas = m.toberas;
    this.luzMotor = m.luzMotor;

    this.geoRastro.setAttribute("position", new THREE.BufferAttribute(this.rPos, 3));
    this.geoRastro.setAttribute("color", new THREE.BufferAttribute(this.rCol, 3));
    this.trail = new THREE.Points(
      this.geoRastro,
      new THREE.PointsMaterial({
        size: 0.06,
        map: makePointTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.trail.frustumCulled = false;
  }

  /** Dirección hacia la que apunta el morro. */
  forward(out = new THREE.Vector3()) {
    return out.set(0, 0, -1).applyQuaternion(this.group.quaternion);
  }

  /**
   * Avanza la simulación un frame.
   * `piloted` indica si alguien la controla (si no, flota en reposo).
   */
  update(dt: number, t: number, input: ShipInput, piloted: boolean) {
    const s = 1 - Math.exp(-dt * 6);
    const g = this.giro;
    g.yaw += (input.yaw - g.yaw) * s;
    g.pitch += (input.pitch - g.pitch) * s;
    g.roll += (input.roll - g.roll) * s;

    const nave = this.group;
    nave.rotateY(g.yaw * dt * 1.6);
    nave.rotateX(g.pitch * dt * 1.3);
    nave.rotateZ(g.roll * dt * 2.2);

    this.forward(this._fwd);
    this.velocity.addScaledVector(this._fwd, input.acel * (input.turbo ? 10 : 4) * dt);
    this.velocity.multiplyScalar(Math.exp(-dt * (input.freno ? 3 : 0.7)));
    nave.position.addScaledVector(this.velocity, dt);

    // Límite suave del universo
    if (nave.position.length() > UNIVERSE_LIMIT) {
      nave.position.setLength(UNIVERSE_LIMIT);
      this.velocity.multiplyScalar(0.3);
    }

    // Inclinación visual al girar
    this.modelo.rotation.z += (g.yaw * 0.6 - this.modelo.rotation.z) * s;
    this.modelo.rotation.x += (g.pitch * 0.15 - this.modelo.rotation.x) * s;

    const thrust = Math.max(input.acel, 0) * (input.turbo ? 1.8 : 1);
    this.effects(dt, t, thrust, piloted);
  }

  /**
   * Vuela sola hacia `target`, frenando al llegar.
   * Se usa para moverse entre capítulos sin que nadie la pilote.
   */
  autopilot(dt: number, t: number, target: THREE.Vector3) {
    const nave = this.group;
    const toTarget = this._tmp.subVectors(target, nave.position);
    const dist = toTarget.length();

    // Velocidad deseada: rápida lejos, suave cerca (llegada amortiguada)
    const desiredSpeed = Math.min(dist * 1.2, 5);
    if (dist > 0.001) toTarget.multiplyScalar(desiredSpeed / dist);
    else toTarget.set(0, 0, 0);
    this.velocity.lerp(toTarget, 1 - Math.exp(-dt * 2.5));
    nave.position.addScaledVector(this.velocity, dt);

    // Apunta el morro hacia donde se mueve
    const speed = this.velocity.length();
    if (speed > 0.2) {
      this._look.copy(nave.position).add(this.velocity);
      this._m.lookAt(nave.position, this._look, nave.up);
      this._q.setFromRotationMatrix(this._m);
      nave.quaternion.slerp(this._q, 1 - Math.exp(-dt * 4));
    }

    // Sin giros manuales: el modelo vuelve a su posición neutra
    this.giro.yaw = this.giro.pitch = this.giro.roll = 0;
    const s = 1 - Math.exp(-dt * 4);
    this.modelo.rotation.z += (0 - this.modelo.rotation.z) * s;
    this.modelo.rotation.x += (0 - this.modelo.rotation.x) * s;

    this.effects(dt, t, Math.min(speed / 3, 1.6), false);
  }

  /** Llamas, luz del motor, estela y flotación. `thrust` va de 0 a ~1.8. */
  private effects(dt: number, t: number, thrust: number, piloted: boolean) {
    const s = 1 - Math.exp(-dt * 6);
    this.modelo.position.y = piloted ? 0 : Math.sin(t * 1.5) * 0.2;

    // Motores
    const objetivo = 0.25 + thrust;
    this.empuje += (objetivo - this.empuje) * s;
    this.colActual
      .copy(this.colRastro)
      .lerp(this.colTurbo, THREE.MathUtils.clamp((this.empuje - 1) / 0.8, 0, 1));
    for (const l of this.llamas) {
      const e = this.empuje;
      l.scale.set(1 + e * 0.25, 1 + e * 0.25, 0.3 + e * 1.7 + Math.random() * 0.15);
      l.material.color.copy(this.colActual);
    }
    this.luzMotor.intensity = 0.2 + this.empuje * 0.6;
    this.luzMotor.color.copy(this.colActual);
    if (this.empuje > 0.35) {
      for (const tb of this.toberas) {
        tb.getWorldPosition(this._tmp);
        this.emit(this._tmp, Math.ceil(this.empuje * 2), Math.min(this.empuje, 1.6) * 0.7);
      }
    }
    this.updateTrail(dt);
  }

  private emit(p: THREE.Vector3, n: number, vida: number) {
    for (let k = 0; k < n; k++) {
      const i = this.rIdx;
      this.rIdx = (this.rIdx + 1) % RASTRO;
      this.rPos[i * 3] = p.x + (Math.random() - 0.5) * 0.04;
      this.rPos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.04;
      this.rPos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.04;
      this.rVida[i] = vida;
    }
  }

  private updateTrail(dt: number) {
    const c = this.colActual;
    for (let i = 0; i < RASTRO; i++) {
      if (this.rVida[i] <= 0) continue;
      this.rVida[i] = Math.max(0, this.rVida[i] - dt * 0.8);
      const b = this.rVida[i] * 0.6;
      this.rCol[i * 3] = c.r * b;
      this.rCol[i * 3 + 1] = c.g * b;
      this.rCol[i * 3 + 2] = c.b * b;
    }
    this.geoRastro.attributes.position.needsUpdate = true;
    this.geoRastro.attributes.color.needsUpdate = true;
  }
}
