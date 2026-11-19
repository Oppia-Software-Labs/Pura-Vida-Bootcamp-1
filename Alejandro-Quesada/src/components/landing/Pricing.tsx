const PLANES = [
  {
    nombre: "Básico",
    precio: "$80",
    periodo: "Por mes",
    caracteristicas: [
      { texto: "Asistente IA", incluido: true },
      { texto: "Seguimiento automático ilimitado", incluido: true },
      { texto: "Personalización y ajustes", incluido: true },
      { texto: "Soporte prioritario al cliente", incluido: false },
      { texto: "Acceso a todos los widgets", incluido: false },
    ],
    destacado: false,
  },
  {
    nombre: "Pro",
    precio: "$150",
    periodo: "Por mes",
    caracteristicas: [
      { texto: "Asistente IA", incluido: true },
      { texto: "Seguimiento automático ilimitado", incluido: true },
      { texto: "Personalización y ajustes", incluido: true },
      { texto: "Soporte prioritario al cliente", incluido: true },
      { texto: "Acceso a todos los widgets", incluido: false },
    ],
    destacado: true,
  },
  {
    nombre: "Avanzado",
    precio: "$180",
    periodo: "Por mes",
    caracteristicas: [
      { texto: "Asistente IA", incluido: true },
      { texto: "Seguimiento automático ilimitado", incluido: true },
      { texto: "Personalización y ajustes", incluido: true },
      { texto: "Soporte prioritario al cliente", incluido: true },
      { texto: "Acceso a todos los widgets", incluido: true },
    ],
    destacado: false,
  },
];

function FilaCaracteristica({ texto, incluido }: { texto: string; incluido: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          incluido ? "bg-accent" : "bg-[#2a2a2a]"
        }`}
      >
        <svg
          className={`w-3 h-3 ${incluido ? "text-white" : "text-muted"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className={`text-sm ${incluido ? "text-white" : "text-muted"}`}>{texto}</span>
    </div>
  );
}

export default function Pricing() {
  return (
    <section id="contacto" className="py-24 bg-card/20">
      <div className="section-container">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-2">Nuestros Precios</h2>
          <p className="text-muted text-sm">Elige el plan perfecto para tus necesidades.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANES.map(({ nombre, precio, periodo, caracteristicas, destacado }) => (
            <div
              key={nombre}
              className={`rounded-2xl border p-7 flex flex-col gap-6 ${
                destacado
                  ? "bg-[#161616] border-border shadow-lg"
                  : "bg-[#111] border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white text-xl font-bold">{nombre}</p>
                  <p className="text-muted text-xs mt-0.5">{periodo}</p>
                </div>
                <div className="bg-accent text-white text-base font-bold px-4 py-2 rounded-xl flex-shrink-0">
                  {precio}
                </div>
              </div>

              <div>
                <p className="text-white font-semibold text-sm mb-4">Incluye</p>
                <div className="flex flex-col gap-3">
                  {caracteristicas.map((c) => (
                    <FilaCaracteristica key={c.texto} {...c} />
                  ))}
                </div>
              </div>

              <button className="btn-primary text-sm py-3 w-full mt-auto">
                Adquirir plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
