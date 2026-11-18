import type { CodigoPais } from "@/lib/types"

export const PAISES: Record<CodigoPais, { nombre: string; iso: string }> = {
  MX: { nombre: "México", iso: "mx" },
  CO: { nombre: "Colombia", iso: "co" },
  CR: { nombre: "Costa Rica", iso: "cr" },
  BO: { nombre: "Bolivia", iso: "bo" },
  AR: { nombre: "Argentina", iso: "ar" },
  PE: { nombre: "Perú", iso: "pe" },
  EC: { nombre: "Ecuador", iso: "ec" },
  XX: { nombre: "Sin país", iso: "" },
}

export const CODIGOS_PAIS = Object.keys(PAISES) as CodigoPais[]

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

export function paisDesdeTexto(texto: string): CodigoPais | null {
  const t = normalizar(texto)
  if (!t) return null
  const upper = texto.trim().toUpperCase()
  if ((CODIGOS_PAIS as string[]).includes(upper)) return upper as CodigoPais
  const encontrado = CODIGOS_PAIS.find((c) => normalizar(PAISES[c].nombre) === t)
  return encontrado ?? null
}
