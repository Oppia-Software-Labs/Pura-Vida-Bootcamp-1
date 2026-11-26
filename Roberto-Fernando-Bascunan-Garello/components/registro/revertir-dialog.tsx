"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmarDialog } from "@/components/shared/confirmar-dialog"
import { useDatos } from "@/lib/store"

export function RevertirDialog({ movimientoId, onCerrar }: { movimientoId: string | null; onCerrar: () => void }) {
  const { movimientos, embajadores, acciones } = useDatos()
  const [motivo, setMotivo] = useState("")
  const mov = movimientos.find((m) => m.id === movimientoId)
  const emb = embajadores.find((e) => e.id === mov?.embajadorId)

  return (
    <ConfirmarDialog
      abierto={!!mov}
      onAbiertoChange={(v) => {
        if (!v) {
          onCerrar()
          setMotivo("")
        }
      }}
      titulo="Revertir movimiento"
      descripcion={
        mov
          ? `Se registrará un movimiento compensatorio de ${-mov.puntos} StellarPoints para ${emb?.nombre}. La transacción original queda intacta en Stellar.`
          : undefined
      }
      textoConfirmar="Revertir"
      destructivo
      deshabilitado={motivo.trim().length < 4}
      onConfirmar={async () => {
        if (!mov) return
        const m = motivo.trim()
        setMotivo("")
        onCerrar()
        const t = toast.loading("Registrando reversión en Stellar…")
        const r = await acciones.revertirMovimiento(mov.id, m)
        if (r?.fallidos) toast.error("La reversión no se pudo registrar. Reintenta desde el registro.", { id: t })
        else toast.success("Movimiento revertido", { id: t })
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="rev-motivo">Motivo</Label>
        <Textarea id="rev-motivo" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: Puntos cargados por error" className="rounded-xl" />
      </div>
    </ConfirmarDialog>
  )
}
