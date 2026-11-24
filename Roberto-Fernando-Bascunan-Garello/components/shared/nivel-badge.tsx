import { Compass, Crown, Gem, Handshake, Rocket, Shield, Sparkles, Star, type LucideIcon } from "lucide-react"
import type { IconoNivel, Nivel } from "@/lib/types"
import { cn } from "@/lib/utils"

export const ICONOS_NIVEL: Record<IconoNivel, LucideIcon> = {
  compass: Compass,
  handshake: Handshake,
  sparkles: Sparkles,
  crown: Crown,
  star: Star,
  rocket: Rocket,
  shield: Shield,
  gem: Gem,
}

export function IconoNivelBox({ nivel, size = "md" }: { nivel: Pick<Nivel, "color" | "icono">; size?: "sm" | "md" | "lg" }) {
  const Icono = ICONOS_NIVEL[nivel.icono] ?? Star
  const dims = { sm: "size-7 rounded-lg", md: "size-10 rounded-xl", lg: "size-14 rounded-2xl" }[size]
  const icon = { sm: "size-3.5", md: "size-5", lg: "size-7" }[size]
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center text-white", dims)}
      style={{
        background: `linear-gradient(140deg, ${nivel.color}, color-mix(in oklab, ${nivel.color} 70%, black))`,
        boxShadow: `0 6px 16px color-mix(in oklab, ${nivel.color} 35%, transparent)`,
      }}
      aria-hidden
    >
      <Icono className={icon} />
    </span>
  )
}

export function NivelBadge({ nivel, className }: { nivel: Nivel | null; className?: string }) {
  if (!nivel) return <span className="text-muted-foreground">—</span>
  const Icono = ICONOS_NIVEL[nivel.icono] ?? Star
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", className)}
      style={{ backgroundColor: `color-mix(in oklab, ${nivel.color} 14%, transparent)`, color: `color-mix(in oklab, ${nivel.color} 80%, var(--foreground))` }}
    >
      <Icono className="size-3.5" aria-hidden />
      {nivel.nombre}
    </span>
  )
}
