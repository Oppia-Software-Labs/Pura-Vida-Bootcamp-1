"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Check, ChevronDown, Menu, Moon, Search, Sun, Users } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarContenido } from "@/components/layout/sidebar"
import { AvatarIniciales, Chip } from "@/components/shared/ui-bits"
import { Bandera } from "@/components/shared/bandera"
import { useApp } from "@/lib/store"
import { normalizarTexto } from "@/lib/format"
import { cn } from "@/lib/utils"

const ETIQUETA_ROL = { super_admin: "Super admin", admin: "Admin" } as const

function BuscadorGlobal() {
  const { estado } = useApp()
  const router = useRouter()
  const [q, setQ] = useState("")
  const [abierto, setAbierto] = useState(false)

  const resultados = useMemo(() => {
    const t = normalizarTexto(q)
    if (!t || !estado) return []
    return estado.embajadores
      .filter((e) => normalizarTexto(e.nombre).includes(t) || (e.telegram && normalizarTexto(e.telegram).includes(t.replace("@", ""))))
      .slice(0, 6)
  }, [q, estado])

  const ir = (id: string) => {
    setQ("")
    setAbierto(false)
    router.push(`/embajadores/${id}`)
  }

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor="buscador-global" className="sr-only">
        Buscar embajadores
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id="buscador-global"
        type="search"
        value={q}
        placeholder="Buscar embajador o @telegram…"
        autoComplete="off"
        onChange={(e) => {
          setQ(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAbierto(false)
          if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229 && resultados[0]) ir(resultados[0].id)
        }}
        className="neu-inset h-10 w-full rounded-2xl bg-muted/60 pr-3 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {abierto && q && (
        <div className="absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-xl">
          {resultados.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Sin resultados para “{q}”</p>
          ) : (
            <ul>
              {resultados.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => ir(e.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-accent"
                  >
                    <AvatarIniciales nombre={e.nombre} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.nombre}</span>
                      {e.telegram && <span className="block truncate text-xs text-muted-foreground">@{e.telegram}</span>}
                    </span>
                    <Bandera pais={e.pais} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { estado, acciones } = useApp()
  const { resolvedTheme, setTheme } = useTheme()
  const [menuMovil, setMenuMovil] = useState(false)
  const admin = estado?.admins.find((a) => a.id === estado.adminActualId)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        className="neu-sm inline-flex size-10 items-center justify-center rounded-xl lg:hidden"
        onClick={() => setMenuMovil(true)}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>
      <Sheet open={menuMovil} onOpenChange={setMenuMovil}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarContenido onNavegar={() => setMenuMovil(false)} />
        </SheetContent>
      </Sheet>

      <BuscadorGlobal />

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="neu-sm hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium md:inline-flex">
            <Users className="size-4 text-primary" aria-hidden />
            <span className="max-w-40 truncate">{estado?.comunidad.nombre ?? "Comunidad"}</span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Comunidades</DropdownMenuLabel>
              <DropdownMenuItem>
                <Check className="size-4 text-primary" aria-hidden />
                {estado?.comunidad.nombre}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Más comunidades próximamente</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="neu-sm inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Cambiar tema claro u oscuro"
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="neu-sm inline-flex h-10 items-center gap-2 rounded-xl pr-2 pl-1.5 text-left">
            <AvatarIniciales nombre={admin?.nombre ?? "?"} className="size-7" />
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-32 truncate text-sm leading-tight font-medium">{admin?.nombre ?? "…"}</span>
              <span className="block text-[11px] leading-tight text-muted-foreground">{admin ? ETIQUETA_ROL[admin.rol] : ""}</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Cambiar de usuario (demo de roles)</DropdownMenuLabel>
              {estado?.admins.map((a) => (
                <DropdownMenuItem key={a.id} onClick={() => acciones.cambiarAdminActual(a.id)} className="gap-2">
                  <Check className={cn("size-4 text-primary", a.id !== estado.adminActualId && "invisible")} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{a.nombre}</span>
                  <Chip tono={a.rol === "super_admin" ? "primary" : "muted"} className="px-2 py-0.5 text-[10px]">
                    {ETIQUETA_ROL[a.rol]}
                  </Chip>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
