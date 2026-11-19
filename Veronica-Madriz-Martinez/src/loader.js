// Carga un <script> clásico (bundle UMD) y espera a que termine.
export function loadScript(src, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing?.dataset.loaded) return resolve();

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.src = src;
    const timer = setTimeout(() => {
      s.remove();
      reject(new Error(`Tiempo agotado cargando ${src}`));
    }, timeoutMs);
    s.onload = () => {
      clearTimeout(timer);
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => {
      clearTimeout(timer);
      s.remove();
      reject(new Error(`No cargó ${src}`));
    };
    document.head.appendChild(s);
  });
}

/** Promesa que falla si `promise` tarda más de `ms`. */
export function withTimeout(promise, ms, message) {
  let t;
  return Promise.race([
    promise,
    new Promise((_, reject) => (t = setTimeout(() => reject(new Error(message)), ms))),
  ]).finally(() => clearTimeout(t));
}
