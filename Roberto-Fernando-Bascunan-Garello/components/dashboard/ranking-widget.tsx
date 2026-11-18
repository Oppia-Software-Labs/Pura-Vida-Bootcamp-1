"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Trophy } from "lucide-react"
import { Panel, PanelHeader, AvatarIniciales, EstadoVacio } from "@/components/shared/ui-bits"
import { SimpleSelect } from "@/components/shared/simple-select"
import { Bandera } from "@/components/shared/bandera"
import { NivelBadge } from "@/components/shared/nivel-badge"
import { useDatos } from "@/lib/store"
import { ranking } from "@/lib/data/calculos"
import { formatearNumero, nombreMes } from "@/lib/format"
import type { Periodo } from "@/lib/types"
import { cn } from "@/lib/utils"

type Modo = "mes" | "anio" | "total"

const MEDALLAS = ["bg-brand-orange text-white", "bg-[#a8adc9] text-white", "bg-[#d08a55] text-white"]

export function RankingWidget() {
  const { embajadores, movimientos, niveles } = useDatos()
  const hoy = new Date()
  const [modo, setModo] = useState<Modo>("mes")
  const [mes, setMes] = useState(String(hoy.getMonth() + 1))
  const [anio, setAnio] = useState(String(hoy.getFullYear()))

  const anios = useMemo(() => {
    const set = new Set(movimientos.map((m) => Number(m.fecha.slice(0, 4))))
    set.add(hoy.getFullYear())
    return [...set].sort((a, b) => b - a)
  }, [movimientos, hoy])

  const periodo: Periodo =
    modo === "total" ? { tipo: "total" } : modo === "anio" ? { tipo: "anio", anio: Number(anio) } : { tipo: "mes", anio: Number(anio), mes: Number(mes) }

  const filas = useMemo(() => ranking(embajadores, movimientos, niveles, periodo, 10), [embajadores, movimientos, niveles, periodo])

  return (
    <Panel className="flex flex-col">
      <PanelHeader titulo="Ranking" descripcion="Top 10 embajadores por puntos" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Periodo del ranking" className="neu-inset inline-flex rounded-xl bg-muted/60 p-1">
          {(
            [
              ["mes", "Mes"],
              ["anio", "Año"],
              ["total", "Total"],
            ] as const
          ).map(([valor, label]) => (
            <button
              key={valor}
              role="tab"
              type="button"
              aria-selected={modo === valor}
              onClick={() => setModo(valor)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                modo === valor ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {modo === "mes" && (
          <SimpleSelect
            ariaLabel="Mes"
            className="w-36"
            value={mes}
            onChange={setMes}
            opciones={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: nombreMes(i + 1) }))}
          />
        )}
        {modo !== "total" && (
          <SimpleSelect ariaLabel="Año" className="w-24" value={anio} onChange={setAnio} opciones={anios.map((a) => ({ value: String(a), label: String(a) }))} />
        )}
      </div>

      {filas.length === 0 ? (
        <EstadoVacio icon={Trophy} titulo="Sin puntos en este periodo" descripcion="Cuando se carguen puntos, el ranking aparecerá aquí." />
      ) : (
        <ol className="flex flex-col gap-1">
          {filas.map((f) => (
            <li key={f.embajador.id}>
              <Link
                href={`/embajadores/${f.embajador.id}`}
                className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-accent"
              >
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    MEDALLAS[f.posicion - 1] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {f.posicion}
                </span>
                <AvatarIniciales nombre={f.embajador.nombre} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{f.embajador.nombre}</span>
                    <Bandera pais={f.embajador.pais} />
                  </span>
                  <span className="mt-0.5 hidden sm:block">
                    <NivelBadge nivel={f.nivel} className="px-2 py-0.5 text-[11px]" />
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-bold tabular-nums">{formatearNumero(f.puntos)}</span>
                  <span className="block text-[11px] text-muted-foreground">StellarPoints</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
