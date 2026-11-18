"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Download, FileText, History, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EncabezadoPagina, Panel, Chip, EstadoVacio } from "@/components/shared/ui-bits"
import { SimpleSelect } from "@/components/shared/simple-select"
import { StellarChip } from "@/components/shared/stellar-chip"
import { SumarPuntosDialog } from "@/components/embajadores/sumar-puntos-dialog"
import { RevertirDialog } from "@/components/registro/revertir-dialog"
import { useDatos } from "@/lib/store"
import { formatearFecha, formatearNumero, nombreMes, normalizarTexto } from "@/lib/format"
import { descargarCSV, exportarPDF } from "@/lib/exportar"
import { cn } from "@/lib/utils"

const POR_PAGINA = 25

export function RegistroView() {
  const { movimientos, embajadores, actividades, admins, comunidad, permitido } = useDatos()
  const [q, setQ] = useState("")
  const [actividad, setActividad] = useState("todas")
  const [mes, setMes] = useState("todos")
  const [estado, setEstado] = useState("todos")
  const [pagina, setPagina] = useState(1)
  const [revertirId, setRevertirId] = useState<string | null>(null)

  const meses = useMemo(() => [...new Set(movimientos.map((m) => m.fecha.slice(0, 7)))].sort().reverse(), [movimientos])

  const filas = useMemo(() => {
    const t = normalizarTexto(q)
    return movimientos
      .map((m) => ({
        m,
        emb: embajadores.find((e) => e.id === m.embajadorId),
        act: actividades.find((a) => a.id === m.actividadId),
        admin: admins.find((a) => a.id === m.cargadoPor),
      }))
      .filter(
        (f) =>
          (!t || normalizarTexto(f.emb?.nombre ?? "").includes(t) || normalizarTexto(f.m.nota).includes(t) || (f.m.txHash ?? "").toLowerCase().includes(t)) &&
          (actividad === "todas" || f.m.actividadId === actividad) &&
          (mes === "todos" || f.m.fecha.startsWith(mes)) &&
          (estado === "todos" || f.m.estadoBlockchain === estado),
      )
  }, [movimientos, embajadores, actividades, admins, q, actividad, mes, estado])

  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA))
  const pag = Math.min(pagina, paginas)
  const visibles = filas.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA)
  const suma = filas.reduce((s, f) => s + f.m.puntos, 0)

  const columnas = ["Fecha", "Embajador", "Actividad", "Puntos", "Nota", "Cargado por", "Estado", "Tx hash"]
  const datosExport = () =>
    filas.map((f) => [f.m.fecha, f.emb?.nombre, f.act?.nombre, f.m.puntos, f.m.nota, f.admin?.nombre, f.m.estadoBlockchain, f.m.txHash])

  const etiquetaMes = (ym: string) => `${nombreMes(Number(ym.slice(5)))} ${ym.slice(0, 4)}`

  return (
    <>
      <EncabezadoPagina
        titulo="Registro de puntos"
        descripcion="Historial completo de movimientos. Cada uno corresponde a una transacción de StellarPoints en Stellar Testnet."
        acciones={
          <>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => {
                descargarCSV("registro-puntos", columnas, datosExport())
                toast.success("CSV descargado")
              }}
            >
              <Download className="size-4" aria-hidden />
              CSV
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => {
                const ok = exportarPDF(`Registro de puntos · ${comunidad.nombre}`, `${filas.length} movimientos · ${formatearNumero(suma)} StellarPoints netos`, columnas, datosExport())
                if (!ok) toast.error("Permite las ventanas emergentes para exportar el PDF")
              }}
            >
              <FileText className="size-4" aria-hidden />
              PDF
            </Button>
            {permitido("cargar_puntos") && (
              <SumarPuntosDialog
                trigger={
                  <Button className="h-10 rounded-xl glow-primary">
                    <Plus className="size-4" aria-hidden />
                    Sumar puntos
                  </Button>
                }
              />
            )}
          </>
        }
      />

      <Panel className="p-0 sm:p-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPagina(1)
              }}
              placeholder="Buscar embajador, nota o hash"
              className="h-9 rounded-xl pl-9"
              aria-label="Buscar movimientos"
            />
          </div>
          <SimpleSelect
            ariaLabel="Actividad"
            className="w-48"
            value={actividad}
            onChange={(v) => {
              setActividad(v)
              setPagina(1)
            }}
            opciones={[{ value: "todas", label: "Todas las actividades" }, ...actividades.map((a) => ({ value: a.id, label: a.nombre }))]}
          />
          <SimpleSelect
            ariaLabel="Mes"
            className="w-40"
            value={mes}
            onChange={(v) => {
              setMes(v)
              setPagina(1)
            }}
            opciones={[{ value: "todos", label: "Todos los meses" }, ...meses.map((m) => ({ value: m, label: etiquetaMes(m) }))]}
          />
          <SimpleSelect
            ariaLabel="Estado en Stellar"
            className="w-36"
            value={estado}
            onChange={(v) => {
              setEstado(v)
              setPagina(1)
            }}
            opciones={[
              { value: "todos", label: "Todos" },
              { value: "confirmado", label: "Confirmados" },
              { value: "pendiente", label: "Pendientes" },
              { value: "error", label: "Con error" },
            ]}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground">
          <span>{filas.length} movimientos</span>
          <span>
            Neto: <strong className="text-foreground tabular-nums">{formatearNumero(suma)} StellarPoints</strong>
          </span>
        </div>

        {visibles.length === 0 ? (
          <EstadoVacio icon={History} titulo="Sin movimientos" descripcion="Ajusta los filtros para ver resultados." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Fecha</TableHead>
                <TableHead>Embajador</TableHead>
                <TableHead>Actividad</TableHead>
                <TableHead className="text-right">Puntos</TableHead>
                <TableHead>Cargado por</TableHead>
                <TableHead>Stellar</TableHead>
                <TableHead className="pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map(({ m, emb, act, admin }) => (
                <TableRow key={m.id} className={m.revertidoPor ? "opacity-60" : undefined}>
                  <TableCell className="pl-4 text-sm whitespace-nowrap">{formatearFecha(m.fecha)}</TableCell>
                  <TableCell>
                    <Link href={`/embajadores/${m.embajadorId}`} className="text-sm font-medium hover:underline">
                      {emb?.nombre ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm">{act?.nombre}</span>
                    {m.nota && <span className="block max-w-56 truncate text-xs text-muted-foreground">{m.nota}</span>}
                    {m.revertidoPor && <Chip className="mt-1">Revertido</Chip>}
                    {m.revierteA && <Chip tono="destructive" className="mt-1">Reversión</Chip>}
                  </TableCell>
                  <TableCell className={cn("text-right font-bold tabular-nums", m.puntos < 0 ? "text-destructive" : "text-success")}>
                    {m.puntos > 0 ? "+" : ""}
                    {m.puntos}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{admin?.nombre ?? "—"}</TableCell>
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
        )}

        {paginas > 1 && (
          <nav aria-label="Paginación" className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Página {pag} de {paginas}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pag === 1} onClick={() => setPagina(pag - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={pag === paginas} onClick={() => setPagina(pag + 1)}>
                Siguiente
              </Button>
            </div>
          </nav>
        )}
      </Panel>

      <RevertirDialog movimientoId={revertirId} onCerrar={() => setRevertirId(null)} />
    </>
  )
}
