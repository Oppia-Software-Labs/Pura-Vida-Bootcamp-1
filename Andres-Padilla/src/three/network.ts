import * as THREE from "three";

// Red de validadores del capítulo 2: nodos sobre la galaxia que intercambian
// mensajes y cierran un ledger cada ~5 s si hay acuerdo suficiente.

import { LEDGER_SECONDS, NODE_COUNT, QUORUM } from "@/story/validators";

const COLOR_ON = new THREE.Color(0xbfd8ff);
const COLOR_OFF = new THREE.Color(0x2a3350);
const COLOR_GOLD = new THREE.Color(0xffc857);
const COLOR_WAIT = new THREE.Color(0xff5b6b);
const MESSAGES = 90;

function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

type Node = {
  core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  halo: THREE.Sprite;
  ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  flash: number;
  scale: number;
};

type Message = { link: number; t: number; speed: number; forward: boolean };

export class NetworkScene {
  readonly group = new THREE.Group();
  readonly pickables: THREE.Object3D[] = [];
  /** Orientación de la cámara, para que los anillos de selección la miren de frente. */
  readonly cameraQuat = new THREE.Quaternion();

  private nodes: Node[] = [];
  private positions: THREE.Vector3[] = [];
  private links: [number, number][] = [];
  private linkGeo = new THREE.BufferGeometry();
  private linkMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true });
  private msgGeo = new THREE.BufferGeometry();
  private msgPos = new Float32Array(MESSAGES * 3);
  private msgCol = new Float32Array(MESSAGES * 3);
  private msgMat: THREE.PointsMaterial;
  private messages: Message[] = [];

  private active: boolean[] = Array(NODE_COUNT).fill(true);
  private selected: number | null = null;
  private hovered: number | null = null;
  private presence = 0;
  private visibleTarget = false;
  private clock = 0;
  private ledgerFlash = 0;
  private _c = new THREE.Color();

  constructor() {
    const tex = haloTexture();

    for (let i = 0; i < NODE_COUNT; i++) {
      const a = (i / NODE_COUNT) * Math.PI * 2 + (i % 3) * 0.12;
      const r = 6.2 + (i % 2) * 1.6;
      const p = new THREE.Vector3(Math.cos(a) * r, 1.8 + Math.sin(i * 1.9) * 0.9, Math.sin(a) * r);
      this.positions.push(p);

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 18, 14),
        new THREE.MeshBasicMaterial({ color: COLOR_ON, transparent: true }),
      );
      core.position.copy(p);
      core.userData.pickIndex = i;
      this.pickables.push(core);

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          color: COLOR_ON,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      halo.position.copy(p);
      halo.scale.setScalar(1.1);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.32, 0.37, 40),
        new THREE.MeshBasicMaterial({ color: 0xb07cff, transparent: true, side: THREE.DoubleSide }),
      );
      ring.position.copy(p);

      this.group.add(core, halo, ring);
      this.nodes.push({ core, halo, ring, flash: 0, scale: 1 });
    }

    // Conexiones: vecinos en el anillo y algunos cruces
    const seen = new Set<string>();
    const addLink = (a: number, b: number) => {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (a === b || seen.has(key)) return;
      seen.add(key);
      this.links.push([a, b]);
    };
    for (let i = 0; i < NODE_COUNT; i++) {
      addLink(i, (i + 1) % NODE_COUNT);
      addLink(i, (i + 2) % NODE_COUNT);
      if (i % 2 === 0) addLink(i, (i + 5) % NODE_COUNT);
    }
    const lp = new Float32Array(this.links.length * 6);
    this.links.forEach(([a, b], k) => {
      lp.set([...this.positions[a].toArray(), ...this.positions[b].toArray()], k * 6);
    });
    this.linkGeo.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    this.linkGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(this.links.length * 6), 3));
    this.group.add(new THREE.LineSegments(this.linkGeo, this.linkMat));

    // Mensajes viajando entre nodos
    this.msgGeo.setAttribute("position", new THREE.BufferAttribute(this.msgPos, 3));
    this.msgGeo.setAttribute("color", new THREE.BufferAttribute(this.msgCol, 3));
    this.msgMat = new THREE.PointsMaterial({
      size: 0.16,
      map: tex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const msgs = new THREE.Points(this.msgGeo, this.msgMat);
    msgs.frustumCulled = false;
    this.group.add(msgs);
    for (let i = 0; i < MESSAGES; i++) this.messages.push(this.newMessage(Math.random()));

    this.group.visible = false;
  }

  get activeCount() {
    return this.active.filter(Boolean).length;
  }

  get hasQuorum() {
    return this.activeCount >= QUORUM;
  }

  setActive(active: boolean[]) {
    this.active = active;
  }

  setSelected(i: number | null) {
    this.selected = i;
  }

  setHover(i: number | null) {
    this.hovered = i;
  }

  setVisible(v: boolean) {
    this.visibleTarget = v;
  }

  /** Avanza la animación. Devuelve `true` en el frame en que se cierra un ledger. */
  update(dt: number, t: number): boolean {
    this.presence += ((this.visibleTarget ? 1 : 0) - this.presence) * (1 - Math.exp(-dt * 3));
    this.group.visible = this.presence > 0.01;
    if (!this.group.visible) return false;
    const pr = this.presence;

    // Ciclo de ledger
    let closed = false;
    this.clock += dt;
    if (this.clock >= LEDGER_SECONDS) {
      this.clock = 0;
      if (this.hasQuorum) {
        closed = true;
        this.ledgerFlash = 1;
        this.nodes.forEach((n, i) => {
          if (this.active[i]) n.flash = 1;
        });
      } else {
        // Sin acuerdo: los nodos activos parpadean en rojo, esperando
        this.nodes.forEach((n, i) => {
          if (this.active[i]) n.flash = -1;
        });
      }
    }
    this.ledgerFlash = Math.max(0, this.ledgerFlash - dt * 1.2);

    this.nodes.forEach((n, i) => {
      const on = this.active[i];
      n.flash = n.flash > 0 ? Math.max(0, n.flash - dt * 1.5) : Math.min(0, n.flash + dt * 1.5);
      const base = on ? COLOR_ON : COLOR_OFF;
      this._c.copy(base);
      if (n.flash > 0) this._c.lerp(COLOR_GOLD, n.flash);
      if (n.flash < 0) this._c.lerp(COLOR_WAIT, -n.flash);
      n.core.material.color.copy(this._c);
      n.core.material.opacity = pr * (on ? 1 : 0.6);
      (n.halo.material as THREE.SpriteMaterial).color.copy(this._c);
      (n.halo.material as THREE.SpriteMaterial).opacity = pr * (on ? 0.9 : 0.15);

      const target = (this.selected === i ? 1.35 : this.hovered === i ? 1.18 : 1) * (1 + Math.abs(n.flash) * 0.35);
      n.scale += (target - n.scale) * (1 - Math.exp(-dt * 10));
      const pulse = on ? 1 + Math.sin(t * 2 + i) * 0.06 : 1;
      n.core.scale.setScalar(n.scale * pulse);
      n.halo.scale.setScalar(1.1 * n.scale * pulse);

      // Anillo de selección: siempre de frente a la cámara, girando
      n.ring.material.opacity = pr * (this.selected === i ? 0.9 : 0);
      n.ring.quaternion.copy(this.cameraQuat);
      n.ring.rotateZ(t * 0.8);
    });

    // Colores de las conexiones: solo brillan si los dos extremos están activos
    const lc = this.linkGeo.attributes.color as THREE.BufferAttribute;
    this.links.forEach(([a, b], k) => {
      const ok = this.active[a] && this.active[b];
      this._c.copy(ok ? COLOR_ON : COLOR_OFF).multiplyScalar(ok ? 0.35 + this.ledgerFlash * 0.5 : 0.12);
      if (ok && this.ledgerFlash > 0) this._c.lerp(COLOR_GOLD, this.ledgerFlash * 0.6);
      lc.setXYZ(k * 2, this._c.r, this._c.g, this._c.b);
      lc.setXYZ(k * 2 + 1, this._c.r, this._c.g, this._c.b);
    });
    lc.needsUpdate = true;
    this.linkMat.opacity = pr;

    // Mensajes: solo viajan por conexiones activas
    for (let i = 0; i < this.messages.length; i++) {
      let msg = this.messages[i];
      msg.t += dt * msg.speed;
      if (msg.t >= 1) msg = this.messages[i] = this.newMessage(0);
      const [a, b] = this.links[msg.link];
      const [from, to] = msg.forward ? [a, b] : [b, a];
      const visible = this.active[from] && this.active[to];
      const pa = this.positions[from];
      const pb = this.positions[to];
      const k = Math.min(msg.t, 1);
      this.msgPos[i * 3] = pa.x + (pb.x - pa.x) * k;
      this.msgPos[i * 3 + 1] = pa.y + (pb.y - pa.y) * k + Math.sin(k * Math.PI) * 0.25;
      this.msgPos[i * 3 + 2] = pa.z + (pb.z - pa.z) * k;
      this._c.copy(COLOR_ON).lerp(COLOR_GOLD, this.ledgerFlash);
      const fade = visible ? Math.sin(k * Math.PI) : 0;
      this.msgCol[i * 3] = this._c.r * fade;
      this.msgCol[i * 3 + 1] = this._c.g * fade;
      this.msgCol[i * 3 + 2] = this._c.b * fade;
    }
    this.msgGeo.attributes.position.needsUpdate = true;
    this.msgGeo.attributes.color.needsUpdate = true;
    this.msgMat.opacity = pr;

    return closed;
  }

  /** Segundos que faltan para el siguiente intento de cerrar un ledger. */
  get secondsToNext() {
    return Math.max(0, LEDGER_SECONDS - this.clock);
  }

  private newMessage(t: number): Message {
    return {
      link: Math.floor(Math.random() * this.links.length),
      t,
      speed: 0.35 + Math.random() * 0.5,
      forward: Math.random() < 0.5,
    };
  }
}
