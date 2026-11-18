"use client"

import Link from "next/link"
import { Cake } from "lucide-react"
import { Panel, PanelHeader, BotonCopiar, EstadoVacio, Chip } from "@/components/shared/ui-bits"
import { Bandera } from "@/components/shared/bandera"
import { useDatos } from "@/lib/store"
import { nombreMes } from "@/lib/format"
import { cn } from "@/lib/utils"

export function CumpleanosWidget() {
  const { embajadores, comunidad } = useDatos()
  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const dia = hoy.getDate()

  const lista = embajadores
    .filter((e) => e.estado === "activo" && e.cumpleMes === mes && e.cumpleDia !== null)
    .sort((a, b) => (a.cumpleDia ?? 0) - (b.cumpleDia ?? 0))
    .map((e) => ({ e, faltan: (e.cumpleDia ?? 0) - dia }))

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        titulo="Cumpleaños"
        descripcion={`${nombreMes(mes)} · ${lista.length} embajador${lista.length === 1 ? "" : "es"}`}
        acciones={
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-brand-pink/12 text-brand-pink" aria-hidden>
            <Cake className="size-5" />
          </span>
        }
      />
      {lista.length === 0 ? (
        <EstadoVacio icon={Cake} titulo="Sin cumpleaños este mes" />
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map(({ e, faltan }) => {
            const esHoy = faltan === 0
            const proximo = faltan > 0 && faltan <= 7
            const primerNombre = e.nombre.split(" ")[0]
            const saludo = `¡Feliz cumpleaños, ${primerNombre}! De parte de toda la comunidad ${comunidad.nombre}, gracias por ser parte de este equipo. Que tengas un año increíble.`
            return (
              <li
                key={e.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                  esHoy ? "neu-sm ring-2 ring-brand-pink/40" : proximo ? "bg-accent" : "",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none",
                    esHoy ? "bg-brand-pink text-white glow-pink" : "bg-muted text-foreground",
                  )}
                >
                  <span className="text-base font-bold">{e.cumpleDia}</span>
                  <span className="text-[10px] uppercase">{nombreMes(mes, true)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/embajadores/${e.id}`} className="flex items-center gap-2 hover:underline">
                    <span className="truncate text-sm font-medium">{e.nombre}</span>
                    <Bandera pais={e.pais} />
                  </Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {esHoy ? (
                      <Chip tono="pink" className="px-2 py-0.5 text-[11px]">
                        ¡Hoy!
                      </Chip>
                    ) : proximo ? (
                      <span className="font-medium text-primary">En {faltan} día{faltan === 1 ? "" : "s"}</span>
                    ) : faltan < 0 ? (
                      "Ya celebrado"
                    ) : (
                      `En ${faltan} días`
                    )}
                  </div>
                </div>
                <BotonCopiar texto={saludo} etiqueta={`Copiar saludo para ${primerNombre}`} mensaje="Saludo copiado">
                  <span className="hidden sm:inline">Saludo</span>
                </BotonCopiar>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
