import * as THREE from "three";

// Estrella que representa una cuenta de Stellar (capítulos 3 a 5).
// - Sin conectar: un hueco punteado ("aquí nacerá tu cuenta").
// - Conectada sin fondos: estrella gris, apagada.
// - Con fondos: estrella encendida; su tamaño crece con el saldo.

export type StarState = {
  connected: boolean;
  /** undefined = aún no se sabe · false = sin fondos · true = existe en la red */
  funded: boolean | undefined;
  balance: number;
  address: string;
};

export type StarEvents = { birth: boolean; ignite: boolean };

const GREY = new THREE.Color(0x6b7390);
const WHITE = new THREE.Color(0xffffff);

function radialTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.6)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.15)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** Candado dibujado a mano: representa la clave secreta. */
function lockTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.strokeStyle = "#ffffff";
  g.fillStyle = "#ffffff";
  g.lineWidth = 10;
  g.shadowColor = "rgba(255,200,120,0.9)";
  g.shadowBlur = 10;
  g.beginPath();
  g.arc(64, 52, 22, Math.PI, 0);
  g.stroke();
  g.fillRect(34, 56, 60, 46);
  g.clearRect(60, 70, 8, 18);
  return new THREE.CanvasTexture(c);
}

function textSprite(width = 512, height = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  return { sprite, canvas, texture };
}

export class AccountStar {
  readonly group = new THREE.Group();

  private color: THREE.Color;
  private core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private halo: THREE.Sprite;
  private corona: THREE.Sprite;
  private shell: THREE.LineSegments<THREE.WireframeGeometry, THREE.LineBasicMaterial>;
  private lock: THREE.Sprite;
  private label = textSprite();
  private labelKey = "";
  private placeholder: THREE.LineLoop<THREE.BufferGeometry, THREE.LineDashedMaterial>;
  private placeholderLabel = textSprite();
  private burst: THREE.Sprite;
  private beam: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private beamFrom: THREE.Vector3;

  private state: StarState = { connected: false, funded: undefined, balance: 0, address: "" };
  private presence = 0; // 0 = no hay estrella, 1 = nacida
  private glow = 0; // 0 = apagada, 1 = encendida
  private burstT = 1;
  private beamT = 1;
  private pendingBirth = false;
  private pendingIgnite = false;
  private _c = new THREE.Color();

  /** Si se enciende con el rayo de Friendbot (tu cuenta) o directamente (el destino del pago). */
  private igniteWithBeam: boolean;

  constructor(opts: { color: number; placeholder: string; name: string; igniteWithBeam?: boolean }) {
    this.color = new THREE.Color(opts.color);
    this.igniteWithBeam = opts.igniteWithBeam ?? true;
    const tex = radialTexture();

    this.core = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 24),
      new THREE.MeshBasicMaterial({ color: this.color, transparent: true }),
    );

    const spriteMat = (opacity: number) =>
      new THREE.SpriteMaterial({
        map: tex,
        color: this.color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    this.halo = new THREE.Sprite(spriteMat(0.9));
    this.halo.scale.setScalar(1.6);
    this.corona = new THREE.Sprite(spriteMat(0.35));
    this.corona.scale.setScalar(4);

    // Capa exterior: la clave pública, visible para todos
    this.shell = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.55, 1)),
      new THREE.LineBasicMaterial({ color: this.color, transparent: true, opacity: 0.35 }),
    );

    // Núcleo con candado: la clave secreta, que nunca sale de la wallet
    this.lock = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: lockTexture(),
        color: 0x2a1d10,
        transparent: true,
        depthWrite: false,
        depthTest: false, // se dibuja encima del núcleo, como si se viera a través
      }),
    );
    this.lock.renderOrder = 10;
    this.lock.scale.setScalar(0.2);
    this.lock.position.y = 0.02;

    this.label.sprite.scale.set(1.9, 0.48, 1);
    this.label.sprite.position.y = -0.95;

    // Hueco punteado mientras no hay cuenta
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0));
    }
    this.placeholder = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineDashedMaterial({
        color: this.color,
        dashSize: 0.08,
        gapSize: 0.06,
        transparent: true,
        opacity: 0.8,
      }),
    );
    this.placeholder.computeLineDistances();
    this.drawPlaceholder(opts.placeholder);
    this.placeholderLabel.sprite.scale.set(2.2, 0.55, 1);
    this.placeholderLabel.sprite.position.y = -0.95;

    // Destello al nacer o encenderse
    this.burst = new THREE.Sprite(spriteMat(0));
    this.burst.material = this.burst.material.clone();
    this.burst.material.color.set(0xffffff);

    // Rayo de luz que trae los fondos (Friendbot) desde lejos
    this.beamFrom = new THREE.Vector3(-14, 10, -12);
    this.beam = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineBasicMaterial({ color: 0xffe3a1, transparent: true, opacity: 0 }),
    );
    this.beam.frustumCulled = false;

    this.group.add(
      this.corona,
      this.halo,
      this.core,
      this.shell,
      this.lock,
      this.label.sprite,
      this.placeholder,
      this.placeholderLabel.sprite,
      this.burst,
      this.beam,
    );
    this.group.userData.name = opts.name;
  }

  /**
   * Repite la llegada de los fondos: la estrella se apaga, llega el rayo y se
   * enciende de nuevo. Sirve cuando la cuenta ya tenía XLM antes del viaje.
   */
  replayFunding() {
    if (!this.state.connected || this.state.funded !== true || !this.igniteWithBeam) return;
    this.beamT = 0;
    this.glow = 0;
  }

  setPosition(p: THREE.Vector3) {
    this.group.position.copy(p);
  }

  setState(next: StarState) {
    const prev = this.state;
    if (!prev.connected && next.connected) this.pendingBirth = true;
    if (next.connected && prev.funded === false && next.funded === true) this.pendingIgnite = true;
    this.state = next;
    this.drawLabel();
  }

  /** Mira hacia la cámara los elementos planos. */
  update(dt: number, t: number, cameraQuat: THREE.Quaternion): StarEvents {
    const s = this.state;
    const events: StarEvents = { birth: false, ignite: false };

    if (this.pendingBirth) {
      this.pendingBirth = false;
      this.burstT = 0;
      events.birth = true;
    }
    if (this.pendingIgnite) {
      this.pendingIgnite = false;
      if (this.igniteWithBeam) {
        this.beamT = 0;
      } else {
        // El pago ya llegó: se enciende al instante con un destello
        this.burstT = 0;
        events.ignite = true;
      }
    }

    const k = (rate: number) => 1 - Math.exp(-dt * rate);
    this.presence += ((s.connected ? 1 : 0) - this.presence) * k(3);
    const lit = s.connected && s.funded === true;
    // Al recibir fondos, la estrella espera a que llegue el rayo antes de encenderse
    const beamArrived = this.beamT >= 0.55;
    this.glow += ((lit && beamArrived ? 1 : 0) - this.glow) * k(2.5);

    const sizeBoost = lit ? Math.min(Math.log10(s.balance + 1) * 0.08, 0.4) : 0;
    const p = this.presence;
    const breathe = 1 + Math.sin(t * 2.2) * 0.04 * (0.3 + this.glow);
    const scale = p * (0.75 + this.glow * 0.25 + sizeBoost) * breathe;

    this._c.copy(GREY).lerp(this.color, this.glow);
    this.core.material.color.copy(this._c).lerp(WHITE, this.glow * 0.35);
    this.core.material.opacity = p;
    this.core.scale.setScalar(Math.max(scale, 0.0001));
    (this.halo.material as THREE.SpriteMaterial).color.copy(this._c);
    (this.halo.material as THREE.SpriteMaterial).opacity = p * (0.3 + this.glow * 0.4);
    this.halo.scale.setScalar(1.6 * Math.max(scale, 0.0001));
    (this.corona.material as THREE.SpriteMaterial).color.copy(this._c);
    (this.corona.material as THREE.SpriteMaterial).opacity = p * this.glow * 0.22;
    this.corona.scale.setScalar(3 * Math.max(scale, 0.0001) * (1 + Math.sin(t * 0.7) * 0.05));

    this.shell.material.color.copy(this._c);
    this.shell.material.opacity = p * (0.2 + this.glow * 0.25);
    this.shell.scale.setScalar(Math.max(p * (1 + sizeBoost), 0.0001));
    this.shell.rotation.y += dt * 0.3;
    this.shell.rotation.x += dt * 0.12;

    (this.lock.material as THREE.SpriteMaterial).opacity = p * 0.9;
    (this.label.sprite.material as THREE.SpriteMaterial).opacity = p;

    // Hueco punteado: visible solo mientras no hay cuenta
    const hole = 1 - p;
    this.placeholder.material.opacity = hole * (0.55 + Math.sin(t * 2) * 0.25);
    this.placeholder.quaternion.copy(cameraQuat);
    this.placeholder.rotateZ(t * 0.2);
    this.placeholder.visible = hole > 0.02;
    (this.placeholderLabel.sprite.material as THREE.SpriteMaterial).opacity = hole * 0.9;
    this.placeholderLabel.sprite.visible = hole > 0.02;

    // Destello
    this.burstT = Math.min(this.burstT + dt * 0.9, 1);
    const b = this.burstT;
    (this.burst.material as THREE.SpriteMaterial).opacity = b < 1 ? (1 - b) * 1.2 : 0;
    this.burst.scale.setScalar(0.5 + b * 7);

    // Rayo de Friendbot: crece desde lejos, llega, destella y se desvanece
    if (this.beamT < 1) {
      this.beamT = Math.min(this.beamT + dt * 0.55, 1);
      const grow = Math.min(this.beamT / 0.55, 1);
      const pos = this.beam.geometry.attributes.position as THREE.BufferAttribute;
      // El origen del rayo está en coordenadas locales: la estrella es (0, 0, 0)
      const f = this.beamFrom;
      pos.setXYZ(0, f.x, f.y, f.z);
      pos.setXYZ(1, f.x * (1 - grow), f.y * (1 - grow), f.z * (1 - grow));
      pos.needsUpdate = true;
      this.beam.material.opacity = this.beamT < 0.55 ? 0.9 : (1 - this.beamT) / 0.45;
      if (this.beamT >= 0.55 && this.burstT >= 1) {
        this.burstT = 0;
        events.ignite = true;
      }
    } else {
      this.beam.material.opacity = 0;
    }

    return events;
  }

  private drawLabel() {
    const s = this.state;
    const key = `${s.address}|${s.funded}|${s.balance}`;
    if (key === this.labelKey) return;
    this.labelKey = key;
    const { canvas: c, texture } = this.label;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    if (!s.address) {
      texture.needsUpdate = true;
      return;
    }
    g.textAlign = "center";
    g.shadowColor = "rgba(176,124,255,0.9)";
    g.shadowBlur = 12;
    g.fillStyle = "#ffffff";
    g.font = "600 38px system-ui, sans-serif";
    g.fillText(`${s.address.slice(0, 6)}…${s.address.slice(-6)}`, c.width / 2, 52);
    g.font = "30px system-ui, sans-serif";
    g.fillStyle = s.funded ? "#ffe3a1" : "#aab3d6";
    const xlm = s.balance.toLocaleString("es-CR", { maximumFractionDigits: 2 });
    g.fillText(
      s.funded === undefined ? "…" : s.funded ? `${xlm} XLM` : "sin fondos",
      c.width / 2,
      100,
    );
    texture.needsUpdate = true;
  }

  private drawPlaceholder(text: string) {
    const { canvas: c, texture } = this.placeholderLabel;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    g.textAlign = "center";
    g.fillStyle = "#cdb8ff";
    g.shadowColor = "rgba(176,124,255,0.9)";
    g.shadowBlur = 10;
    g.font = "32px system-ui, sans-serif";
    g.fillText(text, c.width / 2, 72);
    texture.needsUpdate = true;
  }
}
