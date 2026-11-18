import type { EstadoApp } from "@/lib/types"
import { cargarEstado, guardarCambios, type Cambios, type NombreTabla } from "@/app/actions/datos"

/** Capa de acceso a datos: lee y escribe en Neon a través de acciones de servidor. */
export interface RepositorioDatos {
  cargarEstadoInicial(): Promise<EstadoApp>
  guardar(anterior: EstadoApp, siguiente: EstadoApp): Promise<void>
}

const COLECCIONES = ["embajadores", "actividades", "movimientos", "niveles", "premios", "admins", "bitacora"] as const

export function calcularCambios(anterior: EstadoApp, siguiente: EstadoApp): Cambios {
  const cambios: Cambios = {}
  for (const nombre of COLECCIONES) {
    const antes = anterior[nombre] as { id: string }[]
    const despues = siguiente[nombre] as { id: string }[]
    if (antes === despues) continue
    const previos = new Map(antes.map((x) => [x.id, x]))
    const actuales = new Set(despues.map((x) => x.id))
    const guardar = despues.filter((x) => previos.get(x.id) !== x) as unknown as Record<string, unknown>[]
    const eliminar = antes.filter((x) => !actuales.has(x.id)).map((x) => x.id)
    if (guardar.length || eliminar.length) cambios[nombre as NombreTabla] = { guardar, eliminar }
  }
  if (anterior.comunidad !== siguiente.comunidad) {
    cambios.comunidad = { guardar: [siguiente.comunidad as unknown as Record<string, unknown>], eliminar: [] }
  }
  return cambios
}

export const repositorio: RepositorioDatos = {
  cargarEstadoInicial: () => cargarEstado(),
  async guardar(anterior, siguiente) {
    const cambios = calcularCambios(anterior, siguiente)
    if (Object.keys(cambios).length) await guardarCambios(cambios)
  },
}
