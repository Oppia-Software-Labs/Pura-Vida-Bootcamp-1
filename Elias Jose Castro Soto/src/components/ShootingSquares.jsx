import { useEffect, useRef } from "react";

const TRAIL_SEGMENTS = 9; // cuadros que forman la estela
const MAX_ALPHA = 0.3; // opacidad de los cuadros más cercanos (baja a 0.2 si molesta)

function createParticle(w, h, anywhere = false) {
  const depth = Math.random(); // 0 = lejos, 1 = cerca
  const size = 2 + depth ** 1.5 * 9; // 2px a 11px
  const angle = (Math.random() - 0.5) * 0.25; // leve inclinación
  return {
    x: Math.random() * w,
    // al iniciar se reparten por toda la pantalla; después renacen debajo del borde inferior
    y: anywhere ? Math.random() * (h + 200) : h + size + Math.random() * h * 0.4,
    size,
    speed: 25 + depth * 90, // px por segundo: los lejanos van más lento
    alpha: (0.35 + depth * 0.65) * MAX_ALPHA,
    dx: Math.sin(angle),
    dy: -Math.cos(angle), // negativo: sube
  };
}

function drawParticle(ctx, p) {
  const gap = p.size * 0.85;
  for (let i = 0; i <= TRAIL_SEGMENTS; i++) {
    const t = i / (TRAIL_SEGMENTS + 1);
    const s = p.size * (1 - t); // cada cuadro de la estela es más pequeño
    ctx.globalAlpha = p.alpha * (1 - t) ** 1.5; // y más transparente
    const cx = p.x - p.dx * i * gap;
    const cy = p.y - p.dy * i * gap;
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
  }
}

export default function ShootingSquares() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let frame = 0;
    let last = performance.now();
    const particles = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(60, Math.max(18, Math.round(w / 28)));
      while (particles.length < count) particles.push(createParticle(w, h, true));
      particles.length = Math.min(particles.length, count);
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); // evita saltos al volver a la pestaña
      last = now;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.dx * p.speed * dt;
        p.y += p.dy * p.speed * dt;

        const trailLength = p.size * 0.85 * (TRAIL_SEGMENTS + 1);
        if (p.y < -trailLength) {
          particles[i] = createParticle(w, h); // salió por completo: renace abajo
        } else {
          drawParticle(ctx, p);
        }
      }

      frame = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
