"use server"

import { eq } from "drizzle-orm"
import { BASE_FEE, Horizon, Keypair, Memo, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk"
import { db } from "@/lib/db"
import * as t from "@/lib/db/schema"
import type { ResultadoStellar } from "@/lib/stellar"

const HORIZON_URL = "https://horizon-testnet.stellar.org"
const MAX_POR_LLAMADA = 50
const horizon = new Horizon.Server(HORIZON_URL)

let keypairCache: Keypair | null = null

async function obtenerKeypair(): Promise<Keypair> {
  if (keypairCache) return keypairCache
  const secretoEnv = process.env.STELLAR_SECRET_KEY
  if (secretoEnv) {
    keypairCache = Keypair.fromSecret(secretoEnv)
    return keypairCache
  }
  const [fila] = await db.select().from(t.configStellar).where(eq(t.configStellar.id, "registro")).limit(1)
  if (fila) {
    keypairCache = Keypair.fromSecret(fila.claveSecreta)
    return keypairCache
  }
  const nuevo = Keypair.random()
  const res = await fetch(`https://friendbot.stellar.org/?addr=${nuevo.publicKey()}`)
  if (!res.ok) throw new Error("Friendbot no pudo fondear la cuenta de testnet")
  await db.insert(t.configStellar).values({ id: "registro", clavePublica: nuevo.publicKey(), claveSecreta: nuevo.secret() })
  await db
    .insert(t.cuentasStellar)
    .values({ tipo: "registro", clavePublica: nuevo.publicKey(), balanceXLM: 10000, balanceUPT: 0 })
    .onConflictDoUpdate({ target: t.cuentasStellar.tipo, set: { clavePublica: nuevo.publicKey() } })
  keypairCache = nuevo
  return nuevo
}

function recortarBytes(texto: string, max: number) {
  let s = texto
  while (Buffer.byteLength(s, "utf8") > max) s = s.slice(0, -1)
  return s
}

function describirError(e: unknown): string {
  const codigos = (e as { response?: { data?: { extras?: { result_codes?: unknown } } } })?.response?.data?.extras?.result_codes
  if (codigos) return `Horizon: ${JSON.stringify(codigos)}`
  return e instanceof Error ? e.message : "Error desconocido al enviar a Stellar"
}

/** Registra un evento en Stellar Testnet sin mover fondos: memo + manageData en la cuenta de la comunidad. */
async function registrarEvento(memo: string, clave: string, valor: string): Promise<ResultadoStellar> {
  const kp = await obtenerKeypair()
  let ultimoError = ""
  for (let intento = 0; intento < 3; intento++) {
    try {
      const cuenta = await horizon.loadAccount(kp.publicKey())
      const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.manageData({ name: recortarBytes(clave, 64), value: recortarBytes(valor, 64) }))
        .addMemo(Memo.text(recortarBytes(memo, 28)))
        .setTimeout(60)
        .build()
      tx.sign(kp)
      const res = await horizon.submitTransaction(tx)
      return { ok: true, txHash: res.hash }
    } catch (e) {
      ultimoError = describirError(e)
      if (!ultimoError.includes("tx_bad_seq") && !ultimoError.includes("timeout")) break
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
  return { ok: false, error: ultimoError }
}

async function actualizarBalance() {
  try {
    const kp = await obtenerKeypair()
    const cuenta = await horizon.loadAccount(kp.publicKey())
    const xlm = Number(cuenta.balances.find((b) => b.asset_type === "native")?.balance ?? 0)
    await db.update(t.cuentasStellar).set({ balanceXLM: xlm }).where(eq(t.cuentasStellar.tipo, "registro"))
  } catch {
    // El balance es informativo; un fallo aquí no invalida los registros.
  }
}

export interface MovimientoARegistrar {
  id: string
  embajadorId: string
  puntos: number
}

export async function registrarMovimientosStellar(
  movimientos: MovimientoARegistrar[],
): Promise<{ id: string; resultado: ResultadoStellar }[]> {
  const validos = movimientos
    .slice(0, MAX_POR_LLAMADA)
    .filter((m) => typeof m.id === "string" && typeof m.embajadorId === "string" && Number.isInteger(m.puntos))

  const salida: { id: string; resultado: ResultadoStellar }[] = []
  for (const m of validos) {
    const signo = m.puntos > 0 ? "+" : ""
    const resultado = await registrarEvento(`${signo}${m.puntos} StellarPoints`, "StellarPoints", `${m.id}|${m.embajadorId}|${signo}${m.puntos}`)
    if (resultado.ok) {
      await db.update(t.movimientos).set({ txHash: resultado.txHash, estadoBlockchain: "confirmado" }).where(eq(t.movimientos.id, m.id))
    }
    salida.push({ id: m.id, resultado })
  }
  await actualizarBalance()
  return salida
}

export async function registrarPremioStellar(premio: { id: string; monto: number; moneda: string }): Promise<ResultadoStellar> {
  if (typeof premio.id !== "string" || !Number.isFinite(premio.monto)) return { ok: false, error: "Premio inválido" }
  const resultado = await registrarEvento(`Premio ${premio.monto} ${premio.moneda}`, "Premio", `${premio.id}|${premio.monto} ${premio.moneda}`)
  await actualizarBalance()
  return resultado
}
