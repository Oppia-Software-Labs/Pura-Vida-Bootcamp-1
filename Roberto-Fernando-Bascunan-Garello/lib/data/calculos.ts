import type { Embajador, Movimiento, Nivel, Periodo, RolAdmin } from "@/lib/types"
import { parseFecha } from "@/lib/format"

export function movimientoEnPeriodo(mov: Movimiento, periodo: Periodo) {
  if (periodo.tipo === "total") return true
  const { anio, mes } = parseFecha(mov.fecha)
  if (periodo.tipo === "anio") return anio === periodo.anio
  return anio === periodo.anio && mes === periodo.mes
}

/** Los puntos nunca se guardan como total: siempre se suman desde los movimientos. */
export function puntosPorEmbajador(movimientos: Movimiento[], periodo: Periodo = { tipo: "total" }) {
  const mapa = new Map<string, number>()
  for (const mov of movimientos) {
    if (!movimientoEnPeriodo(mov, periodo)) continue
    mapa.set(mov.embajadorId, (mapa.get(mov.embajadorId) ?? 0) + mov.puntos)
  }
  return mapa
}

export function puntosTotales(movimientos: Movimiento[], periodo: Periodo = { tipo: "total" }) {
  return movimientos.reduce((s, m) => (movimientoEnPeriodo(m, periodo) ? s + m.puntos : s), 0)
}

export function nivelesOrdenados(niveles: Nivel[]) {
  return [...niveles].sort((a, b) => a.puntosMinimos - b.puntosMinimos || a.orden - b.orden)
}

export function nivelInicial(niveles: Nivel[]): Nivel | null {
  return nivelesOrdenados(niveles)[0] ?? null
}

/** El nivel se asigna manualmente; si el nivel asignado ya no existe se usa el inicial. */
export function nivelDe(embajador: Pick<Embajador, "nivelId">, niveles: Nivel[]): Nivel | null {
  return niveles.find((n) => n.id === embajador.nivelId) ?? nivelInicial(niveles)
}

export function progresoNivel(puntos: number, embajador: Pick<Embajador, "nivelId">, niveles: Nivel[]) {
  const orden = nivelesOrdenados(niveles)
  const actual = nivelDe(embajador, niveles)
  const idx = actual ? orden.findIndex((n) => n.id === actual.id) : -1
  const siguiente = orden[idx + 1] ?? null
  if (!actual || !siguiente) return { actual, siguiente: null, porcentaje: 100, faltan: 0 }
  const rango = siguiente.puntosMinimos - actual.puntosMinimos
  const avance = puntos - actual.puntosMinimos
  return {
    actual,
    siguiente,
    porcentaje: Math.min(100, Math.max(0, Math.round((avance / rango) * 100))),
    faltan: Math.max(0, siguiente.puntosMinimos - puntos),
  }
}

export interface FilaRanking {
  posicion: number
  embajador: Embajador
  puntos: number
  nivel: Nivel | null
}

export function ranking(
  embajadores: Embajador[],
  movimientos: Movimiento[],
  niveles: Nivel[],
  periodo: Periodo,
  limite = 10,
): FilaRanking[] {
  const delPeriodo = puntosPorEmbajador(movimientos, periodo)
  return embajadores
    .filter((e) => e.estado === "activo")
    .map((embajador) => ({ embajador, puntos: delPeriodo.get(embajador.id) ?? 0 }))
    .filter((f) => f.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos || a.embajador.nombre.localeCompare(b.embajador.nombre))
    .slice(0, limite)
    .map((f, i) => ({ ...f, posicion: i + 1, nivel: nivelDe(f.embajador, niveles) }))
}

export function mesesDisponibles(movimientos: Movimiento[], hoy = new Date()) {
  const anio = hoy.getFullYear()
  const mesActual = hoy.getMonth() + 1
  const meses: { anio: number; mes: number }[] = []
  for (let m = 1; m <= mesActual; m++) meses.push({ anio, mes: m })
  void movimientos
  return meses
}

export type Permiso =
  | "cargar_puntos"
  | "gestionar_embajadores"
  | "gestionar_reglas"
  | "gestionar_niveles"
  | "gestionar_premios"
  | "gestionar_admins"
  | "configurar"
  | "revertir_movimientos"

const PERMISOS_ADMIN: Permiso[] = ["cargar_puntos"]

export function puede(rol: RolAdmin, permiso: Permiso) {
  if (rol === "super_admin") return true
  return PERMISOS_ADMIN.includes(permiso)
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

export function nombresParecidos(a: string, b: string, normalizar: (s: string) => string) {
  const na = normalizar(a)
  const nb = normalizar(b)
  if (na === nb) return "duplicado" as const
  const pa = na.split(" ").slice(0, 2).join(" ")
  const pb = nb.split(" ").slice(0, 2).join(" ")
  if (pa === pb || levenshtein(na, nb) <= 2) return "parecido" as const
  return null
}
