"use client"

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org"
const CLAVE_ALMACEN = "upteam:wallet"
export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015"

type Kit = typeof import("@creit.tech/stellar-wallets-kit/sdk").StellarWalletsKit

let kitPromise: Promise<Kit> | null = null

export function obtenerKit(): Promise<Kit> {
  if (!kitPromise) {
    kitPromise = Promise.all([
      import("@creit.tech/stellar-wallets-kit/sdk"),
      import("@creit.tech/stellar-wallets-kit/modules/utils"),
      import("@creit.tech/stellar-wallets-kit/types"),
    ]).then(([{ StellarWalletsKit }, { defaultModules }, { Networks }]) => {
      StellarWalletsKit.init({
        modules: defaultModules(),
        network: Networks.TESTNET,
        authModal: { showInstallLabel: true },
      })
      return StellarWalletsKit
    })
  }
  return kitPromise
}

export function leerWalletGuardada(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(CLAVE_ALMACEN)
}

export function guardarWallet(direccion: string | null) {
  if (direccion) window.localStorage.setItem(CLAVE_ALMACEN, direccion)
  else window.localStorage.removeItem(CLAVE_ALMACEN)
}

export type EstadoCuenta = { existe: false } | { existe: true; xlm: string; stellarPoints: string | null }

export async function consultarCuenta(direccion: string): Promise<EstadoCuenta> {
  const res = await fetch(`${HORIZON_TESTNET}/accounts/${direccion}`)
  if (res.status === 404) return { existe: false }
  if (!res.ok) throw new Error("No se pudo consultar Horizon testnet")
  const data: { balances: { asset_type: string; asset_code?: string; balance: string }[] } = await res.json()
  const xlm = data.balances.find((b) => b.asset_type === "native")?.balance ?? "0"
  const sp = data.balances.find((b) => b.asset_code === "StellarPoints" || b.asset_code === "SPOINTS")?.balance ?? null
  return { existe: true, xlm, stellarPoints: sp }
}

export async function fondearConFriendbot(direccion: string) {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(direccion)}`)
  if (!res.ok) throw new Error("Friendbot no pudo fondear la cuenta")
}
