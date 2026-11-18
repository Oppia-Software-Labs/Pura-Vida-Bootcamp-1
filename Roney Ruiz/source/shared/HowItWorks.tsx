const steps = [
  {
    dot: "bg-faint text-canvas",
    title: "Bloqueas el depósito",
    body: "El dinero queda en la red Stellar con reglas de tiempo, no en manos de nadie.",
  },
  {
    dot: "bg-warn text-canvas",
    title: "El arrendador tiene su ventana",
    body: "Entre el fin del contrato y el plazo, solo él puede reclamar.",
  },
  {
    dot: "bg-ok text-canvas",
    title: "Si no actúa, lo recuperas",
    body: "Pasado el plazo reclamas tú, sin pedir permiso a nadie.",
  },
];

export default function HowItWorks() {
  return (
    <section aria-label="Cómo funciona" className="flex flex-col gap-3">
      <p className="eyebrow">Cómo funciona</p>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-line bg-surface/60 p-4">
            <span
              aria-hidden
              className={`mb-3 grid size-6 place-items-center rounded-full text-xs font-bold ${step.dot}`}
            >
              {index + 1}
            </span>
            <p className="text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
