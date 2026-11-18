import { useEffect, useRef } from "react";

interface Bright {
  x: number;
  y: number;
  r: number;
  hue: number;
  speed: number;
  phase: number;
  spikes: boolean;
}

interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

// Normal aproximada (Box-Muller) para concentrar el polvo estelar en la franja.
const gauss = () => {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/**
 * Cielo de fondo:
 *  - una capa estática pre-renderizada (vía láctea, nebulosas tenues, miles de estrellas pequeñas)
 *    que deriva muy despacio;
 *  - unas pocas estrellas brillantes con destellos en cruz que parpadean;
 *  - una estrella fugaz de vez en cuando.
 */
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sky = document.createElement("canvas");
    const sctx = sky.getContext("2d")!;
    const PAD = 60; // margen para la deriva
    let w = 0;
    let h = 0;
    let dpr = 1;
    let brights: Bright[] = [];
    const shooters: Shooter[] = [];
    let raf = 0;
    let lastShot = 0;

    const paintSky = () => {
      const sw = w + PAD * 2;
      const sh = h + PAD * 2;
      sky.width = sw * dpr;
      sky.height = sh * dpr;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.clearRect(0, 0, sw, sh);

      // Eje de la vía láctea: diagonal de abajo-izquierda a arriba-derecha.
      const ax = -sw * 0.1;
      const ay = sh * 0.95;
      const bx = sw * 1.1;
      const by = sh * 0.05;
      const len = Math.hypot(bx - ax, by - ay);
      const ux = (bx - ax) / len;
      const uy = (by - ay) / len;
      const nx = -uy;
      const ny = ux;
      const band = Math.min(sw, sh) * 0.16;

      // Nebulosas: manchas de luz muy suaves a lo largo de la franja.
      sctx.globalCompositeOperation = "lighter";
      const tints = ["124,92,255", "86,120,255", "190,90,220", "70,160,230"];
      for (let i = 0; i < 14; i++) {
        const t = Math.random();
        const off = gauss() * band * 0.5;
        const x = ax + ux * len * t + nx * off;
        const y = ay + uy * len * t + ny * off;
        const r = band * (0.8 + Math.random() * 1.6);
        const g = sctx.createRadialGradient(x, y, 0, x, y, r);
        const c = tints[i % tints.length];
        g.addColorStop(0, `rgba(${c},${0.05 + Math.random() * 0.05})`);
        g.addColorStop(1, `rgba(${c},0)`);
        sctx.fillStyle = g;
        sctx.fillRect(x - r, y - r, r * 2, r * 2);
      }

      // Polvo estelar concentrado en la franja.
      const dust = Math.round((sw * sh) / 260);
      for (let i = 0; i < dust; i++) {
        const t = Math.random();
        const off = gauss() * band * 0.55;
        const x = ax + ux * len * t + nx * off;
        const y = ay + uy * len * t + ny * off;
        const a = 0.08 + Math.random() * 0.3;
        sctx.fillStyle = `rgba(225,222,255,${a})`;
        sctx.fillRect(x, y, Math.random() < 0.85 ? 0.6 : 1, Math.random() < 0.85 ? 0.6 : 1);
      }

      // Estrellas de campo repartidas por todo el cielo (dos profundidades).
      sctx.globalCompositeOperation = "source-over";
      const field = Math.round((sw * sh) / 2400);
      for (let i = 0; i < field; i++) {
        const near = Math.random() < 0.15;
        const x = Math.random() * sw;
        const y = Math.random() * sh;
        const r = near ? 0.8 + Math.random() * 0.5 : 0.35 + Math.random() * 0.35;
        const a = near ? 0.45 + Math.random() * 0.4 : 0.15 + Math.random() * 0.35;
        const tint = Math.random();
        const col = tint < 0.7 ? "236,234,255" : tint < 0.85 ? "190,205,255" : "255,226,205";
        sctx.fillStyle = `rgba(${col},${a})`;
        sctx.beginPath();
        sctx.arc(x, y, r, 0, Math.PI * 2);
        sctx.fill();
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintSky();
      const n = Math.max(10, Math.round((w * h) / 70000));
      brights = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.9 + Math.random() * 0.9,
        hue: [250, 220, 30][i % 3],
        speed: 0.0004 + Math.random() * 0.0009,
        phase: Math.random() * Math.PI * 2,
        spikes: i % 3 === 0,
      }));
      if (reduce) frame(0);
    };

    const drawBright = (b: Bright, t: number) => {
      const k = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(t * b.speed + b.phase);
      const color = `hsla(${b.hue}, 80%, 90%, ${k})`;
      const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 6);
      glow.addColorStop(0, `hsla(${b.hue}, 90%, 85%, ${0.35 * k})`);
      glow.addColorStop(1, `hsla(${b.hue}, 90%, 85%, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(b.x - b.r * 6, b.y - b.r * 6, b.r * 12, b.r * 12);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      if (b.spikes) {
        const L = b.r * 9 * k;
        ctx.strokeStyle = `hsla(${b.hue}, 80%, 92%, ${0.35 * k})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(b.x - L, b.y);
        ctx.lineTo(b.x + L, b.y);
        ctx.moveTo(b.x, b.y - L);
        ctx.lineTo(b.x, b.y + L);
        ctx.stroke();
      }
    };

    const frame = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // Deriva lentísima: un ciclo completo dura varios minutos.
      const dx = reduce ? 0 : Math.sin(t / 90000) * PAD * 0.8;
      const dy = reduce ? 0 : Math.cos(t / 120000) * PAD * 0.5;
      ctx.drawImage(sky, -PAD + dx, -PAD + dy, w + PAD * 2, h + PAD * 2);
      for (const b of brights) drawBright(b, t);

      if (reduce) return;
      if (t - lastShot > 9000 && Math.random() < 0.003) {
        lastShot = t;
        const angle = Math.PI * (0.15 + Math.random() * 0.15);
        const v = 9 + Math.random() * 4;
        shooters.push({
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.35,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: 1,
        });
      }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i];
        const tail = 14;
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail);
        g.addColorStop(0, `rgba(255,255,255,${0.85 * s.life})`);
        g.addColorStop(1, "rgba(180,165,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail);
        ctx.stroke();
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.016;
        if (s.life <= 0) shooters.splice(i, 1);
      }
    };

    const loop = (t: number) => {
      frame(t);
      raf = requestAnimationFrame(loop);
    };

    resize();
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
}
