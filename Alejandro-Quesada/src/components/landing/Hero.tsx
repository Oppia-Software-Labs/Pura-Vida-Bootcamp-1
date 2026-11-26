"use client";

/* Reproduce fielmente el mockup de las imágenes de referencia */
function HeroMockup() {
  return (
    <div className="relative w-[320px] mx-auto lg:mx-0">

      {/* Tarjeta flotante de contribuyentes — arriba a la derecha */}
      <div className="absolute -top-6 right-0 w-[200px] bg-[#1e1e1e] border border-border rounded-2xl p-4 shadow-2xl z-10">
        {[
          { initial: "A", color: "#4F6EF7" },
          { initial: "S", color: "#6b7280" },
          { initial: "J", color: "#374151" },
        ].map(({ initial, color }, i) => (
          <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
              style={{ background: color }}
            >
              {initial}
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-border rounded-full w-full" />
              <div className="h-1.5 bg-[#2a2a2a] rounded-full w-3/4" />
            </div>
          </div>
        ))}
      </div>

      {/* Tarjeta principal */}
      <div className="bg-[#161616] border border-border rounded-2xl p-6 shadow-2xl mt-10">
        <p className="text-muted text-xs font-medium mb-1">Pensión</p>
        <p className="text-white text-3xl font-bold mb-4">$40.000</p>

        <div className="space-y-2 mb-4">
          <div className="h-2 bg-border rounded-full" />
          <div className="h-2 bg-[#2a2a2a] rounded-full w-5/6" />
          <div className="h-2 bg-[#222] rounded-full w-4/6" />
        </div>

        <p className="text-muted text-xs mb-5">Vence el 31 de octubre, 2026</p>

        <div className="flex items-center gap-2 text-muted text-xs mb-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Descargar comprobante</span>
        </div>
        <div className="space-y-1.5 mb-5 pl-5">
          <div className="h-1.5 bg-border rounded-full w-full" />
          <div className="h-1.5 bg-[#2a2a2a] rounded-full w-5/6" />
          <div className="h-1.5 bg-[#222] rounded-full w-3/5" />
        </div>

        {/* Mini modal recordatorio */}
        <div className="bg-[#1a1a1a] border border-border rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-white text-xs font-medium">Recordatorio</span>
            <div className="w-9 h-5 bg-accent rounded-full flex items-center justify-end pr-0.5 flex-shrink-0">
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#222] rounded-lg px-3 py-2 mb-2">
            <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-muted text-xs">MM/DD/AA</span>
          </div>
          <button className="w-full bg-[#2a2a2a] hover:bg-border text-white text-xs font-medium py-2 rounded-lg transition-colors">
            Crear nuevo
          </button>
        </div>

        <button className="w-full btn-primary text-sm py-3">
          Contribuir ahora
        </button>
      </div>
    </div>
  );
}

export default function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section
      id="inicio"
      className="min-h-screen flex items-center pt-16"
      style={{
        background:
          "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(79,110,247,0.15) 0%, transparent 65%)",
      }}
    >
      <div className="section-container w-full grid lg:grid-cols-2 gap-20 items-center py-20">
        {/* Texto */}
        <div>
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3.5 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-medium">Stellar Testnet — En vivo</span>
          </div>

          <h1 className="text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight mb-5">
            Simplifica tu Pensión,{" "}
            <span className="gradient-text">Amplifica tu Futuro.</span>
          </h1>

          <p className="text-muted text-lg leading-relaxed mb-8 max-w-md">
            Solución descentralizada de micro-pensiones para trabajadores informales de LATAM.
            Sin bancos, sin burocracia. Construido sobre Stellar.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <button onClick={onGetStarted} className="btn-primary px-7 py-3.5">
              Comenzar gratis
            </button>
            <a href="#servicios" className="btn-outline px-7 py-3.5">
              Precios y planes
            </a>
          </div>

          <div className="flex items-center gap-8">
            {[
              { value: "92M+", label: "Trabajadores sin cobertura" },
              { value: "$0.00001", label: "Por transacción" },
              { value: "3s", label: "Tiempo de liquidación" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-white text-lg font-bold">{value}</p>
                <p className="text-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mockup */}
        <div className="flex justify-center lg:justify-end">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
