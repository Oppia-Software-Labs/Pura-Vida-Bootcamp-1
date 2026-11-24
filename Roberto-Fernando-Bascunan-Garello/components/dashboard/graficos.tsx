"use client"

import { useMemo } from "react"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { Panel, PanelHeader } from "@/components/shared/ui-bits"
import { useDatos } from "@/lib/store"
import { nivelDe, nivelesOrdenados, puntosPorEmbajador, puntosTotales } from "@/lib/data/calculos"
import { formatearNumero, nombreMes } from "@/lib/format"

function TooltipSimple({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{formatearNumero(payload[0].value)} puntos</p>
    </div>
  )
}

export function PuntosPorMes() {
  const { movimientos } = useDatos()
  const datos = useMemo(() => {
    const hoy = new Date()
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - 9 + i, 1)
      const periodo = { tipo: "mes" as const, anio: d.getFullYear(), mes: d.getMonth() + 1 }
      return { label: nombreMes(periodo.mes, true), puntos: puntosTotales(movimientos, periodo), actual: i === 9 }
    })
  }, [movimientos])

  return (
    <Panel>
      <PanelHeader titulo="Puntos por mes" descripcion="Últimos 10 meses" />
      <div className="h-56" role="img" aria-label="Gráfico de barras de puntos otorgados por mes">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip content={<TooltipSimple />} cursor={{ fill: "var(--accent)", radius: 8 }} />
            <Bar dataKey="puntos" radius={[8, 8, 8, 8]} maxBarSize={18}>
              {datos.map((d) => (
                <Cell key={d.label} fill={d.actual ? "var(--primary)" : "color-mix(in oklab, var(--primary) 45%, transparent)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

export function DistribucionNiveles() {
  const { embajadores, movimientos, niveles } = useDatos()
  const datos = useMemo(() => {
    const puntos = puntosPorEmbajador(movimientos)
    const activos = embajadores.filter((e) => e.estado === "activo")
    const conteo = new Map<string, number>()
    for (const e of activos) {
      const n = nivelDe(e, niveles)
      if (n) conteo.set(n.id, (conteo.get(n.id) ?? 0) + 1)
    }
    return nivelesOrdenados(niveles).map((n) => ({
      nombre: n.nombre,
      color: n.color,
      valor: conteo.get(n.id) ?? 0,
      pct: activos.length ? Math.round(((conteo.get(n.id) ?? 0) / activos.length) * 100) : 0,
    }))
  }, [embajadores, movimientos, niveles])

  return (
    <Panel>
      <PanelHeader titulo="Distribución por nivel" descripcion="Embajadores activos" />
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <ul className="flex w-full flex-1 flex-col">
          {datos.map((d) => (
            <li key={d.nombre} className="flex items-center gap-3 border-b border-dashed py-2.5 last:border-0">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm">{d.nombre}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{d.valor}</span>
              <span className="w-10 text-right text-sm font-semibold tabular-nums">{d.pct}%</span>
            </li>
          ))}
        </ul>
        <div className="relative size-36 shrink-0" role="img" aria-label="Gráfico de dona de distribución por nivel">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius={46} outerRadius={62} paddingAngle={4} cornerRadius={8} stroke="none">
                {datos.map((d) => (
                  <Cell key={d.nombre} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 m-auto flex size-20 flex-col items-center justify-center rounded-full neu-sm">
            <span className="text-lg font-bold">{datos.reduce((s, d) => s + d.valor, 0)}</span>
            <span className="text-[10px] text-muted-foreground">activos</span>
          </div>
        </div>
      </div>
    </Panel>
  )
}
