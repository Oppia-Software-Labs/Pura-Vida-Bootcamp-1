const STATS = [
  {
    value: "51.7%",
    label: "Empleados informales en LATAM",
    desc: "92 millones de personas sin acceso a un sistema de pensiones contributivo.",
  },
  {
    value: "4 de 10",
    label: "Trabajadores que cotizan",
    desc: "Solo 4 de cada 10 trabajadores activos realizan aportes a un fondo de retiro.",
  },
  {
    value: "2033",
    label: "Colapso proyectado del IVM en Costa Rica",
    desc: "El fondo de pensiones de la CCSS agotaría sus reservas antes de lo previsto.",
  },
  {
    value: "1 de 4",
    label: "Adultos mayores que siguen trabajando",
    desc: "Por necesidad, no por elección. La pensión no es suficiente para vivir.",
  },
];

export default function ElProblema() {
  return (
    <section id="nosotros" className="py-24 bg-card/20">
      <div className="section-container">
        <div className="max-w-2xl mb-14">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">El problema</p>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Millones de personas en LATAM llegan a la vejez sin pensión
          </h2>
          <p className="text-muted text-lg leading-relaxed">
            Los sistemas de pensión tradicionales fueron diseñados para el empleo formal.
            Pero más de la mitad de los trabajadores latinoamericanos son informales —
            independientes, vendedores, agricultores, cuidadores — y quedan completamente fuera.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map(({ value, label, desc }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3 hover:border-accent/30 transition-colors"
            >
              <p className="text-accent text-3xl font-extrabold leading-none">{value}</p>
              <p className="text-white text-sm font-semibold leading-snug">{label}</p>
              <p className="text-muted text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-accent/5 border border-accent/15 rounded-2xl p-7 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-white font-semibold text-lg mb-1">
              Koired resuelve esto con blockchain
            </p>
            <p className="text-muted text-sm leading-relaxed">
              Con Stellar, cualquier persona puede contribuir a un fondo de pensión con tan solo
              1 XLM. Sin cuenta bancaria, sin papeleo, sin intermediarios.
              Las contribuciones quedan registradas de forma inmutable y las distribuciones son automáticas.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm flex-shrink-0">
            {[
              "✓ Comisiones menores a $0.01",
              "✓ Liquidación en 3 segundos",
              "✓ Transparencia total on-chain",
              "✓ Sin banco intermediario",
            ].map((item) => (
              <p key={item} className="text-white/80">{item}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
