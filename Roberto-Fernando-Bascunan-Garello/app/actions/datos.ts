"use server"

import { asc, desc, getTableColumns, inArray, sql } from "drizzle-orm"
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core"
import { db } from "@/lib/db"
import * as t from "@/lib/db/schema"
import type { EstadoApp } from "@/lib/types"

const aISOHora = (s: string) => s.replace(" ", "T").slice(0, 19)

export async function cargarEstado(): Promise<EstadoApp> {
  const [comunidad, embajadores, actividades, movimientos, niveles, premios, admins, bitacora, cuentas] = await Promise.all([
    db.select().from(t.comunidad).limit(1),
    db.select().from(t.embajadores).orderBy(asc(t.embajadores.nombre)),
    db.select().from(t.actividades),
    db.select().from(t.movimientos).orderBy(desc(t.movimientos.creadoEn)),
    db.select().from(t.niveles).orderBy(asc(t.niveles.orden)),
    db.select().from(t.premios).orderBy(desc(t.premios.fecha)),
    db.select().from(t.admins),
    db.select().from(t.bitacora).orderBy(desc(t.bitacora.fecha)),
    db.select().from(t.cuentasStellar),
  ])

  if (!comunidad[0]) throw new Error("La base de datos no tiene una comunidad configurada")

  return {
    comunidad: comunidad[0],
    embajadores,
    actividades,
    movimientos: movimientos.map((m) => ({ ...m, creadoEn: aISOHora(m.creadoEn) })),
    niveles,
    premios,
    admins,
    bitacora: bitacora.map((b) => ({ ...b, fecha: aISOHora(b.fecha) })),
    cuentas,
    adminActualId: admins.find((a) => a.rol === "super_admin")?.id ?? admins[0]?.id ?? "",
  } as EstadoApp
}

const TABLAS = {
  comunidad: t.comunidad,
  embajadores: t.embajadores,
  actividades: t.actividades,
  movimientos: t.movimientos,
  niveles: t.niveles,
  premios: t.premios,
  admins: t.admins,
  bitacora: t.bitacora,
} satisfies Record<string, PgTable>

export type NombreTabla = keyof typeof TABLAS
export type Cambios = Partial<Record<NombreTabla, { guardar: Record<string, unknown>[]; eliminar: string[] }>>

export async function guardarCambios(cambios: Cambios) {
  await db.transaction(async (tx) => {
    for (const [nombre, cambio] of Object.entries(cambios)) {
      const tabla = TABLAS[nombre as NombreTabla]
      if (!tabla || !cambio) throw new Error(`Tabla no permitida: ${nombre}`)
      const columnas = getTableColumns(tabla)
      const id = (columnas as unknown as { id: AnyPgColumn }).id

      if (cambio.eliminar.length) await tx.delete(tabla).where(inArray(id, cambio.eliminar))

      if (cambio.guardar.length) {
        const filas = cambio.guardar.map((fila) =>
          Object.fromEntries(Object.keys(columnas).map((col) => [col, fila[col] ?? null])),
        )
        const set = Object.fromEntries(
          Object.entries(columnas)
            .filter(([col]) => col !== "id")
            .map(([col, c]) => [col, sql.raw(`excluded."${c.name}"`)]),
        )
        await tx.insert(tabla).values(filas as never).onConflictDoUpdate({ target: id, set })
      }
    }
  })
}
