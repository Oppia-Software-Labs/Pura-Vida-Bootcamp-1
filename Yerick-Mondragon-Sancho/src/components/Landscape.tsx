import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "motion/react";

export function Landscape({ paused }: { paused: boolean }) {
  const landscapeRef = useRef<HTMLDivElement>(null);
  const horizontal = useSpring(0, { stiffness: 45, damping: 24 });
  const vertical = useSpring(0, { stiffness: 45, damping: 24 });
  const nearHorizontal = useTransform(horizontal, (value) => value * 0.45);
  const nearVertical = useTransform(vertical, (value) => value * 0.4);

  useEffect(() => {
    const hero = landscapeRef.current?.closest(".hero-section");
    if (!hero || paused) {
      horizontal.jump(0);
      vertical.jump(0);
      return;
    }
    let frame = 0;
    let visible = false;
    let cursorX = 0;
    let cursorY = 0;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      const bounds = hero.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -bounds.top / bounds.height));
      // Cada capa recorre pocos píxeles; en celular reducimos la profundidad.
      horizontal.set(cursorX * 6);
      vertical.set(progress * (finePointer.matches ? 26 : 12) + cursorY * 3);
    };
    const schedule = () => {
      if (!frame && visible && !document.hidden)
        frame = requestAnimationFrame(update);
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType !== "mouse") return;
      cursorX = event.clientX / window.innerWidth - 0.5;
      cursorY = event.clientY / window.innerHeight - 0.5;
      schedule();
    };
    const resetPointer = () => {
      cursorX = 0;
      cursorY = 0;
      schedule();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(hero);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    hero.addEventListener("pointermove", move as EventListener, {
      passive: true,
    });
    hero.addEventListener("pointerleave", resetPointer);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      hero.removeEventListener("pointermove", move as EventListener);
      hero.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", schedule);
      horizontal.stop();
      vertical.stop();
    };
  }, [paused, horizontal, vertical]);
  return (
    <div ref={landscapeRef} className="landscape" aria-hidden="true">
      <div className="horizon-glow" />
      <svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="distant" x2="0" y2="1">
            <stop stopColor="#252b59" />
            <stop offset="1" stopColor="#0b1026" />
          </linearGradient>
          <linearGradient id="near" x2="0" y2="1">
            <stop stopColor="#182341" />
            <stop offset="1" stopColor="#080d1a" />
          </linearGradient>
          <linearGradient id="ridge" x2="1" y2="0">
            <stop stopColor="#526eb4" stopOpacity="0" />
            <stop offset=".5" stopColor="#6977bc" stopOpacity=".8" />
            <stop offset="1" stopColor="#526eb4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.g
          className="mountain-distant"
          style={{ x: paused ? 0 : horizontal, y: paused ? 0 : vertical }}
        >
          <path
            d="M0 210 112 139 177 174 293 60 365 134 401 118 520 240 623 183 730 234 866 99 955 166 1012 143 1125 31 1209 145 1280 113 1440 215V360H0Z"
            fill="url(#distant)"
          />
          <g fill="#3c4373" opacity=".35">
            <path d="m293 60 72 74 36-16 119 122-177-74Z" />
            <path d="m1125 31 84 114 71-32 160 102-268-70Z" />
            <path d="m866 99 89 67-34 56Z" />
          </g>
          <path
            d="M0 210 112 139 177 174 293 60 365 134 401 118 520 240 623 183 730 234 866 99 955 166 1012 143 1125 31 1209 145 1280 113 1440 215"
            fill="none"
            stroke="url(#ridge)"
          />
          <path
            d="m1125 31 0-23 20 7-20 7"
            stroke="#ff9c68"
            strokeWidth="1.5"
            fill="#ff9c68"
            fillOpacity=".2"
          />
        </motion.g>
        <motion.g
          className="mountain-near"
          style={{
            x: paused ? 0 : nearHorizontal,
            y: paused ? 0 : nearVertical,
          }}
        >
          <path
            d="M0 269 80 244 145 274 246 202 355 285 448 224 580 282 692 256 787 296 934 214 1045 271 1166 190 1260 269 1370 222 1440 252V360H0Z"
            fill="url(#near)"
          />
          <g stroke="#6981bf" strokeWidth=".65" fill="none" opacity=".18">
            <path d="m0 269 246-67 109 83 93-61 132 58 112-26 95 40 147-82 111 57 121-81 94 79 110-47 70 30" />
            <path d="m246 202-41 158m150-75 49 75m44-136 34 136m452-146-38 146m270-170-28 170m122-91 77 91" />
            <path d="M0 326 246 280 448 305 692 319 934 290 1166 285 1440 319" />
          </g>
        </motion.g>
        <path
          d="M0 333 152 307 309 337 471 321 650 346 824 328 995 343 1162 316 1317 340 1440 320V360H0Z"
          fill="#080d1a"
        />
      </svg>
      <span className="landscape-coordinate">
        09°29′ N · 83°29′ W <span>DE COSTA RICA A LAS ESTRELLAS</span>
      </span>
    </div>
  );
}
