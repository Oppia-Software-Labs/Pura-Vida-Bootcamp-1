import { MESES, MESES_CORTOS } from "@/lib/data/paises"

export function aISOFecha(fecha: Date) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function hoyISO() {
  return aISOFecha(new Date())
}

export function parseFecha(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return { anio: y, mes: m, dia: d }
}

export function formatearFecha(iso: string) {
  const { anio, mes, dia } = parseFecha(iso)
  return `${dia} ${MESES_CORTOS[mes - 1]} ${anio}`
}

export function formatearFechaHora(iso: string) {
  const hora = iso.length > 10 ? iso.slice(11, 16) : ""
  return `${formatearFecha(iso)}${hora ? ` · ${hora}` : ""}`
}

export function nombreMes(mes: number, corto = false) {
  return corto ? MESES_CORTOS[mes - 1] : MESES[mes - 1]
}

export function formatearNumero(n: number, decimales = 0) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
}

export function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase()
}

export function normalizarTexto(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export function generarId(prefijo: string) {
  return `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
