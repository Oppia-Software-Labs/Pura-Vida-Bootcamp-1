"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Cake, CalendarDays, Gift, History, Pencil, Send, Sparkles, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Panel, PanelHeader, AvatarIniciales, BarraProgreso, BotonCopiar, Chip, EstadoVacio } from "@/components/shared/ui-bits"
import { Bandera } from "@/components/shared/bandera"
import { IconoNivelBox } from "@/components/shared/nivel-badge"
import { StellarChip } from "@/components/shared/stellar-chip"
import { SumarPuntosDialog } from "@/components/embajadores/sumar-puntos-dialog"
import { EmbajadorFormDialog } from "@/components/embajadores/embajador-form-dialog"
import { RevertirDialog } from "@/components/registro/revertir-dialog"
import { useDatos } from "@/lib/store"
import { nivelesOrdenados, progresoNivel, puntosPorEmbajador } from "@/lib/data/calculos"
import { SimpleSelect } from "@/components/shared/simple-select"
import { toast } from "sonner"
import { formatearFecha, formatearNumero, nombreMes } from "@/lib/format"
import { abreviarHash, urlCuenta, urlTransaccion } from "@/lib/stellar"
import { cn } from "@/lib/utils"

export function FichaView({ id }: { id: string }) {
  const { embajadores, movimientos, niveles, actividades, premios, admins, permitido, acciones } = useDatos()
  const [tab, setTab] = useState<"historial" | "premios">("historial")
  const [revertirId, setRevertirId] = useState<string | null>(null)
  const emb = embajadores.find((e) => e.id === id)

  if (!emb) {
    return (
      <Panel>
        <EstadoVacio icon={History} titulo="Embajador no encontrado" descripcion="Puede que haya sido eliminado o el enlace sea incorrecto." />
        <div className="flex justify-center">
          <Button variant="outline" render={<Link href="/embajadores" />} nativeButton={false}>
            Volver a embajadores
          </Button>
        </div>
      </Panel>
    )
  }

  const total = puntosPorEmbajador(movimientos).get(emb.id) ?? 0
  const hoy = new Date()
  const delMes = puntosPorEmbajador(movimientos, { tipo: "mes", anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }).get(emb.id) ?? 0
  const delAnio = puntosPorEmbajador(movimientos, { tipo: "anio", anio: hoy.getFullYear() }).get(emb.id) ?? 0
  const prog = progresoNivel(total, emb, niveles)
  const historial = movimientos.filter((m) => m.embajadorId === emb.id)
  const susPremios = premios.filter((p) => p.embajadorId === emb.id)

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" render={<Link href="/embajadores" />} nativeButton={false}>
        <ArrowLeft className="size-4" aria-hidden />
        Embajadores
      </Button>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex flex-wrap items-start gap-4">
            <AvatarIniciales nombre={emb.nombre} className="size-16 text-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-balance">{emb.nombre}</h1>
                {emb.estado === "inactivo" && <Chip tono="destructive">Inactivo</Chip>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <Bandera pais={emb.pais} conNombre />
                <span className="inline-flex items-center gap-1.5">
                  <Cake className="size-4" aria-hidden />
                  {emb.cumpleDia && emb.cumpleMes
                    ? `${emb.cumpleDia} de ${nombreMes(emb.cumpleMes).toLowerCase()}`
                    : "Cumpleaños sin registrar"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden />
                  Desde {formatearFecha(emb.fechaIngreso)}
                </span>
                {emb.telegram && (
                  <a href={`https://t.me/${emb.telegram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary">
                    <Send className="size-4" aria-hidden />@{emb.telegram}
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {permitido("gestionar_embajadores") && (
                <EmbajadorFormDialog
                  embajador={emb}
                  trigger={
                    <Button variant="outline" className="rounded-xl">
                      <Pencil className="size-4" aria-hidden />
                      Editar
                    </Button>
                  }
                />
              )}
              {permitido("cargar_puntos") && emb.estado === "activo" && (
                <SumarPuntosDialog
                  embajadorIdsIniciales={[emb.id]}
                  trigger={
                    <Button className="rounded-xl glow-primary">
                      <Sparkles className="size-4" aria-hidden />
                      Sumar puntos
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Puntos totales", total],
              [`${nombreMes(hoy.getMonth() + 1)}`, delMes],
              [`Año ${hoy.getFullYear()}`, delAnio],
            ].map(([label, v]) => (
              <div key={label} className="neu-inset rounded-2xl bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatearNumero(Number(v))} <span className="text-xs font-medium text-muted-foreground">StellarPoints</span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed p-4">
            <div className="flex items-center gap-3">
              {prog.actual && <IconoNivelBox nivel={prog.actual} />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{prog.actual?.nombre ?? "Sin nivel"}</p>
                <p className="text-xs text-muted-foreground">
                  {prog.siguiente ? `Faltan ${formatearNumero(prog.faltan)} puntos para ${prog.siguiente.nombre}` : "Nivel máximo alcanzado"}
                </p>
              </div>
              {permitido("gestionar_embajadores") ? (
                <SimpleSelect
                  value={prog.actual?.id ?? ""}
                  onChange={(nivelId) => {
                    acciones.asignarNivel(emb.id, nivelId)
                    toast.success(`Nivel actualizado a ${niveles.find((n) => n.id === nivelId)?.nombre ?? nivelId}`)
                  }}
                  opciones={nivelesOrdenados(niveles).map((n) => ({ value: n.id, label: n.nombre }))}
                  ariaLabel="Cambiar nivel del embajador"
                  className="w-48"
                />
              ) : (
                <span className="text-sm font-bold tabular-nums">{prog.porcentaje}%</span>
              )}
            </div>
            <BarraProgreso valor={prog.porcentaje} color={prog.siguiente?.color ?? prog.actual?.color} className="mt-3" etiqueta="Progreso al siguiente nivel" />
            {prog.actual && prog.actual.beneficios.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {prog.actual.beneficios.map((b) => (
                  <li key={b}>
                    <Chip tono="primary">{b}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader titulo="Wallet de Stellar" descripcion="Testnet" acciones={<span className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary"><Wallet className="size-5" aria-hidden /></span>} />
          {emb.wallet ? (
            <>
              <p className="neu-inset rounded-2xl bg-muted/40 p-3 font-mono text-xs break-all">{emb.wallet}</p>
              <div className="mt-3 flex gap-2">
                <BotonCopiar texto={emb.wallet} etiqueta="Copiar wallet" mensaje="Wallet copiada">
                  Copiar
                </BotonCopiar>
                <Button variant="outline" size="sm" className="rounded-lg" render={<a href={urlCuenta(emb.wallet)} target="_blank" rel="noreferrer" />} nativeButton={false}>
                  Ver en explorador
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Button>
              </div>
              <div className="mt-auto pt-5">
                <p className="text-xs text-muted-foreground">Balance on-chain</p>
                <p className="text-3xl font-bold tabular-nums">
                  {formatearNumero(total)} <span className="text-sm text-muted-foreground">StellarPoints</span>
                </p>
              </div>
            </>
          ) : (
            <EstadoVacio icon={Wallet} titulo="Sin wallet registrada" descripcion="Los puntos se acumulan y se emitirán cuando registre su wallet." />
          )}
        </Panel>
      </div>

      <Panel className="mt-5 p-0 sm:p-0">
        <div role="tablist" aria-label="Detalle" className="flex gap-1 border-b px-4 pt-3">
          {(
            [
              ["historial", `Historial (${historial.length})`, History],
              ["premios", `Premios (${susPremios.length})`, Gift],
            ] as const
          ).map(([valor, label, Icon]) => (
            <button
              key={valor}
              role="tab"
              type="button"
              aria-selected={tab === valor}
              onClick={() => setTab(valor)}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
                tab === valor ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {tab === "historial" ? (
          historial.length === 0 ? (
            <EstadoVacio icon={History} titulo="Todavía no tiene movimientos" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Fecha</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                  <TableHead>Cargado por</TableHead>
                  <TableHead>Stellar</TableHead>
                  <TableHead className="pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((m) => (
                  <TableRow key={m.id} className={m.revertidoPor ? "opacity-60" : undefined}>
                    <TableCell className="pl-4 text-sm whitespace-nowrap">{formatearFecha(m.fecha)}</TableCell>
                    <TableCell>
                      <span className="block text-sm font-medium">{actividades.find((a) => a.id === m.actividadId)?.nombre}</span>
                      {m.nota && <span className="block max-w-xs truncate text-xs text-muted-foreground">{m.nota}</span>}
                      {m.revertidoPor && <Chip className="mt-1">Revertido</Chip>}
                    </TableCell>
                    <TableCell className={cn("text-right font-bold tabular-nums", m.puntos < 0 ? "text-destructive" : "text-success")}>
                      {m.puntos > 0 ? "+" : ""}
                      {m.puntos}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{admins.find((a) => a.id === m.cargadoPor)?.nombre ?? "—"}</TableCell>
                    <TableCell>
                      <StellarChip txHash={m.txHash} estado={m.estadoBlockchain} movimientoId={m.id} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {permitido("revertir_movimientos") && !m.revertidoPor && !m.revierteA && m.estadoBlockchain === "confirmado" && (
                        <Button variant="ghost" size="sm" onClick={() => setRevertirId(m.id)}>
                          Revertir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : susPremios.length === 0 ? (
          <EstadoVacio icon={Gift} titulo="Sin premios todavía" />
        ) : (
          <ul className="divide-y divide-dashed">
            {susPremios.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-brand-pink/12 text-brand-pink">
                  <Gift className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{p.concepto}</p>
                  <p className="text-xs text-muted-foreground">{formatearFecha(p.fecha)}</p>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {formatearNumero(p.monto, 2)} {p.moneda}
                </span>
                <Chip tono={p.estado === "pagado" ? "success" : p.estado === "aprobado" ? "primary" : "orange"} className="capitalize">
                  {p.estado}
                </Chip>
                {p.txHash && (
                  <a href={urlTransaccion(p.txHash)} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary hover:underline">
                    {abreviarHash(p.txHash)}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <RevertirDialog movimientoId={revertirId} onCerrar={() => setRevertirId(null)} />
    </>
  )
}
