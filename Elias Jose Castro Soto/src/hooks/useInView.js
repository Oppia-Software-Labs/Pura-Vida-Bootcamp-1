import { useEffect, useRef, useState } from "react";

// Devuelve [ref, inView]: inView pasa a true la primera vez que el elemento
// entra en pantalla y se queda así (la animación se reproduce una sola vez).
export function useInView({ threshold = 0.2 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}
