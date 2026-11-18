import { useEffect, useRef } from "react";
import { useMotionPreference } from "../hooks/useMotionPreference";

export function SpaceBackground({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useMotionPreference();
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let elapsed = 0;
    let visible = false;
    const pointer = { x: 0, y: 0 };
    const smoothPointer = { x: 0, y: 0 };
    const stars = Array.from({ length: 65 }, (_, index) => ({
      x: ((index * 73 + 19) % 101) / 101,
      y: ((index * 47 + 11) % 103) / 103,
      size: index % 7 === 0 ? 1.5 : 0.7,
    }));
    const canAnimate = !paused && !reducedMotion;
    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      smoothPointer.x += (pointer.x - smoothPointer.x) * 0.045;
      smoothPointer.y += (pointer.y - smoothPointer.y) * 0.045;
      const positions = stars
        .slice(0, width < 600 ? 32 : stars.length)
        .map((star, index) => ({
          x:
            star.x * width +
            (canAnimate
              ? Math.sin(time / 14000 + index) * 7 + smoothPointer.x * star.size
              : 0),
          y:
            star.y * height +
            (canAnimate
              ? Math.cos(time / 19000 + index) * 7 + smoothPointer.y * star.size
              : 0),
        }));
      positions.forEach((point, index) => {
        // El brillo cambia despacio y nunca se apaga por completo.
        const brightness = canAnimate
          ? 0.65 + Math.sin(time / 2400 + index * 1.7) * 0.25
          : 0.8;
        context.globalAlpha = brightness;
        context.beginPath();
        context.arc(point.x, point.y, stars[index].size, 0, Math.PI * 2);
        context.fillStyle = index % 8 === 0 ? "#b8a3eb" : "#6b8ab6";
        context.fill();
        if (stars[index].size > 1) {
          context.globalAlpha = brightness * 0.12;
          context.beginPath();
          context.arc(point.x, point.y, 5, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = 1;
        positions.slice(index + 1).forEach((other) => {
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance > 115) return;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(105, 137, 202, ${(1 - distance / 115) * 0.15})`;
          context.stroke();
        });
      });
    };
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      // Limitamos la resolución para que el fondo también sea liviano en celulares.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(elapsed);
    };
    const animate = (time: number) => {
      if (document.hidden || !visible) {
        frame = 0;
        return;
      }
      if (time - lastTime > 32) {
        elapsed += Math.min(time - lastTime, 64);
        draw(elapsed);
        lastTime = time;
      }
      frame = requestAnimationFrame(animate);
    };
    const handleVisibility = () => {
      if (!document.hidden && visible && canAnimate && !frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(animate);
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 8;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 8;
    };
    const observer = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      handleVisibility();
    });
    observer.observe(canvas);
    visibilityObserver.observe(canvas);
    resize();
    if (canAnimate)
      window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [paused, reducedMotion]);
  return (
    <canvas ref={canvasRef} className="space-background" aria-hidden="true" />
  );
}
