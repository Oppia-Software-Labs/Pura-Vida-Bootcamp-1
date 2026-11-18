"use client"

import { ArrowUpRight, Loader2, RotateCw } from "lucide-react"
import { toast } from "sonner"
import type { EstadoBlockchain } from "@/lib/types"
import { abreviarHash, urlTransaccion } from "@/lib/stellar"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

interface Props {
  txHash: string | null
  estado: EstadoBlockchain
  movimientoId?: string
  onReintentar?: () => void
  className?: string
}

export function StellarChip({ txHash, estado, movimientoId, onReintentar, className }: Props) {
  const { acciones } = useApp()

  if (estado === "pendiente") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground", className)}>
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Registrando…
      </span>
    )
  }

  if (estado === "historico") {
    return (
      <span
        title="Movimiento importado antes de conectar Stellar Testnet"
        className={cn("inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground", className)}
      >
        Histórico
      </span>
    )
  }

  if (estado === "error" || !txHash) {
    const reintentar = async () => {
      if (onReintentar) return onReintentar()
      if (!movimientoId) return
      const r = await acciones.registrarEnStellar([movimientoId])
      if (r.fallidos) toast.error("No se pudo registrar en Stellar. Intenta de nuevo.")
      else toast.success("Movimiento confirmado en Stellar Testnet")
    }
    return (
      <button
        type="button"
        onClick={reintentar}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15",
          className,
        )}
      >
        <RotateCw className="size-3.5" aria-hidden />
        Reintentar
      </button>
    )
  }

  return (
    <a
      href={urlTransaccion(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      title={txHash}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-primary transition-colors hover:bg-primary/15",
        className,
      )}
    >
      <span className="font-mono">{abreviarHash(txHash)}</span>
      <span className="text-primary/80">Ver en Stellar</span>
      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden />
      <span className="sr-only">(abre en una pestaña nueva)</span>
    </a>
  )
}
