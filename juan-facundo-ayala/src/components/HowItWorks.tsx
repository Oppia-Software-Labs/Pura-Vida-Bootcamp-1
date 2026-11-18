const STEPS = [
  {
    title: 'Conectá tu wallet',
    detail: 'Varial (ex Freighter), xBull, Albedo, Lobstr y otras.',
  },
  {
    title: 'Elegí a quién y cuánto',
    detail: 'Una dirección de Stellar, un monto y un mensaje.',
  },
  {
    title: 'Firmá y listo',
    detail: 'Aprobás el envío en tu wallet y llega en segundos.',
  },
]

export function HowItWorks() {
  return (
    <ol className="grid gap-4">
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground tabular-nums"
          >
            {index + 1}
          </span>
          <div>
            <p className="font-medium">{step.title}</p>
            <p className="text-sm text-muted-foreground">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
