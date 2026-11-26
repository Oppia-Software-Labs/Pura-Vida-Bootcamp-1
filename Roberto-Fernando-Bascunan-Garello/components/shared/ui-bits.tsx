"use client"

import { useState } from "react"
import { Check, Copy, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { iniciales } from "@/lib/format"

export function Panel({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className={cn("neu rounded-3xl p-5 sm:p-6", className)} {...props}>
      {children}
    </section>
  )
}

export function PanelHeader({
  titulo,
  descripcion,
  acciones,
  className,
}: {
  titulo: React.ReactNode
  descripcion?: React.ReactNode
  acciones?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  )
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string
  descripcion?: React.ReactNode
  acciones?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{titulo}</h1>
        {descripcion && <p className="mt-1.5 max-w-2xl text-sm text-pretty text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  )
}

export function IconBox({ icon: Icon, tono = "primary", className }: { icon: LucideIcon; tono?: "primary" | "pink" | "orange" | "success" | "muted"; className?: string }) {
  const estilos = {
    primary: "bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary)_70%,black)] text-primary-foreground glow-primary",
    pink: "bg-gradient-to-br from-brand-pink to-[color-mix(in_oklab,var(--brand-pink)_75%,black)] text-white glow-pink",
    orange: "bg-gradient-to-br from-brand-orange to-[color-mix(in_oklab,var(--brand-orange)_75%,black)] text-white",
    success: "bg-gradient-to-br from-success to-[color-mix(in_oklab,var(--success)_75%,black)] text-white",
    muted: "neu-sm text-primary",
  }[tono]
  return (
    <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-2xl", estilos, className)} aria-hidden>
      <Icon className="size-5" />
    </span>
  )
}

export function EstadoVacio({
  icon: Icon,
  titulo,
  descripcion,
  accion,
}: {
  icon: LucideIcon
  titulo: string
  descripcion?: string
  accion?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <span className="neu-sm inline-flex size-14 items-center justify-center rounded-2xl text-primary" aria-hidden>
        <Icon className="size-6" />
      </span>
      <div>
        <p className="font-medium">{titulo}</p>
        {descripcion && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}

export function AvatarIniciales({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary",
        className,
      )}
      aria-hidden
    >
      {iniciales(nombre)}
    </span>
  )
}

export function BotonCopiar({ texto, etiqueta, mensaje = "Copiado al portapapeles", className, children }: { texto: string; etiqueta: string; mensaje?: string; className?: string; children?: React.ReactNode }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
          setCopiado(true)
          toast.success(mensaje)
          setTimeout(() => setCopiado(false), 1500)
        } catch {
          toast.error("No se pudo copiar")
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {copiado ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {children}
    </button>
  )
}

export function Chip({ children, tono = "muted", className }: { children: React.ReactNode; tono?: "muted" | "primary" | "pink" | "orange" | "success" | "destructive"; className?: string }) {
  const estilos = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    pink: "bg-brand-pink/12 text-brand-pink",
    orange: "bg-brand-orange/15 text-[color-mix(in_oklab,var(--brand-orange)_70%,var(--foreground))]",
    success: "bg-success/12 text-success",
    destructive: "bg-destructive/10 text-destructive",
  }[tono]
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", estilos, className)}>{children}</span>
}

export function BarraProgreso({ valor, color, className, etiqueta }: { valor: number; color?: string; className?: string; etiqueta?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta}
      className={cn("neu-inset h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${valor}%`,
          background: `linear-gradient(90deg, color-mix(in oklab, ${color ?? "var(--primary)"} 55%, white), ${color ?? "var(--primary)"})`,
        }}
      />
    </div>
  )
}
