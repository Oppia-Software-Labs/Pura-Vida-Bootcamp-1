const STATS = [
  { value: "0.", label: "Incidentes de seguridad", accent: false },
  { value: "24/7", label: "Protegiendo tu información", accent: true },
  { value: "100%", label: "Datos encriptados", accent: false },
  { value: "99.9%", label: "Rendimiento ininterrumpido.", accent: true },
];

export default function Security() {
  return (
    <section id="soporte" className="py-24 bg-card/20">
      <div className="section-container">
        <div className="bg-[#111] border border-border rounded-3xl p-10 lg:p-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
              Seguridad a prueba de balas,{" "}
              <span className="gradient-text">de extremo a extremo</span>
            </h2>
            <p className="text-muted leading-relaxed max-w-sm text-sm">
              Koired prioriza la seguridad de tus datos para que puedas enfocarte
              en hacer crecer tu ahorro de retiro sin preocupaciones.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
            {STATS.map(({ value, label, accent }) => (
              <div key={label} className="bg-[#111] flex flex-col items-center justify-center text-center p-8 gap-2">
                <p className={`text-4xl font-extrabold ${accent ? "text-accent" : "text-white"}`}>
                  {value}
                </p>
                <p className="text-muted text-xs leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
