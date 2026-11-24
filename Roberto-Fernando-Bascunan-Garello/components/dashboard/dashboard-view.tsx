"use client"

import Link from "next/link"
import { Activity, Gift, Plus, Sparkles, Users, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EncabezadoPagina, IconBox, Panel, PanelHeader, AvatarIniciales } from "@/components/shared/ui-bits"
import { StellarChip } from "@/components/shared/stellar-chip"
import { RankingWidget } from "@/components/dashboard/ranking-widget"
import { CumpleanosWidget } from "@/components/dashboard/cumpleanos-widget"
import { DistribucionNiveles, PuntosPorMes } from "@/components/dashboard/graficos"
import { SumarPuntosDialog } from "@/components/embajadores/sumar-puntos-dialog"
import { useDatos } from "@/lib/store"
import { puntosTotales } from "@/lib/data/calculos"
import { formatearFecha, formatearNumero, nombreMes } from "@/lib/format"

function Kpi({ icon, tono, etiqueta, valor, detalle }: { icon: LucideIcon; tono: "primary" | "pink" | "orange" | "success"; etiqueta: string; valor: string; detalle: string }) {
  return (
    <Panel className="flex items-center gap-4 p-5">
      <IconBox icon={icon} tono={tono} className="size-12" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
        <p className="text-2xl font-bold tracking-tight tabular-nums">{valor}</p>
        <p className="truncate text-xs text-muted-foreground">{detalle}</p>
      </div>
    </Panel>
  )
}

export function DashboardView() {
  const { embajadores, movimientos, premios, actividades, comunidad, permitido } = useDatos()
  const hoy = new Date()
  const periodoMes = { tipo: "mes" as const, anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }
  const periodoMesAnterior = (() => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    return { tipo: "mes" as const, anio: d.getFullYear(), mes: d.getMonth() + 1 }
  })()
  const puntosMes = puntosTotales(movimientos, periodoMes)
  const puntosAnterior = puntosTotales(movimientos, periodoMesAnterior)
  const variacion = puntosAnterior ? Math.round(((puntosMes - puntosAnterior) / puntosAnterior) * 100) : 0
  const activos = embajadores.filter((e) => e.estado === "activo").length
  const movsMes = movimientos.filter((m) => m.fecha.startsWith(`${periodoMes.anio}-${String(periodoMes.mes).padStart(2, "0")}`))
  const premiosPendientes = premios.filter((p) => p.estado !== "pagado").length
  const recientes = movimientos.slice(0, 6)

  return (
    <>
      <EncabezadoPagina
        titulo={`Hola, equipo de ${comunidad.nombre}`}
        descripcion={`Resumen de ${nombreMes(periodoMes.mes).toLowerCase()} ${periodoMes.anio}. Todos los puntos se registran como StellarPoints en Stellar Testnet.`}
        acciones={
          permitido("cargar_puntos") && (
            <SumarPuntosDialog
              trigger={
                <Button className="h-10 rounded-xl px-4 glow-primary">
                  <Plus className="size-4" aria-hidden />
                  Sumar puntos
                </Button>
              }
            />
          )
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} tono="primary" etiqueta="Embajadores activos" valor={String(activos)} detalle={`${embajadores.length - activos} inactivos`} />
        <Kpi
          icon={Sparkles}
          tono="orange"
          etiqueta="Puntos del mes"
          valor={formatearNumero(puntosMes)}
          detalle={`${variacion >= 0 ? "+" : ""}${variacion}% vs. ${nombreMes(periodoMesAnterior.mes).toLowerCase()}`}
        />
        <Kpi icon={Activity} tono="success" etiqueta="Movimientos del mes" valor={String(movsMes.length)} detalle="Registrados on-chain" />
        <Kpi icon={Gift} tono="pink" etiqueta="Premios por gestionar" valor={String(premiosPendientes)} detalle="Pendientes o aprobados" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <RankingWidget />
        </div>
        <div className="xl:col-span-2">
          <CumpleanosWidget />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <PuntosPorMes />
        <DistribucionNiveles />
      </div>

      <Panel className="mt-5">
        <PanelHeader
          titulo="Actividad reciente"
          acciones={
            <Button variant="ghost" size="sm" render={<Link href="/registro" />} nativeButton={false}>
              Ver registro completo
            </Button>
          }
        />
        <ul className="flex flex-col divide-y divide-dashed">
          {recientes.map((m) => {
            const emb = embajadores.find((e) => e.id === m.embajadorId)
            const act = actividades.find((a) => a.id === m.actividadId)
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <AvatarIniciales nombre={emb?.nombre ?? "?"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <Link href={`/embajadores/${m.embajadorId}`} className="font-medium hover:underline">
                      {emb?.nombre}
                    </Link>{" "}
                    <span className="text-muted-foreground">· {act?.nombre}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatearFecha(m.fecha)}</p>
                </div>
                <span className={m.puntos < 0 ? "text-sm font-bold text-destructive tabular-nums" : "text-sm font-bold text-success tabular-nums"}>
                  {m.puntos > 0 ? "+" : ""}
                  {m.puntos} StellarPoints
                </span>
                <StellarChip txHash={m.txHash} estado={m.estadoBlockchain} movimientoId={m.id} />
              </li>
            )
          })}
        </ul>
      </Panel>
    </>
  )
}
