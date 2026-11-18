/**
 * Esperando pago: dos lunas orbitando.
 * Pagado: un destello verde que se abre una sola vez y deja el check.
 */
export default function StatusOrb({ paid, size = 168 }: { paid: boolean; size?: number }) {
  return (
    <div
      className={`relative mx-auto ${paid ? "orb-paid" : ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={paid ? "Pago recibido" : "Esperando pago"}
    >
      <span className="orb-ring" />
      <span className="orb-ring inner" />
      {paid ? (
        <>
          <span className="orb-flash" />
          <span className="orb-check absolute inset-0 grid place-items-center text-ok">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
        </>
      ) : (
        <>
          <span className="orb-track" />
          <span className="orb-track inner" />
          <span className="orb-core" />
        </>
      )}
    </div>
  );
}
