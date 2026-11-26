import * as THREE from "three";

// Viaje de un pago (capítulo 5): una esfera de luz sale de tu estrella, espera en
// un anillo dorado mientras la red la confirma en un ledger y sigue hasta el destino.

type Phase = "idle" | "outbound" | "waiting" | "inbound" | "failed";

export type PaymentEvents = { confirmed: boolean; arrived: boolean };

const TRAIL = 260;
const VIOLET = new THREE.Color(0xd2b6ff);
const RED = new THREE.Color(0xff5b6b);
const GOLD = new THREE.Color(0xffc857);

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class PaymentFlight {
  readonly group = new THREE.Group();
  /** Posición actual de la esfera (para que la nave la siga). */
  readonly position = new THREE.Vector3();

  private orb: THREE.Sprite;
  private ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  private curve = new THREE.QuadraticBezierCurve3();
  private phase: Phase = "idle";
  private t = 0;
  private resolved: boolean | null = null;
  private fade = 0;
  private ringFlash = 0;

  private trailPos = new Float32Array(TRAIL * 3);
  private trailCol = new Float32Array(TRAIL * 3);
  private trailLife = new Float32Array(TRAIL);
  private trailIdx = 0;
  private trailGeo = new THREE.BufferGeometry();
  private color = new THREE.Color();

  constructor() {
    const tex = glowTexture();
    this.orb = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        color: VIOLET,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.orb.scale.setScalar(0.7);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.035, 10, 64),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0 }),
    );

    this.trailGeo.setAttribute("position", new THREE.BufferAttribute(this.trailPos, 3));
    this.trailGeo.setAttribute("color", new THREE.BufferAttribute(this.trailCol, 3));
    const trail = new THREE.Points(
      this.trailGeo,
      new THREE.PointsMaterial({
        size: 0.12,
        map: tex,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    trail.frustumCulled = false;

    this.group.add(this.orb, this.ring, trail);
    this.group.visible = false;
  }

  get active() {
    return this.phase !== "idle";
  }

  /** Empieza el viaje de `from` a `to`, en arco por encima de la galaxia. */
  start(from: THREE.Vector3, to: THREE.Vector3) {
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 1.8;
    this.curve.v0.copy(from);
    this.curve.v1.copy(mid);
    this.curve.v2.copy(to);
    this.phase = "outbound";
    this.t = 0;
    this.resolved = null;
    this.fade = 1;
    this.ringFlash = 0;
    this.trailLife.fill(0);
    this.group.visible = true;
  }

  /** La red respondió: `true` si confirmó la transacción. */
  resolve(ok: boolean) {
    if (this.phase === "idle") return;
    this.resolved = ok;
  }

  update(dt: number, t: number, cameraQuat: THREE.Quaternion): PaymentEvents {
    const events: PaymentEvents = { confirmed: false, arrived: false };
    if (this.phase === "idle" && this.fade <= 0) {
      this.group.visible = false;
      return events;
    }

    const HALF = 0.5;
    switch (this.phase) {
      case "outbound":
        this.t = Math.min(this.t + dt / 1.6, HALF);
        if (this.t >= HALF) this.phase = "waiting";
        break;
      case "waiting":
        // La esfera espera dentro del anillo a que la red la confirme
        if (this.resolved === true) {
          this.phase = "inbound";
          this.ringFlash = 1;
          events.confirmed = true;
        } else if (this.resolved === false) {
          this.phase = "failed";
        }
        break;
      case "inbound":
        this.t = Math.min(this.t + dt / 1.4, 1);
        if (this.t >= 1) {
          this.phase = "idle";
          events.arrived = true;
        }
        break;
      case "failed":
        this.fade = Math.max(0, this.fade - dt * 0.8);
        if (this.fade <= 0) this.phase = "idle";
        break;
      case "idle":
        this.fade = Math.max(0, this.fade - dt * 1.5);
        break;
    }

    // Si la red responde antes de que la esfera llegue al anillo, se resuelve al llegar
    if (this.phase === "outbound" && this.resolved === false) this.phase = "failed";

    this.curve.getPoint(this.t, this.position);
    const hover = this.phase === "waiting" ? Math.sin(t * 4) * 0.06 : 0;
    this.orb.position.copy(this.position).y += hover;

    const failed = this.phase === "failed";
    this.color.copy(failed ? RED : VIOLET);
    const orbMat = this.orb.material as THREE.SpriteMaterial;
    orbMat.color.copy(this.color);
    orbMat.opacity = this.fade;
    const pulse = this.phase === "waiting" ? 1 + Math.sin(t * 6) * 0.15 : 1;
    this.orb.scale.setScalar(0.7 * pulse * (failed ? 0.6 + this.fade * 0.4 : 1));

    // Anillo del ledger en el punto medio: aparece mientras se espera y destella al confirmar
    this.ringFlash = Math.max(0, this.ringFlash - dt * 1.2);
    const ringVisible = this.phase === "waiting" || this.ringFlash > 0;
    const ringMat = this.ring.material;
    const target = ringVisible ? (this.phase === "waiting" ? 0.55 + Math.sin(t * 3) * 0.2 : this.ringFlash) : 0;
    ringMat.opacity += (target - ringMat.opacity) * (1 - Math.exp(-dt * 8));
    ringMat.color.copy(failed ? RED : GOLD);
    this.ring.position.copy(this.curve.getPoint(HALF));
    this.ring.quaternion.copy(cameraQuat);
    this.ring.scale.setScalar(1 + (this.ringFlash > 0 ? (1 - this.ringFlash) * 1.5 : 0));

    // Estela
    if (this.phase === "outbound" || this.phase === "inbound") {
      for (let k = 0; k < 3; k++) {
        const i = this.trailIdx;
        this.trailIdx = (this.trailIdx + 1) % TRAIL;
        this.trailPos[i * 3] = this.position.x + (Math.random() - 0.5) * 0.06;
        this.trailPos[i * 3 + 1] = this.position.y + (Math.random() - 0.5) * 0.06;
        this.trailPos[i * 3 + 2] = this.position.z + (Math.random() - 0.5) * 0.06;
        this.trailLife[i] = 1;
      }
    }
    for (let i = 0; i < TRAIL; i++) {
      if (this.trailLife[i] <= 0) continue;
      this.trailLife[i] = Math.max(0, this.trailLife[i] - dt * 0.7);
      const b = this.trailLife[i] * 0.7;
      this.trailCol[i * 3] = this.color.r * b;
      this.trailCol[i * 3 + 1] = this.color.g * b;
      this.trailCol[i * 3 + 2] = this.color.b * b;
    }
    this.trailGeo.attributes.position.needsUpdate = true;
    this.trailGeo.attributes.color.needsUpdate = true;

    return events;
  }
}
