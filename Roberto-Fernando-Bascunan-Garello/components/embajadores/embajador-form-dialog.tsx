"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SimpleSelect } from "@/components/shared/simple-select"
import { Bandera } from "@/components/shared/bandera"
import { CODIGOS_PAIS, MESES } from "@/lib/data/paises"
import { nombresParecidos } from "@/lib/data/calculos"
import { useDatos } from "@/lib/store"
import { hoyISO, normalizarTexto } from "@/lib/format"
import type { CodigoPais, Embajador } from "@/lib/types"

export const WALLET_REGEX = /^G[A-Z2-7]{55}$/

export function EmbajadorFormDialog({ trigger, embajador }: { trigger: React.ReactElement; embajador?: Embajador }) {
  const { embajadores, acciones } = useDatos()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => valoresIniciales(embajador))

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const parecidos = form.nombre.trim().length > 3
    ? embajadores.filter((e) => e.id !== embajador?.id && nombresParecidos(e.nombre, form.nombre, normalizarTexto))
    : []
  const duplicado = embajadores.some((e) => e.id !== embajador?.id && nombresParecidos(e.nombre, form.nombre, normalizarTexto) === "duplicado")
  const walletInvalida = form.wallet.trim() !== "" && !WALLET_REGEX.test(form.wallet.trim())
  const dia = Number(form.cumpleDia)
  const valido = form.nombre.trim().length >= 3 && !duplicado && !walletInvalida && dia >= 1 && dia <= 31

  const guardar = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!valido) return
    acciones.guardarEmbajador({
      id: embajador?.id,
      nombre: form.nombre.trim(),
      pais: form.pais,
      cumpleDia: dia,
      cumpleMes: Number(form.cumpleMes),
      telegram: form.telegram.trim().replace(/^@/, "") || null,
      wallet: form.wallet.trim() || null,
      fechaIngreso: form.fechaIngreso,
      estado: embajador?.estado ?? "activo",
    })
    toast.success(embajador ? "Embajador actualizado" : "Embajador agregado")
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setForm(valoresIniciales(embajador))
        setOpen(v)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{embajador ? "Editar embajador" : "Nuevo embajador"}</DialogTitle>
            <DialogDescription>Los datos de contacto y la wallet de Stellar donde recibirá los StellarPoints.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ef-nombre">Nombre completo</Label>
            <Input id="ef-nombre" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} className="rounded-xl" required />
            {parecidos.length > 0 && (
              <p className={`flex items-start gap-1.5 text-xs ${duplicado ? "text-destructive" : "text-[color-mix(in_oklab,var(--brand-orange)_75%,var(--foreground))]"}`}>
                <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
                {duplicado ? "Ya existe un embajador con este nombre." : `Nombre parecido a: ${parecidos.map((p) => p.nombre).join(", ")}`}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ef-pais">País</Label>
              <SimpleSelect
                id="ef-pais"
                value={form.pais}
                onChange={(v) => set("pais", v as CodigoPais)}
                opciones={CODIGOS_PAIS.map((c) => ({ value: c, label: <Bandera pais={c} conNombre /> }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ef-ingreso">Fecha de ingreso</Label>
              <Input id="ef-ingreso" type="date" max={hoyISO()} value={form.fechaIngreso} onChange={(e) => set("fechaIngreso", e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ef-dia">Cumpleaños · día</Label>
              <Input id="ef-dia" type="number" min={1} max={31} value={form.cumpleDia} onChange={(e) => set("cumpleDia", e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ef-mes">Cumpleaños · mes</Label>
              <SimpleSelect id="ef-mes" value={form.cumpleMes} onChange={(v) => set("cumpleMes", v)} opciones={MESES.map((m, i) => ({ value: String(i + 1), label: m }))} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="ef-telegram">Usuario de Telegram</Label>
              <Input id="ef-telegram" value={form.telegram} onChange={(e) => set("telegram", e.target.value)} placeholder="@usuario" className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="ef-wallet">Wallet de Stellar</Label>
              <Input
                id="ef-wallet"
                value={form.wallet}
                onChange={(e) => set("wallet", e.target.value.toUpperCase())}
                placeholder="G…"
                aria-invalid={walletInvalida}
                className="rounded-xl font-mono text-xs"
              />
              {walletInvalida && <p className="text-xs text-destructive">Debe empezar con G y tener 56 caracteres.</p>}
            </div>
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

function valoresIniciales(e?: Embajador) {
  return {
    nombre: e?.nombre ?? "",
    pais: (e?.pais ?? "MX") as CodigoPais,
    cumpleDia: String(e?.cumpleDia ?? 1),
    cumpleMes: String(e?.cumpleMes ?? 1),
    telegram: e?.telegram ? `@${e.telegram}` : "",
    wallet: e?.wallet ?? "",
    fechaIngreso: e?.fechaIngreso ?? hoyISO(),
  }
}
