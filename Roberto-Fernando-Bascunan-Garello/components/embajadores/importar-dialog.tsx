"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, FileUp, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { paisDesdeTexto } from "@/lib/data/paises"
import { nombresParecidos } from "@/lib/data/calculos"
import { useDatos } from "@/lib/store"
import { hoyISO, normalizarTexto } from "@/lib/format"
import { WALLET_REGEX } from "@/components/embajadores/embajador-form-dialog"
import type { Embajador } from "@/lib/types"

const EJEMPLO = `nombre,pais,cumpleanos,telegram,wallet
Lucía Fernández,Perú,14/03,@luciaf,
Diego Ramírez,MX,02/11,diegor,`

interface FilaImportada {
  linea: number
  datos: Omit<Embajador, "id" | "nivelId"> | null
  errores: string[]
}

function parsear(texto: string, existentes: Embajador[]): FilaImportada[] {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim())
  if (!lineas.length) return []
  const sep = lineas[0].includes(";") ? ";" : ","
  const tieneEncabezado = /nombre/i.test(lineas[0])
  const cuerpo = tieneEncabezado ? lineas.slice(1) : lineas
  const vistos: string[] = []
  return cuerpo.map((l, i) => {
    const [nombre = "", pais = "", cumple = "", telegram = "", wallet = ""] = l.split(sep).map((c) => c.trim())
    const errores: string[] = []
    const codigo = paisDesdeTexto(pais)
    const [d, m] = cumple.split(/[/-]/).map(Number)
    if (nombre.length < 3) errores.push("Nombre inválido")
    if (!codigo) errores.push(`País no reconocido “${pais}”`)
    if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12)) errores.push("Cumpleaños debe ser dd/mm")
    if (wallet && !WALLET_REGEX.test(wallet)) errores.push("Wallet inválida")
    if (existentes.some((e) => nombresParecidos(e.nombre, nombre, normalizarTexto) === "duplicado") || vistos.includes(normalizarTexto(nombre)))
      errores.push("Duplicado")
    vistos.push(normalizarTexto(nombre))
    return {
      linea: i + (tieneEncabezado ? 2 : 1),
      errores,
      datos: errores.length
        ? null
        : {
            nombre,
            pais: codigo!,
            cumpleDia: d,
            cumpleMes: m,
            telegram: telegram.replace(/^@/, "") || null,
            wallet: wallet || null,
            fechaIngreso: hoyISO(),
            estado: "activo",
          },
    }
  })
}

export function ImportarDialog({ trigger }: { trigger: React.ReactElement }) {
  const { embajadores, acciones } = useDatos()
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState("")
  const filas = useMemo(() => parsear(texto, embajadores), [texto, embajadores])
  const validas = filas.filter((f) => f.datos)

  const leerArchivo = async (file: File | undefined) => {
    if (!file) return
    setTexto(await file.text())
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setTexto("")
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar embajadores</DialogTitle>
          <DialogDescription>Sube un CSV o pega las filas. Columnas: nombre, país, cumpleaños (dd/mm), telegram, wallet.</DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 p-5 text-center text-sm text-muted-foreground transition-colors hover:border-primary/60">
          <FileUp className="size-6 text-primary" aria-hidden />
          <span>
            <span className="font-medium text-primary">Elegir archivo CSV</span> o arrástralo aquí
          </span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => leerArchivo(e.target.files?.[0])} />
        </label>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="imp-texto">Contenido</Label>
            <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setTexto(EJEMPLO)}>
              Cargar ejemplo
            </button>
          </div>
          <Textarea id="imp-texto" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} className="rounded-xl font-mono text-xs" placeholder={EJEMPLO} />
        </div>

        {filas.length > 0 && (
          <div className="neu-inset max-h-52 overflow-y-auto rounded-2xl bg-muted/40 p-2">
            <p className="px-2 pb-2 text-xs text-muted-foreground">
              {validas.length} válidas · {filas.length - validas.length} con errores
            </p>
            <ul className="flex flex-col gap-1">
              {filas.map((f) => (
                <li key={f.linea} className="flex items-start gap-2 rounded-xl bg-card px-3 py-2 text-sm">
                  {f.datos ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Válida" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Con errores" />}
                  <span className="text-xs text-muted-foreground">L{f.linea}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{f.datos?.nombre ?? "—"}</span>
                    {f.errores.length > 0 && <span className="block text-xs text-destructive">{f.errores.join(" · ")}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!validas.length}
            onClick={() => {
              acciones.importarEmbajadores(validas.map((f) => f.datos!))
              toast.success(`${validas.length} embajadores importados`)
              setOpen(false)
            }}
          >
            Importar {validas.length || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
