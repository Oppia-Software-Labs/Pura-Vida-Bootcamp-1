"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SimpleSelect } from "@/components/shared/simple-select"
import { Bandera } from "@/components/shared/bandera"
import { useDatos } from "@/lib/store"
import { hoyISO, normalizarTexto } from "@/lib/format"

interface Props {
  trigger?: React.ReactElement
  embajadorIdsIniciales?: string[]
  abierto?: boolean
  onAbiertoChange?: (v: boolean) => void
}

export function SumarPuntosDialog({ trigger, embajadorIdsIniciales = [], abierto, onAbiertoChange }: Props) {
  const { embajadores, actividades, acciones } = useDatos()
  const [abiertoInterno, setAbiertoInterno] = useState(false)
  const open = abierto ?? abiertoInterno
  const setOpen = (v: boolean) => {
    if (v) {
      setSeleccion(embajadorIdsIniciales)
      setBusqueda("")
      setNota("")
      setFecha(hoyISO())
    }
    onAbiertoChange ? onAbiertoChange(v) : setAbiertoInterno(v)
  }

  const activas = actividades.filter((a) => a.activa)
  const [seleccion, setSeleccion] = useState<string[]>(embajadorIdsIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [actividadId, setActividadId] = useState(activas[0]?.id ?? "")
  const actividad = actividades.find((a) => a.id === actividadId)
  const [puntos, setPuntos] = useState(String(activas[0]?.puntosDefecto ?? 0))
  const [fecha, setFecha] = useState(hoyISO())
  const [nota, setNota] = useState("")

  const visibles = useMemo(() => {
    const t = normalizarTexto(busqueda)
    return embajadores.filter((e) => e.estado === "activo" && (!t || normalizarTexto(e.nombre).includes(t)))
  }, [embajadores, busqueda])

  const puntosNum = Number(puntos)
  const valido = seleccion.length > 0 && actividad && Number.isInteger(puntosNum) && puntosNum > 0 && fecha <= hoyISO()

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!valido) return
    const ids = acciones.crearMovimientos({ embajadorIds: seleccion, actividadId, puntos: puntosNum, fecha, nota: nota.trim() })
    setOpen(false)
    const t = toast.loading(`Registrando ${ids.length} movimiento${ids.length === 1 ? "" : "s"} en Stellar…`)
    const r = await acciones.registrarEnStellar(ids)
    if (r.fallidos) toast.error(`${r.fallidos} de ${r.total} no se pudieron registrar. Puedes reintentar desde el registro.`, { id: t })
    else toast.success(`${puntosNum * ids.length} StellarPoints emitidos a ${ids.length} embajador${ids.length === 1 ? "" : "es"}`, { id: t })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Sumar puntos</DialogTitle>
            <DialogDescription>Cada embajador seleccionado recibe los puntos como StellarPoints en Stellar Testnet.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Embajadores</Label>
              <span className="text-xs text-muted-foreground">{seleccion.length} seleccionados</span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Filtrar por nombre" className="rounded-xl pl-9" aria-label="Filtrar embajadores" />
            </div>
            <ul className="neu-inset max-h-44 overflow-y-auto rounded-2xl bg-muted/40 p-1.5">
              {visibles.map((e) => {
                const marcado = seleccion.includes(e.id)
                return (
                  <li key={e.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1.5 text-sm hover:bg-card">
                      <Checkbox
                        checked={marcado}
                        onCheckedChange={(v) => setSeleccion((s) => (v ? [...s, e.id] : s.filter((x) => x !== e.id)))}
                      />
                      <span className="flex-1 truncate">{e.nombre}</span>
                      <Bandera pais={e.pais} />
                    </label>
                  </li>
                )
              })}
              {visibles.length === 0 && <li className="px-3 py-3 text-center text-sm text-muted-foreground">Sin coincidencias</li>}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="sp-actividad">Actividad</Label>
              <SimpleSelect
                id="sp-actividad"
                value={actividadId}
                onChange={(v) => {
                  setActividadId(v)
                  setPuntos(String(actividades.find((a) => a.id === v)?.puntosDefecto ?? 0))
                }}
                opciones={activas.map((a) => ({ value: a.id, label: `${a.nombre} · ${a.puntosDefecto} pts${a.puntosVariables ? " (variable)" : ""}` }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sp-puntos">Puntos por embajador</Label>
              <Input
                id="sp-puntos"
                type="number"
                min={1}
                step={1}
                value={puntos}
                onChange={(e) => setPuntos(e.target.value)}
                readOnly={!actividad?.puntosVariables}
                className="rounded-xl read-only:bg-muted"
              />
              {!actividad?.puntosVariables && <p className="text-xs text-muted-foreground">Valor fijo según la regla</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sp-fecha">Fecha</Label>
              <Input id="sp-fecha" type="date" max={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sp-nota">Nota (opcional)</Label>
            <Textarea id="sp-nota" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: Taller en Universidad de Lima" className="rounded-xl" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido} className="glow-primary">
              Sumar {valido ? puntosNum * seleccion.length : ""} StellarPoints
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
