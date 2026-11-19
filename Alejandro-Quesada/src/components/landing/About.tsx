const PILARES = [
  {
    titulo: "Servicios para todos",
    desc: "Nuestras soluciones se adaptan a las necesidades cambiantes de nuestros clientes, independientemente de su tamaño o ubicación.",
  },
  {
    titulo: "Seguridad y confianza",
    desc: "Nuestras soluciones se adaptan a las necesidades cambiantes de nuestros clientes, independientemente de su tamaño o ubicación.",
  },
  {
    titulo: "Responsabilidad y compromiso",
    desc: "Nuestras soluciones se adaptan a las necesidades cambiantes de nuestros clientes, independientemente de su tamaño o ubicación.",
  },
];

export default function About() {
  return (
    <section id="nosotros" className="py-24">
      <div className="section-container">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-2">Acerca de Koired</h2>
          <p className="text-muted text-sm">Construido sobre innovación, dedicación y crecimiento</p>
        </div>

        <div className="bg-[#111] border border-border rounded-3xl p-10 lg:p-14 grid lg:grid-cols-2 gap-14 items-center">
          <div className="flex flex-col divide-y divide-border">
            {PILARES.map(({ titulo, desc }) => (
              <div key={titulo} className="py-6 first:pt-0 last:pb-0">
                <p className="text-white font-semibold mb-1.5">{titulo}</p>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
              Empoderando y educando para el{" "}
              <span className="gradient-text">Éxito Empresarial</span>
            </h3>
            <p className="text-muted text-sm leading-relaxed">
              Nuestra misión es empoderar a los trabajadores latinoamericanos con soluciones
              innovadoras de pensión y dotarlos de las herramientas y el conocimiento para
              gestionar y hacer crecer su retiro con confianza.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
