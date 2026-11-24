"use client"

import { useState } from "react"
import { Pencil, Plus, Target, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { EncabezadoPagina, Panel, Chip, EstadoVacio } from "@/components/shared/ui-bits"
import { ConfirmarDialog } from "@/components/shared/confirmar-dialog"
import { useDatos } from "@/lib/store"
import { formatearNumero } from "@/lib/format"
import type { Actividad } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ReglasView() {
  const { actividades, movimientos, acciones, permitido } = useDatos()
  const [eliminar, setEliminar] = useState<Actividad | null>(null)
  const editable = permitido("gestionar_reglas")

  const usos = (id: string) => movimientos.filter((m) => m.actividadId === id && !m.revierteA)

  return (
    <>
      <EncabezadoPagina
        titulo="Reglas de puntos"
        descripcion="Define cuántos puntos otorga cada actividad. Los cambios no afectan movimientos ya registrados."
        acciones={
          editable && (
            <ActividadDialog
              trigger={
                <Button className="h-10 rounded-xl glow-primary">
                  <Plus className="size-4" aria-hidden />
                  Nueva actividad
                </Button>
              }
            />
          )
        }
      />

      {actividades.length === 0 ? (
        <Panel>
          <EstadoVacio icon={Target} titulo="Aún no hay actividades" descripcion="Crea la primera regla para empezar a sumar puntos." />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {actividades.map((a) => {
            const u = usos(a.id)
            const total = u.reduce((s, m) => s + m.puntos, 0)
            return (
              <Panel key={a.id} className={cn("flex flex-col gap-4", !a.activa && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-pretty">{a.nombre}</h2>
                    <p className="mt-1 text-sm text-muted-foreground text-pretty">{a.descripcion || "Sin descripción"}</p>
                  </div>
                  {editable && (
                    <Switch
                      checked={a.activa}
                      aria-label={a.activa ? `Desactivar ${a.nombre}` : `Activar ${a.nombre}`}
                      onCheckedChange={(v) => {
                        acciones.guardarActividad({ ...a, activa: v })
                        toast.success(v ? "Actividad activada" : "Actividad desactivada")
                      }}
                    />
                  )}
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-4xl font-bold tracking-tight tabular-nums text-primary">{a.puntosDefecto}</p>
                    <p className="text-xs text-muted-foreground">puntos por defecto</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {a.puntosVariables ? <Chip tono="orange">Variable</Chip> : <Chip tono="primary">Fijo</Chip>}
                    {!a.activa && <Chip>Inactiva</Chip>}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-dashed pt-3 text-xs text-muted-foreground">
                  <span>
                    {u.length} usos · {formatearNumero(total)} pts emitidos
                  </span>
                  {editable && (
                    <div className="flex gap-1">
                      <ActividadDialog
                        actividad={a}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${a.nombre}`}>
                            <Pencil className="size-4" aria-hidden />
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${a.nombre}`} onClick={() => setEliminar(a)}>
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      <ConfirmarDialog
        abierto={!!eliminar}
        onAbiertoChange={(v) => !v && setEliminar(null)}
        titulo={`¿Eliminar “${eliminar?.nombre}”?`}
        descripcion={
          eliminar && usos(eliminar.id).length
            ? "Esta actividad ya tiene movimientos, así que se desactivará en lugar de eliminarse para conservar el historial."
            : "Esta acción no se puede deshacer."
        }
        textoConfirmar={eliminar && usos(eliminar.id).length ? "Desactivar" : "Eliminar"}
        destructivo
        onConfirmar={() => {
          if (!eliminar) return
          if (usos(eliminar.id).length) acciones.guardarActividad({ ...eliminar, activa: false })
          else acciones.eliminarActividad(eliminar.id)
          toast.success("Listo")
          setEliminar(null)
        }}
      />
    </>
  )
}

function ActividadDialog({ trigger, actividad }: { trigger: React.ReactElement; actividad?: Actividad }) {
  const { acciones } = useDatos()
  const [open, setOpen] = useState(false)
  const inicial = () => ({
    nombre: actividad?.nombre ?? "",
    descripcion: actividad?.descripcion ?? "",
    puntos: String(actividad?.puntosDefecto ?? 10),
    variable: actividad?.puntosVariables ?? false,
    activa: actividad?.activa ?? true,
  })
  const [f, setF] = useState(inicial)
  const puntos = Number(f.puntos)
  const valido = f.nombre.trim().length >= 3 && Number.isInteger(puntos) && puntos > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setF(inicial())
        setOpen(v)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="rounded-3xl sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valido) return
            acciones.guardarActividad({ id: actividad?.id, nombre: f.nombre.trim(), descripcion: f.descripcion.trim(), puntosDefecto: puntos, puntosVariables: f.variable, activa: f.activa })
            toast.success(actividad ? "Actividad actualizada" : "Actividad creada")
            setOpen(false)
          }}
        >
          <DialogHeader>
            <DialogTitle>{actividad ? "Editar actividad" : "Nueva actividad"}</DialogTitle>
            <DialogDescription>Las actividades activas aparecen al sumar puntos.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="act-nombre">Nombre</Label>
            <Input id="act-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className="rounded-xl" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="act-desc">Descripción</Label>
            <Textarea id="act-desc" rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="act-puntos">Puntos por defecto</Label>
            <Input id="act-puntos" type="number" min={1} step={1} value={f.puntos} onChange={(e) => setF({ ...f, puntos: e.target.value })} className="rounded-xl" />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
            <span>
              <span className="block text-sm font-medium">Puntos variables</span>
              <span className="block text-xs text-muted-foreground">Permite ajustar los puntos al cargar</span>
            </span>
            <Switch checked={f.variable} onCheckedChange={(v) => setF({ ...f, variable: v })} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
            <span className="text-sm font-medium">Activa</span>
            <Switch checked={f.activa} onCheckedChange={(v) => setF({ ...f, activa: v })} />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
