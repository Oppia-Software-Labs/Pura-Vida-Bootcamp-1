"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { ArrowUpRight, Droplets, LogOut, RefreshCw, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BotonCopiar, Chip, EncabezadoPagina, IconBox, Panel } from "@/components/shared/ui-bits"
import { consultarCuenta, fondearConFriendbot, guardarWallet, leerWalletGuardada, obtenerKit } from "@/lib/wallet"

export function WalletView() {
  const [direccion, setDireccion] = useState<string | null>(null)
  const [conectando, setConectando] = useState(false)
  const [fondeando, setFondeando] = useState(false)

  useEffect(() => {
    setDireccion(leerWalletGuardada())
  }, [])

  const { data: cuenta, isLoading, mutate } = useSWR(direccion ? ["cuenta", direccion] : null, ([, d]) => consultarCuenta(d))

  const conectar = async () => {
    setConectando(true)
    try {
      const kit = await obtenerKit()
      const { address } = await kit.authModal()
      guardarWallet(address)
      setDireccion(address)
      toast.success("Wallet conectada")
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo conectar la wallet"
      if (!/closed|cancel/i.test(mensaje)) toast.error(mensaje)
    } finally {
      setConectando(false)
    }
  }

  const desconectar = async () => {
    try {
      const kit = await obtenerKit()
      await kit.disconnect()
    } catch {}
    guardarWallet(null)
    setDireccion(null)
    toast.success("Wallet desconectada")
  }

  const fondear = async () => {
    if (!direccion) return
    setFondeando(true)
    const t = toast.loading("Pidiendo XLM de prueba a Friendbot…")
    try {
      await fondearConFriendbot(direccion)
      await mutate()
      toast.success("Cuenta activada en testnet con 10.000 XLM de prueba", { id: t })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al fondear", { id: t })
    } finally {
      setFondeando(false)
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Wallet Stellar"
        descripcion="Conecta tu wallet de Stellar (Freighter, Varial, LOBSTR, xBull, Albedo…) para ver tu cuenta en Testnet."
      />

      <Panel className="flex flex-col gap-6">
        {!direccion ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <IconBox icon={Wallet} />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Ninguna wallet conectada</h2>
              <p className="max-w-md text-sm text-muted-foreground text-pretty">
                Elige tu wallet en la ventana de Stellar Wallets Kit. Solo leemos tu dirección pública; nunca pedimos tu frase secreta.
              </p>
            </div>
            <Button onClick={conectar} disabled={conectando} className="h-11 rounded-xl px-6 glow-primary">
              <Wallet className="size-4" aria-hidden />
              {conectando ? "Conectando…" : "Conectar wallet"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <IconBox icon={Wallet} tono="success" />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Wallet conectada</span>
                    <Chip tono="primary">Testnet</Chip>
                  </div>
                  <code className="break-all font-mono text-xs text-muted-foreground">{direccion}</code>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <BotonCopiar texto={direccion} etiqueta="Copiar dirección" className="h-9 rounded-xl px-3" />
                <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={desconectar}>
                  <LogOut className="size-4" aria-hidden />
                  Desconectar
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo XLM (testnet)</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {isLoading ? "…" : cuenta?.existe ? Number(cuenta.xlm).toLocaleString("es-CL", { maximumFractionDigits: 2 }) : "Sin activar"}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado de la cuenta</p>
                <p className="mt-1 text-2xl font-semibold">{isLoading ? "…" : cuenta?.existe ? "Activa" : "No existe en testnet"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {cuenta && !cuenta.existe && (
                <Button onClick={fondear} disabled={fondeando} className="h-10 rounded-xl">
                  <Droplets className="size-4" aria-hidden />
                  {fondeando ? "Activando…" : "Activar con Friendbot"}
                </Button>
              )}
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => mutate()}>
                <RefreshCw className="size-4" aria-hidden />
                Actualizar
              </Button>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${direccion}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl")}
              >
                Ver en Stellar Explorer
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
        )}
      </Panel>
    </>
  )
}
