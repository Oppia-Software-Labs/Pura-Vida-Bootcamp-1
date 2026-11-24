"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUpRight, Plus, ScrollText, Settings, ShieldCheck, Trash2, UserCog, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EncabezadoPagina, Panel, PanelHeader, AvatarIniciales, BotonCopiar, Chip, EstadoVacio, IconBox } from "@/components/shared/ui-bits"
import { SimpleSelect } from "@/components/shared/simple-select"
import { ConfirmarDialog } from "@/components/shared/confirmar-dialog"
import { useDatos } from "@/lib/store"
import { formatearFechaHora, formatearNumero } from "@/lib/format"
import { STELLAR_RED, STELLAR_TOKEN, abreviarHash, urlCuenta } from "@/lib/stellar"
import type { Admin, RolAdmin } from "@/lib/types"
import { cn } from "@/lib/utils"

const SECCIONES = [
  { id: "equipo", label: "Equipo", icon: UserCog },
  { id: "stellar", label: "Cuentas Stellar", icon: Wallet },
  { id: "bitacora", label: "Bitácora", icon: ScrollText },
  { id: "configuracion", label: "Configuración", icon: Settings },
] as const

type Seccion = (typeof SECCIONES)[number]["id"]

export function AdministracionView() {
  const params = useSearchParams()
  const router = useRouter()
  const actual = (SECCIONES.find((s) => s.id === params.get("seccion"))?.id ?? "equipo") as Seccion

  return (
    <>
      <EncabezadoPagina titulo="Administración" descripcion="Equipo, cuentas de Stellar, auditoría y ajustes de la comunidad." />
      <div role="tablist" aria-label="Secciones" className="neu-inset mb-5 inline-flex flex-wrap gap-1 rounded-2xl bg-muted/50 p-1.5">
        {SECCIONES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={actual === id}
            onClick={() => router.replace(`/administracion?seccion=${id}`, { scroll: false })}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
              actual === id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      {actual === "equipo" && <Equipo />}
      {actual === "stellar" && <CuentasStellar />}
      {actual === "bitacora" && <Bitacora />}
      {actual === "configuracion" && <Configuracion />}
    </>
  )
}

function Equipo() {
  const { admins, adminActual, acciones, permitido } = useDatos()
  const [quitar, setQuitar] = useState<Admin | null>(null)
  const editable = permitido("gestionar_admins")
  const superAdmins = admins.filter((a) => a.rol === "super_admin").length

  return (
    <Panel>
      <PanelHeader
        titulo="Equipo de administración"
        descripcion="Los super admins gestionan todo; los admins solo cargan puntos."
        acciones={
          editable && (
            <AdminDialog
              trigger={
                <Button size="sm" className="rounded-lg">
                  <Plus className="size-4" aria-hidden />
                  Invitar
                </Button>
              }
            />
          )
        }
      />
      <ul className="divide-y divide-dashed">
        {admins.map((a) => {
          const ultimoSuper = a.rol === "super_admin" && superAdmins === 1
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
              <AvatarIniciales nombre={a.nombre} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {a.nombre} {a.id === adminActual?.id && <span className="text-xs text-muted-foreground">(tú)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{a.email}</p>
              </div>
              {editable ? (
                <SimpleSelect
                  ariaLabel={`Rol de ${a.nombre}`}
                  className="w-36"
                  value={a.rol}
                  disabled={ultimoSuper}
                  onChange={(v) => {
                    acciones.guardarAdmin({ ...a, rol: v as RolAdmin })
                    toast.success("Rol actualizado")
                  }}
                  opciones={[
                    { value: "super_admin", label: "Super admin" },
                    { value: "admin", label: "Admin" },
                  ]}
                />
              ) : (
                <Chip tono={a.rol === "super_admin" ? "primary" : "muted"}>{a.rol === "super_admin" ? "Super admin" : "Admin"}</Chip>
              )}
              {editable && (
                <Button variant="ghost" size="icon-sm" aria-label={`Quitar a ${a.nombre}`} disabled={ultimoSuper || a.id === adminActual?.id} onClick={() => setQuitar(a)}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      <ConfirmarDialog
        abierto={!!quitar}
        onAbiertoChange={(v) => !v && setQuitar(null)}
        titulo={`¿Quitar a ${quitar?.nombre}?`}
        descripcion="Perderá el acceso al panel. Sus movimientos cargados se conservan."
        textoConfirmar="Quitar"
        destructivo
        onConfirmar={() => {
          if (quitar) acciones.eliminarAdmin(quitar.id)
          setQuitar(null)
          toast.success("Admin quitado")
        }}
      />
    </Panel>
  )
}

function AdminDialog({ trigger }: { trigger: React.ReactElement }) {
  const { admins, acciones } = useDatos()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ nombre: "", email: "", rol: "admin" as RolAdmin })
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)
  const existe = admins.some((a) => a.email.toLowerCase() === f.email.toLowerCase())
  const valido = f.nombre.trim().length >= 3 && emailValido && !existe

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setF({ nombre: "", email: "", rol: "admin" })
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
            acciones.guardarAdmin({ nombre: f.nombre.trim(), email: f.email.trim(), rol: f.rol })
            toast.success("Admin agregado")
            setOpen(false)
          }}
        >
          <DialogHeader>
            <DialogTitle>Invitar administrador</DialogTitle>
            <DialogDescription>Podrá acceder al panel con el rol que elijas.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adm-nombre">Nombre</Label>
            <Input id="adm-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adm-email">Email</Label>
            <Input id="adm-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="rounded-xl" aria-invalid={existe} />
            {existe && <p className="text-xs text-destructive">Ese email ya es admin.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adm-rol">Rol</Label>
            <SimpleSelect
              id="adm-rol"
              value={f.rol}
              onChange={(v) => setF({ ...f, rol: v as RolAdmin })}
              opciones={[
                { value: "admin", label: "Admin · solo carga puntos" },
                { value: "super_admin", label: "Super admin · acceso total" },
              ]}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido}>
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CuentasStellar() {
  const { cuentas, movimientos } = useDatos()
  const confirmados = movimientos.filter((m) => m.estadoBlockchain === "confirmado")
  const registrados = confirmados.length
  const emitidos = confirmados.reduce((s, m) => s + m.puntos, 0)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {cuentas.map((c) => (
        <Panel key={c.tipo}>
          <PanelHeader
            titulo="Cuenta de registro"
            descripcion={`Registra cada movimiento de ${STELLAR_TOKEN} en ${STELLAR_RED} sin enviar fondos`}
            acciones={<IconBox icon={Wallet} tono="primary" />}
          />
          <p className="neu-inset rounded-2xl bg-muted/40 p-3 font-mono text-xs break-all">{c.clavePublica}</p>
          <div className="mt-3 flex gap-2">
            <BotonCopiar texto={c.clavePublica} etiqueta="Copiar clave pública" mensaje="Clave copiada">
              Copiar
            </BotonCopiar>
            <Button variant="outline" size="sm" className="rounded-lg" render={<a href={urlCuenta(c.clavePublica)} target="_blank" rel="noreferrer" />} nativeButton={false}>
              Explorador
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">XLM</p>
              <p className="text-xl font-bold tabular-nums">{formatearNumero(c.balanceXLM, 2)}</p>
            </div>
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">Movimientos registrados</p>
              <p className="text-xl font-bold tabular-nums">{formatearNumero(registrados)}</p>
            </div>
          </div>
        </Panel>
      ))}
      <Panel className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-4">
          <IconBox icon={ShieldCheck} tono="success" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Red: {STELLAR_RED}</p>
            <p className="text-sm text-muted-foreground">
              {formatearNumero(emitidos)} {STELLAR_TOKEN} netos registrados on-chain como constancia (no se envían tokens). Las claves secretas nunca se muestran en el panel.
            </p>
          </div>
          <Chip tono="success">Conectado</Chip>
        </div>
      </Panel>
    </div>
  )
}

function Bitacora() {
  const { bitacora, admins } = useDatos()
  const [entidad, setEntidad] = useState("todas")
  const filas = bitacora.filter((b) => entidad === "todas" || b.entidad === entidad)

  return (
    <Panel>
      <PanelHeader
        titulo="Bitácora de auditoría"
        descripcion="Registro inmutable de cada acción realizada en el panel."
        acciones={
          <SimpleSelect
            ariaLabel="Tipo"
            className="w-40"
            value={entidad}
            onChange={setEntidad}
            opciones={[
              { value: "todas", label: "Todo" },
              { value: "movimiento", label: "Movimientos" },
              { value: "embajador", label: "Embajadores" },
              { value: "actividad", label: "Reglas" },
              { value: "nivel", label: "Niveles" },
              { value: "premio", label: "Premios" },
              { value: "admin", label: "Equipo" },
              { value: "comunidad", label: "Configuración" },
            ]}
          />
        }
      />
      {filas.length === 0 ? (
        <EstadoVacio icon={ScrollText} titulo="Sin registros" />
      ) : (
        <ol className="relative flex flex-col gap-4 border-l border-dashed pl-5">
          {filas.slice(0, 60).map((b) => (
            <li key={b.id} className="relative">
              <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary ring-4 ring-card" aria-hidden />
              <p className="text-sm">
                <strong className="font-semibold">{admins.find((a) => a.id === b.adminId)?.nombre ?? "Sistema"}</strong> {b.accion.toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                {b.detalle} · {formatearFechaHora(b.fecha)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

function Configuracion() {
  const { comunidad, acciones, permitido } = useDatos()
  const [f, setF] = useState({ nombre: comunidad.nombre, nombreApp: comunidad.nombreApp })
  const editable = permitido("configurar")
  const cambiado = f.nombre !== comunidad.nombre || f.nombreApp !== comunidad.nombreApp

  return (
    <Panel className="max-w-2xl">
      <PanelHeader titulo="Configuración de la comunidad" descripcion="Personaliza cómo se muestra el programa." />
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!f.nombre.trim() || !f.nombreApp.trim()) return
          acciones.actualizarComunidad({ nombre: f.nombre.trim(), nombreApp: f.nombreApp.trim() })
          toast.success("Configuración guardada")
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="cfg-nombre">Nombre de la comunidad</Label>
          <Input id="cfg-nombre" value={f.nombre} disabled={!editable} onChange={(e) => setF({ ...f, nombre: e.target.value })} className="rounded-xl" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cfg-app">Nombre del programa</Label>
          <Input id="cfg-app" value={f.nombreApp} disabled={!editable} onChange={(e) => setF({ ...f, nombreApp: e.target.value })} className="rounded-xl" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3 text-sm">
          <span className="size-6 rounded-lg" style={{ backgroundColor: comunidad.colorPrimario }} aria-hidden />
          Color principal <span className="font-mono text-xs text-muted-foreground">{comunidad.colorPrimario}</span>
          <span className="ml-auto text-xs text-muted-foreground">Token: {STELLAR_TOKEN}</span>
        </div>
        {editable && (
          <div className="flex justify-end">
            <Button type="submit" disabled={!cambiado}>
              Guardar cambios
            </Button>
          </div>
        )}
      </form>
      <p className="mt-4 text-xs text-muted-foreground">ID de comunidad: <span className="font-mono">{abreviarHash(comunidad.id, 6, 4)}</span></p>
    </Panel>
  )
}
