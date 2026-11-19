const BENEFICIOS = [
  {
    title: "Ahorra tiempo",
    desc: "Colabora con actualizaciones en tiempo real y distribuciones automáticas en blockchain.",
  },
  {
    title: "Reduce costos",
    desc: "Colabora con actualizaciones en tiempo real y tableros centralizados.",
  },
  {
    title: "Mayor eficiencia",
    desc: "Colabora con actualizaciones en tiempo real y tableros centralizados.",
  },
];

function Check() {
  return (
    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function CardMockup() {
  return (
    <div className="relative w-[280px] mx-auto lg:mx-0">
      {/* Tarjeta flotante de personas */}
      <div className="absolute -top-5 -right-5 w-[190px] bg-[#1e1e1e] border border-border rounded-2xl p-4 shadow-xl z-10">
        {[
          { initial: "A", color: "#4F6EF7" },
          { initial: "S", color: "#6b7280" },
          { initial: "J", color: "#374151" },
        ].map(({ initial, color }, i) => (
          <div key={i} className="flex items-center gap-3 mb-2.5 last:mb-0">
            <div
              className="w-6 h-6 rounded-full text-xs font-semibold text-white flex items-center justify-center flex-shrink-0"
              style={{ background: color }}
            >
              {initial}
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-border rounded-full" />
              <div className="h-1.5 bg-[#2a2a2a] rounded-full w-3/4" />
            </div>
          </div>
        ))}
      </div>

      {/* Tarjeta principal — replica exacta del diseño */}
      <div className="bg-[#161616] border border-border rounded-2xl p-5 shadow-2xl mt-8">
        <p className="text-muted text-xs mb-0.5">Pensión</p>
        <p className="text-white text-2xl font-bold mb-3">$40.000</p>

        <div className="space-y-1.5 mb-3">
          <div className="h-1.5 bg-border rounded-full" />
          <div className="h-1.5 bg-[#2a2a2a] rounded-full w-5/6" />
          <div className="h-1.5 bg-[#222] rounded-full w-4/6" />
        </div>

        <p className="text-muted text-xs mb-4">Vence el 31 de octubre, 2026</p>

        <div className="flex items-center gap-2 mb-3">
          <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-muted text-xs">Descargar comprobante</span>
        </div>
        <div className="space-y-1.5 mb-5 ml-5">
          <div className="h-1.5 bg-border rounded-full w-full" />
          <div className="h-1.5 bg-[#2a2a2a] rounded-full w-5/6" />
          <div className="h-1.5 bg-[#222] rounded-full w-3/5" />
        </div>

        <button className="w-full bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
          Descargar comprobante
        </button>
      </div>
    </div>
  );
}

export default function WhyChoose() {
  return (
    <section id="servicios" className="py-24">
      <div className="section-container">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-2">¿Por qué elegir Koired?</h2>
          <p className="text-muted">Simplifica operaciones y logra resultados excepcionales.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Izquierda: mockup */}
          <div className="flex justify-center lg:justify-start py-6">
            <CardMockup />
          </div>

          {/* Derecha: stats + beneficios */}
          <div className="flex flex-col gap-7">
            {/* Stat grande */}
            <div className="bg-[#161616] border border-border rounded-2xl p-7 flex items-center justify-between gap-4">
              <p className="text-white text-base font-medium leading-snug max-w-[180px]">
                Reduce el tiempo en procesos repetitivos hasta en
              </p>
              <p className="text-accent text-6xl font-extrabold flex-shrink-0">50%</p>
            </div>

            {/* Lista de beneficios */}
            <div className="flex flex-col gap-5">
              {BENEFICIOS.map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <Check />
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">{title}</p>
                    <p className="text-muted text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
