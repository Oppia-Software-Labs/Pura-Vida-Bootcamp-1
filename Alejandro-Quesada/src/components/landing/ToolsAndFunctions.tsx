"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const POOL_DATA = [
  { mes: "Ene", monto: 1200 },
  { mes: "Feb", monto: 3800 },
  { mes: "Mar", monto: 2200 },
  { mes: "Abr", monto: 5600 },
  { mes: "May", monto: 4100 },
  { mes: "Jun", monto: 7800 },
];

const HERRAMIENTAS = [
  {
    icono: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    titulo: "Asistente IA",
    desc: "Obtén sugerencias inteligentes, automatiza consultas complejas o solicita análisis de datos.",
    activa: true,
  },
  {
    icono: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    ),
    titulo: "Integración con API",
    desc: "Conéctate de forma fluida con plataformas de terceros como Slack o Shopify.",
    activa: false,
  },
  {
    icono: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    titulo: "Migración de datos",
    desc: "Importa datos fácilmente desde sistemas existentes sin complicaciones técnicas.",
    activa: false,
  },
];

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string | number;
}

const TooltipPersonalizado = ({ active, payload, label }: TooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1e1e1e] border border-border rounded-xl px-4 py-3 shadow-xl">
        <p className="text-muted text-xs mb-1">{label}</p>
        <p className="text-accent font-bold text-sm">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function ToolsAndFunctions() {
  return (
    <section id="blog" className="py-24">
      <div className="section-container">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">Herramientas y Funciones</h2>
          <p className="text-muted text-sm">
            Potenciando tu negocio con funciones inteligentes y herramientas de vanguardia.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Lista de herramientas */}
          <div className="flex flex-col gap-3">
            {HERRAMIENTAS.map(({ icono, titulo, desc, activa }) => (
              <div
                key={titulo}
                className={`flex items-start gap-4 rounded-2xl p-5 border transition-colors ${
                  activa
                    ? "bg-accent border-accent/40"
                    : "bg-[#161616] border-border hover:border-border/80"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 ${
                    activa ? "bg-white/15 text-white" : "bg-[#1e1e1e] text-muted"
                  }`}
                >
                  {icono}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm mb-0.5 ${activa ? "text-white" : "text-muted"}`}>
                    {titulo}
                  </p>
                  <p className={`text-xs leading-relaxed ${activa ? "text-white/80" : "text-muted/70"}`}>
                    {desc}
                  </p>
                </div>
                <div className={`flex-shrink-0 mt-0.5 ${activa ? "grid grid-cols-2 gap-1" : ""}`}>
                  {activa ? (
                    [0,1,2,3].map(i => (
                      <div key={i} className={`w-3 h-3 rounded-sm ${i%2===0 ? "bg-white/40" : "bg-white/20"}`} />
                    ))
                  ) : (
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tarjeta con gráfica */}
          <div className="bg-[#161616] border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-muted text-xs mb-1">Ganancias de este mes</p>
                <p className="text-accent text-2xl font-bold">$25.987,37</p>
                <button className="text-muted text-xs hover:text-white transition-colors mt-1">
                  Ver más detalles
                </button>
              </div>
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={POOL_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TooltipPersonalizado />} cursor={{ stroke: "#4F6EF7", strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="monto"
                  stroke="#4F6EF7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#4F6EF7", stroke: "#0a0a0a", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-5 mt-3">
              {["Contribuciones", "Distribuciones", "Comisiones", "Neto"].map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: i < 2 ? "#4F6EF7" : i === 2 ? "#6b7280" : "#374151" }}
                  />
                  <span className="text-muted text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
