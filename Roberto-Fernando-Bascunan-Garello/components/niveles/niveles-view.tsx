"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Layers, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EncabezadoPagina, Panel, Chip, EstadoVacio } from "@/components/shared/ui-bits"
import { ICONOS_NIVEL, IconoNivelBox } from "@/components/shared/nivel-badge"
import { ConfirmarDialog } from "@/components/shared/confirmar-dialog"
import { useDatos } from "@/lib/store"
import { nivelDe, nivelesOrdenados, puntosPorEmbajador } from "@/lib/data/calculos"
import { formatearNumero } from "@/lib/format"
import type { IconoNivel, Nivel } from "@/lib/types"
import { cn } from "@/lib/utils"

const COLORES = ["#7c6cf0", "#f2557a", "#f5a524", "#22b07d", "#3b82f6", "#a855f7", "#14b8a6", "#64748b"]

export function NivelesView() {
  const { niveles, embajadores, movimientos, acciones, permitido } = useDatos()
  const [eliminar, setEliminar] = useState<Nivel | null>(null)
  const editable = permitido("gestionar_niveles")
  const ordenados = nivelesOrdenados(niveles)

  const conteo = useMemo(() => {
    const map = new Map<string, number>()
    embajadores
      .filter((e) => e.estado === "activo")
      .forEach((e) => {
        const n = nivelDe(e, niveles)
        if (n) map.set(n.id, (map.get(n.id) ?? 0) + 1)
      })
    return map
  }, [embajadores, movimientos, niveles])

  return (
    <>
      <EncabezadoPagina
        titulo="Niveles"
        descripcion="Todos inician como Explorador. El nivel de cada embajador se cambia manualmente desde su ficha; los puntos mínimos son una referencia."
        acciones={
          editable && (
            <NivelDialog
              trigger={
                <Button className="h-10 rounded-xl glow-primary">
                  <Plus className="size-4" aria-hidden />
                  Nuevo nivel
                </Button>
              }
            />
          )
        }
      />

      {ordenados.length === 0 ? (
        <Panel>
          <EstadoVacio icon={Layers} titulo="Sin niveles" descripcion="Crea niveles para reconocer el progreso de tus embajadores." />
        </Panel>
      ) : (
        <ol className="flex flex-col gap-4">
          {ordenados.map((n, i) => {
            const siguiente = ordenados[i + 1]
            return (
              <li key={n.id}>
                <Panel className="flex flex-wrap items-center gap-4">
                  <IconoNivelBox nivel={n} size="lg" />
                  <div className="min-w-48 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{n.nombre}</h2>
                      <Chip>{conteo.get(n.id) ?? 0} embajadores</Chip>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatearNumero(n.puntosMinimos)}
                      {siguiente ? ` – ${formatearNumero(siguiente.puntosMinimos - 1)}` : "+"} puntos
                    </p>
                    {n.beneficios.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {n.beneficios.map((b) => (
                          <li
                            key={b}
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{ backgroundColor: `color-mix(in oklab, ${n.color} 12%, transparent)`, color: `color-mix(in oklab, ${n.color} 80%, var(--foreground))` }}
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {editable && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="Subir" disabled={i === 0} onClick={() => acciones.moverNivel(n.id, -1)}>
                        <ArrowUp className="size-4" aria-hidden />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Bajar" disabled={i === ordenados.length - 1} onClick={() => acciones.moverNivel(n.id, 1)}>
                        <ArrowDown className="size-4" aria-hidden />
                      </Button>
                      <NivelDialog
                        nivel={n}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${n.nombre}`}>
                            <Pencil className="size-4" aria-hidden />
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${n.nombre}`} onClick={() => setEliminar(n)}>
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </Panel>
              </li>
            )
          })}
        </ol>
      )}

      <ConfirmarDialog
        abierto={!!eliminar}
        onAbiertoChange={(v) => !v && setEliminar(null)}
        titulo={`¿Eliminar el nivel “${eliminar?.nombre}”?`}
        descripcion="Los embajadores de este nivel pasarán al nivel inferior correspondiente."
        textoConfirmar="Eliminar"
        destructivo
        onConfirmar={() => {
          if (eliminar) acciones.eliminarNivel(eliminar.id)
          toast.success("Nivel eliminado")
          setEliminar(null)
        }}
      />
    </>
  )
}

function NivelDialog({ trigger, nivel }: { trigger: React.ReactElement; nivel?: Nivel }) {
  const { niveles, acciones } = useDatos()
  const [open, setOpen] = useState(false)
  const inicial = () => ({
    nombre: nivel?.nombre ?? "",
    puntos: String(nivel?.puntosMinimos ?? 0),
    color: nivel?.color ?? COLORES[0],
    icono: (nivel?.icono ?? "star") as IconoNivel,
    beneficios: nivel?.beneficios.join("\n") ?? "",
  })
  const [f, setF] = useState(inicial)
  const puntos = Number(f.puntos)
  const choca = niveles.some((n) => n.id !== nivel?.id && n.puntosMinimos === puntos)
  const valido = f.nombre.trim().length >= 2 && Number.isInteger(puntos) && puntos >= 0 && !choca

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
            acciones.guardarNivel({
              id: nivel?.id,
              orden: nivel?.orden,
              nombre: f.nombre.trim(),
              puntosMinimos: puntos,
              color: f.color,
              icono: f.icono,
              beneficios: f.beneficios.split("\n").map((b) => b.trim()).filter(Boolean),
            })
            toast.success(nivel ? "Nivel actualizado" : "Nivel creado")
            setOpen(false)
          }}
        >
          <DialogHeader>
            <DialogTitle>{nivel ? "Editar nivel" : "Nuevo nivel"}</DialogTitle>
            <DialogDescription>Elige un nombre, el umbral de puntos y su identidad visual.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <IconoNivelBox nivel={f} size="lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="niv-nombre">Nombre</Label>
              <Input id="niv-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className="rounded-xl" required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="niv-puntos">Puntos mínimos</Label>
            <Input id="niv-puntos" type="number" min={0} value={f.puntos} onChange={(e) => setF({ ...f, puntos: e.target.value })} className="rounded-xl" aria-invalid={choca} />
            {choca && <p className="text-xs text-destructive">Ya existe un nivel con ese umbral.</p>}
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Color</legend>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={f.color === c}
                  onClick={() => setF({ ...f, color: c })}
                  className={cn("size-8 rounded-full ring-offset-2 ring-offset-card transition", f.color === c && "ring-2 ring-foreground")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Ícono</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ICONOS_NIVEL) as IconoNivel[]).map((k) => {
                const I = ICONOS_NIVEL[k]
                return (
                  <button
                    key={k}
                    type="button"
                    aria-label={k}
                    aria-pressed={f.icono === k}
                    onClick={() => setF({ ...f, icono: k })}
                    className={cn("inline-flex size-9 items-center justify-center rounded-xl border transition", f.icono === k ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
                  >
                    <I className="size-4" aria-hidden />
                  </button>
                )
              })}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <Label htmlFor="niv-ben">Beneficios (uno por línea)</Label>
            <Textarea id="niv-ben" rows={3} value={f.beneficios} onChange={(e) => setF({ ...f, beneficios: e.target.value })} className="rounded-xl" />
          </div>
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
