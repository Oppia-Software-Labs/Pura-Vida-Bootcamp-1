"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Download, FileUp, Plus, Search, Sparkles, UserMinus, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EncabezadoPagina, Panel, AvatarIniciales, Chip, EstadoVacio } from "@/components/shared/ui-bits"
import { SimpleSelect } from "@/components/shared/simple-select"
import { Bandera } from "@/components/shared/bandera"
import { NivelBadge } from "@/components/shared/nivel-badge"
import { ConfirmarDialog } from "@/components/shared/confirmar-dialog"
import { SumarPuntosDialog } from "@/components/embajadores/sumar-puntos-dialog"
import { EmbajadorFormDialog } from "@/components/embajadores/embajador-form-dialog"
import { ImportarDialog } from "@/components/embajadores/importar-dialog"
import { useDatos } from "@/lib/store"
import { CODIGOS_PAIS, PAISES } from "@/lib/data/paises"
import { nivelDe, nivelesOrdenados, puntosPorEmbajador } from "@/lib/data/calculos"
import { formatearFecha, formatearNumero, normalizarTexto } from "@/lib/format"
import { abreviarHash } from "@/lib/stellar"
import { descargarCSV } from "@/lib/exportar"

export function EmbajadoresView() {
  const { embajadores, movimientos, niveles, acciones, permitido } = useDatos()
  const [q, setQ] = useState("")
  const [pais, setPais] = useState("todos")
  const [nivel, setNivel] = useState("todos")
  const [estado, setEstado] = useState("activo")
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [sumarAbierto, setSumarAbierto] = useState(false)
  const [bajaAbierta, setBajaAbierta] = useState(false)

  const hoy = new Date()
  const filas = useMemo(() => {
    const totales = puntosPorEmbajador(movimientos)
    const mes = puntosPorEmbajador(movimientos, { tipo: "mes", anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 })
    const t = normalizarTexto(q)
    return embajadores
      .map((e) => ({ e, total: totales.get(e.id) ?? 0, mes: mes.get(e.id) ?? 0, nivel: nivelDe(e, niveles) }))
      .filter(
        (f) =>
          (!t || normalizarTexto(f.e.nombre).includes(t) || normalizarTexto(f.e.telegram ?? "").includes(t.replace("@", ""))) &&
          (pais === "todos" || f.e.pais === pais) &&
          (nivel === "todos" || f.nivel?.id === nivel) &&
          (estado === "todos" || f.e.estado === estado),
      )
      .sort((a, b) => b.total - a.total)
  }, [embajadores, movimientos, niveles, q, pais, nivel, estado, hoy])

  const todosMarcados = filas.length > 0 && filas.every((f) => seleccion.includes(f.e.id))
  const seleccionActiva = seleccion.filter((id) => embajadores.find((e) => e.id === id)?.estado === "activo")

  const exportar = () => {
    descargarCSV(
      "embajadores",
      ["Nombre", "País", "Telegram", "Wallet", "Nivel", "Puntos totales", "Puntos del mes", "Ingreso", "Estado"],
      filas.map((f) => [f.e.nombre, PAISES[f.e.pais].nombre, f.e.telegram ? `@${f.e.telegram}` : "", f.e.wallet ?? "", f.nivel?.nombre ?? "", f.total, f.mes, f.e.fechaIngreso, f.e.estado]),
    )
    toast.success(`${filas.length} embajadores exportados`)
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Embajadores"
        descripcion="Gestiona a los miembros del programa, sus wallets de Stellar y sus puntos."
        acciones={
          <>
            <Button variant="outline" className="h-10 rounded-xl" onClick={exportar}>
              <Download className="size-4" aria-hidden />
              Exportar
            </Button>
            {permitido("gestionar_embajadores") && (
              <>
                <ImportarDialog
                  trigger={
                    <Button variant="outline" className="h-10 rounded-xl">
                      <FileUp className="size-4" aria-hidden />
                      Importar
                    </Button>
                  }
                />
                <EmbajadorFormDialog
                  trigger={
                    <Button className="h-10 rounded-xl glow-primary">
                      <Plus className="size-4" aria-hidden />
                      Nuevo embajador
                    </Button>
                  }
                />
              </>
            )}
          </>
        }
      />

      <Panel className="p-0 sm:p-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o Telegram" className="h-9 rounded-xl pl-9" aria-label="Buscar embajadores" />
          </div>
          <SimpleSelect
            ariaLabel="País"
            className="w-40"
            value={pais}
            onChange={setPais}
            opciones={[{ value: "todos", label: "Todos los países" }, ...CODIGOS_PAIS.map((c) => ({ value: c, label: <Bandera pais={c} conNombre /> }))]}
          />
          <SimpleSelect
            ariaLabel="Nivel"
            className="w-40"
            value={nivel}
            onChange={setNivel}
            opciones={[{ value: "todos", label: "Todos los niveles" }, ...nivelesOrdenados(niveles).map((n) => ({ value: n.id, label: n.nombre }))]}
          />
          <SimpleSelect
            ariaLabel="Estado"
            className="w-32"
            value={estado}
            onChange={setEstado}
            opciones={[
              { value: "activo", label: "Activos" },
              { value: "inactivo", label: "Inactivos" },
              { value: "todos", label: "Todos" },
            ]}
          />
        </div>

        {seleccion.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-accent/60 px-4 py-2.5">
            <span className="text-sm font-medium">{seleccion.length} seleccionados</span>
            <div className="ml-auto flex flex-wrap gap-2">
              {permitido("cargar_puntos") && seleccionActiva.length > 0 && (
                <Button size="sm" className="rounded-lg" onClick={() => setSumarAbierto(true)}>
                  <Sparkles className="size-4" aria-hidden />
                  Sumar puntos
                </Button>
              )}
              {permitido("gestionar_embajadores") &&
                (estado === "inactivo" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => {
                      acciones.cambiarEstadoEmbajadores(seleccion, "activo")
                      toast.success("Embajadores restaurados")
                      setSeleccion([])
                    }}
                  >
                    <UserPlus className="size-4" aria-hidden />
                    Restaurar
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => setBajaAbierta(true)}>
                    <UserMinus className="size-4" aria-hidden />
                    Dar de baja
                  </Button>
                ))}
              <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setSeleccion([])}>
                Limpiar
              </Button>
            </div>
          </div>
        )}

        {filas.length === 0 ? (
          <EstadoVacio icon={Users} titulo="No hay embajadores con estos filtros" descripcion="Prueba con otra búsqueda o cambia los filtros." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="Seleccionar todos"
                    checked={todosMarcados}
                    onCheckedChange={(v) => setSeleccion(v ? filas.map((f) => f.e.id) : [])}
                  />
                </TableHead>
                <TableHead>Embajador</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead className="text-right">Puntos</TableHead>
                <TableHead className="text-right">Este mes</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="pr-4">Ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.e.id} data-state={seleccion.includes(f.e.id) ? "selected" : undefined}>
                  <TableCell className="pl-4">
                    <Checkbox
                      aria-label={`Seleccionar a ${f.e.nombre}`}
                      checked={seleccion.includes(f.e.id)}
                      onCheckedChange={(v) => setSeleccion((s) => (v ? [...s, f.e.id] : s.filter((x) => x !== f.e.id)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/embajadores/${f.e.id}`} className="flex items-center gap-3 hover:underline">
                      <AvatarIniciales nombre={f.e.nombre} />
                      <span className="min-w-0">
                        <span className="block font-medium">{f.e.nombre}</span>
                        <span className="block text-xs text-muted-foreground">{f.e.telegram ? `@${f.e.telegram}` : "Sin Telegram"}</span>
                      </span>
                      {f.e.estado === "inactivo" && <Chip>Inactivo</Chip>}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Bandera pais={f.e.pais} conNombre className="text-sm" />
                  </TableCell>
                  <TableCell>
                    <NivelBadge nivel={f.nivel} />
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatearNumero(f.total)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{f.mes ? `+${formatearNumero(f.mes)}` : "—"}</TableCell>
                  <TableCell>
                    {f.e.wallet ? (
                      <span className="font-mono text-xs text-muted-foreground" title={f.e.wallet}>
                        {abreviarHash(f.e.wallet, 4, 4)}
                      </span>
                    ) : (
                      <Chip tono="orange">Sin wallet</Chip>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-sm text-muted-foreground">{formatearFecha(f.e.fechaIngreso)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <SumarPuntosDialog abierto={sumarAbierto} onAbiertoChange={setSumarAbierto} embajadorIdsIniciales={seleccionActiva} />
      <ConfirmarDialog
        abierto={bajaAbierta}
        onAbiertoChange={setBajaAbierta}
        titulo={`¿Dar de baja a ${seleccion.length} embajador${seleccion.length === 1 ? "" : "es"}?`}
        descripcion="Dejarán de aparecer en rankings. Su historial de puntos se conserva y puedes restaurarlos cuando quieras."
        textoConfirmar="Dar de baja"
        destructivo
        onConfirmar={() => {
          acciones.cambiarEstadoEmbajadores(seleccion, "inactivo")
          toast.success("Embajadores dados de baja")
          setSeleccion([])
        }}
      />
    </>
  )
}
