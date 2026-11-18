"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gift, History, ImagePlus, LayoutDashboard, Layers, ShieldCheck, Target, Users, Wallet, type LucideIcon } from "lucide-react"
import { useApp } from "@/lib/store"
import { STELLAR_RED } from "@/lib/stellar"
import { cn } from "@/lib/utils"

export const NAVEGACION: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/embajadores", label: "Embajadores", icon: Users },
  { href: "/registro", label: "Registro de puntos", icon: History },
  { href: "/reglas", label: "Reglas de puntos", icon: Target },
  { href: "/niveles", label: "Niveles", icon: Layers },
  { href: "/premios", label: "Premios", icon: Gift },
  { href: "/wallet", label: "Wallet Stellar", icon: Wallet },
  { href: "/administracion", label: "Administración", icon: ShieldCheck },
]

export function SidebarContenido({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname()
  const { estado } = useApp()
  const comunidad = estado?.comunidad

  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <div className="flex items-center gap-3">
        {comunidad?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comunidad.logo} alt={`Logo de ${comunidad.nombre}`} className="size-12 shrink-0 rounded-2xl object-contain neu-sm p-1" />
        ) : (
          <Link
            href="/administracion?seccion=configuracion"
            onClick={onNavegar}
            className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 text-primary/70 transition-colors hover:border-primary/60 hover:text-primary"
            title="Subir logo de la comunidad"
          >
            <ImagePlus className="size-4" aria-hidden />
            <span className="text-[9px] font-medium">Logo</span>
          </Link>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg leading-tight font-bold tracking-tight">{comunidad?.nombreApp ?? "Upteam"}</p>
          <p className="truncate text-xs text-muted-foreground">{comunidad?.nombre ?? "Cargando…"}</p>
        </div>
      </div>

      <nav aria-label="Módulos" className="flex flex-1 flex-col gap-1.5">
        {NAVEGACION.map((item) => {
          const activo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavegar}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                activo ? "neu-sm text-foreground" : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-xl transition-all",
                  activo ? "bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary)_70%,black)] text-primary-foreground glow-primary" : "text-current",
                )}
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="neu-sm flex items-center gap-3 rounded-2xl p-3">
        <span className="relative flex size-2.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
        <div className="min-w-0 text-xs">
          <p className="font-medium">{STELLAR_RED}</p>
          <p className="text-muted-foreground">Operativa · simulada</p>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <SidebarContenido />
    </aside>
  )
}
