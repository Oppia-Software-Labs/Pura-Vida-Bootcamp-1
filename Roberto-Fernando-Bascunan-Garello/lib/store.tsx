"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type {
  Actividad,
  Admin,
  Comunidad,
  Embajador,
  EntradaBitacora,
  EstadoApp,
  EstadoEmbajador,
  Movimiento,
  Nivel,
  Premio,
} from "@/lib/types"
import { repositorio } from "@/lib/data/repositorio"
import { nivelInicial, puede, type Permiso } from "@/lib/data/calculos"
import type { ResultadoStellar } from "@/lib/stellar"
import { registrarMovimientosStellar, registrarPremioStellar } from "@/app/actions/stellar"
import { generarId, hoyISO } from "@/lib/format"
import { toast } from "sonner"

export interface NuevoMovimiento {
  embajadorIds: string[]
  actividadId: string
  puntos: number
  fecha: string
  nota: string
}

type Acciones = ReturnType<typeof useAcciones>

interface ContextoApp {
  estado: EstadoApp | null
  acciones: Acciones
  errorCarga: string | null
}

const Contexto = createContext<ContextoApp | null>(null)

function ahora() {
  const d = new Date()
  return `${hoyISO()}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
}

function conBitacora(e: EstadoApp, accion: string, entidad: EntradaBitacora["entidad"], detalle: string): EstadoApp {
  const entrada: EntradaBitacora = { id: generarId("bit"), fecha: ahora(), adminId: e.adminActualId, accion, entidad, detalle }
  return { ...e, bitacora: [entrada, ...e.bitacora] }
}

function useAcciones(
  setEstado: React.Dispatch<React.SetStateAction<EstadoApp | null>>,
  estadoRef: React.RefObject<EstadoApp | null>,
) {
  const actualizar = useCallback(
    (fn: (e: EstadoApp) => EstadoApp) => setEstado((prev) => (prev ? fn(prev) : prev)),
    [setEstado],
  )

  return useMemo(() => {
    const nombreEmb = (e: EstadoApp, id: string) => e.embajadores.find((x) => x.id === id)?.nombre ?? id

    const registrarEnStellar = async (ids: string[]) => {
      const movs = (estadoRef.current?.movimientos ?? []).filter((m) => ids.includes(m.id))
      actualizar((e) => ({
        ...e,
        movimientos: e.movimientos.map((m) => (ids.includes(m.id) ? { ...m, estadoBlockchain: "pendiente" } : m)),
      }))
      let resultados: { id: string; r: ResultadoStellar }[]
      try {
        const res = await registrarMovimientosStellar(movs.map(({ id, embajadorId, puntos }) => ({ id, embajadorId, puntos })))
        resultados = res.map((x) => ({ id: x.id, r: x.resultado }))
      } catch {
        resultados = movs.map((m) => ({ id: m.id, r: { ok: false, error: "No se pudo contactar a Stellar" } }))
      }
      actualizar((e) => ({
        ...e,
        movimientos: e.movimientos.map((m) => {
          const res = resultados.find((x) => x.id === m.id)
          if (!res) return m
          return res.r.ok
            ? { ...m, estadoBlockchain: "confirmado", txHash: res.r.txHash }
            : { ...m, estadoBlockchain: "error", txHash: null }
        }),
      }))
      return { fallidos: resultados.filter((x) => !x.r.ok).length, total: resultados.length }
    }

    return {
      cambiarAdminActual: (id: string) => actualizar((e) => ({ ...e, adminActualId: id })),

      crearMovimientos: (input: NuevoMovimiento) => {
        const creadoEn = ahora()
        const nuevos: Movimiento[] = input.embajadorIds.map((embajadorId) => ({
          id: generarId("mov"),
          embajadorId,
          actividadId: input.actividadId,
          puntos: input.puntos,
          fecha: input.fecha,
          nota: input.nota,
          cargadoPor: estadoRef.current?.adminActualId ?? "",
          txHash: null,
          estadoBlockchain: "pendiente",
          token: "StellarPoints",
          revierteA: null,
          revertidoPor: null,
          creadoEn,
        }))
        actualizar((e) => {
          const act = e.actividades.find((a) => a.id === input.actividadId)?.nombre ?? ""
          const detalle =
            nuevos.length === 1 ? `${nombreEmb(e, nuevos[0].embajadorId)} · ${act} · ${input.puntos} pts` : `${nuevos.length} embajadores · ${act} · ${input.puntos} pts`
          return conBitacora({ ...e, movimientos: [...nuevos, ...e.movimientos] }, "Cargó puntos", "movimiento", detalle)
        })
        if (estadoRef.current) {
          estadoRef.current = { ...estadoRef.current, movimientos: [...nuevos, ...estadoRef.current.movimientos] }
        }
        return nuevos.map((m) => m.id)
      },

      registrarEnStellar,

      revertirMovimiento: async (id: string, motivo: string) => {
        const original = estadoRef.current?.movimientos.find((m) => m.id === id)
        if (!original || original.revertidoPor || original.revierteA) return
        const reverso: Movimiento = {
          ...original,
          id: generarId("mov"),
          puntos: -original.puntos,
          fecha: hoyISO(),
          nota: `Reversión: ${motivo}`,
          cargadoPor: estadoRef.current?.adminActualId ?? "",
          txHash: null,
          estadoBlockchain: "pendiente",
          revierteA: original.id,
          revertidoPor: null,
          creadoEn: ahora(),
        }
        actualizar((e) =>
          conBitacora(
            {
              ...e,
              movimientos: [reverso, ...e.movimientos.map((m) => (m.id === id ? { ...m, revertidoPor: reverso.id } : m))],
            },
            "Revirtió movimiento",
            "movimiento",
            `${nombreEmb(e, original.embajadorId)} · ${original.puntos} pts · ${motivo}`,
          ),
        )
        if (estadoRef.current) estadoRef.current = { ...estadoRef.current, movimientos: [reverso, ...estadoRef.current.movimientos] }
        return registrarEnStellar([reverso.id])
      },

      guardarEmbajador: (emb: Omit<Embajador, "id" | "nivelId"> & { id?: string; nivelId?: string }) => {
        const id = emb.id ?? generarId("emb")
        actualizar((e) => {
          const previo = e.embajadores.find((x) => x.id === id)
          const nivelId = emb.nivelId ?? previo?.nivelId ?? nivelInicial(e.niveles)?.id ?? "niv-explorador"
          const nuevo: Embajador = { ...emb, id, nivelId }
          const lista = previo ? e.embajadores.map((x) => (x.id === id ? nuevo : x)) : [nuevo, ...e.embajadores]
          return conBitacora({ ...e, embajadores: lista }, previo ? "Editó embajador" : "Creó embajador", "embajador", emb.nombre)
        })
        return id
      },

      asignarNivel: (embajadorId: string, nivelId: string) =>
        actualizar((e) => {
          const nivel = e.niveles.find((n) => n.id === nivelId)
          if (!nivel) return e
          return conBitacora(
            { ...e, embajadores: e.embajadores.map((x) => (x.id === embajadorId ? { ...x, nivelId } : x)) },
            "Cambió nivel",
            "embajador",
            `${nombreEmb(e, embajadorId)} · ${nivel.nombre}`,
          )
        }),

      importarEmbajadores: (lista: Omit<Embajador, "id" | "nivelId">[]) =>
        actualizar((e) =>
          conBitacora(
            {
              ...e,
              embajadores: [
                ...lista.map((x) => ({ ...x, id: generarId("emb"), nivelId: nivelInicial(e.niveles)?.id ?? "niv-explorador" })),
                ...e.embajadores,
              ],
            },
            "Importó embajadores",
            "embajador",
            `${lista.length} embajadores desde archivo`,
          ),
        ),

      cambiarEstadoEmbajadores: (ids: string[], estado: EstadoEmbajador) =>
        actualizar((e) =>
          conBitacora(
            { ...e, embajadores: e.embajadores.map((x) => (ids.includes(x.id) ? { ...x, estado } : x)) },
            estado === "activo" ? "Restauró embajadores" : "Dio de baja embajadores",
            "embajador",
            ids.length === 1 ? nombreEmb(e, ids[0]) : `${ids.length} embajadores`,
          ),
        ),

      guardarActividad: (act: Omit<Actividad, "id"> & { id?: string }) =>
        actualizar((e) => {
          const id = act.id ?? generarId("act")
          const existe = e.actividades.some((x) => x.id === id)
          const lista = existe ? e.actividades.map((x) => (x.id === id ? { ...act, id } : x)) : [...e.actividades, { ...act, id }]
          return conBitacora({ ...e, actividades: lista }, existe ? "Editó actividad" : "Creó actividad", "actividad", act.nombre)
        }),

      eliminarActividad: (id: string) =>
        actualizar((e) => {
          if (e.movimientos.some((m) => m.actividadId === id)) return e
          const nombre = e.actividades.find((a) => a.id === id)?.nombre ?? id
          return conBitacora({ ...e, actividades: e.actividades.filter((a) => a.id !== id) }, "Eliminó actividad", "actividad", nombre)
        }),

      guardarNivel: (niv: Omit<Nivel, "id" | "orden"> & { id?: string; orden?: number }) =>
        actualizar((e) => {
          const id = niv.id ?? generarId("niv")
          const existe = e.niveles.some((x) => x.id === id)
          const orden = niv.orden ?? Math.max(0, ...e.niveles.map((n) => n.orden)) + 1
          const lista = existe
            ? e.niveles.map((x) => (x.id === id ? { ...niv, id, orden: x.orden } : x))
            : [...e.niveles, { ...niv, id, orden }]
          return conBitacora({ ...e, niveles: lista }, existe ? "Editó nivel" : "Creó nivel", "nivel", niv.nombre)
        }),

      eliminarNivel: (id: string) =>
        actualizar((e) => {
          const nombre = e.niveles.find((n) => n.id === id)?.nombre ?? id
          return conBitacora({ ...e, niveles: e.niveles.filter((n) => n.id !== id) }, "Eliminó nivel", "nivel", nombre)
        }),

      moverNivel: (id: string, direccion: -1 | 1) =>
        actualizar((e) => {
          const orden = [...e.niveles].sort((a, b) => a.orden - b.orden)
          const i = orden.findIndex((n) => n.id === id)
          const j = i + direccion
          if (i < 0 || j < 0 || j >= orden.length) return e
          ;[orden[i], orden[j]] = [orden[j], orden[i]]
          return { ...e, niveles: orden.map((n, k) => ({ ...n, orden: k + 1 })) }
        }),

      crearPremio: (p: Omit<Premio, "id" | "estado" | "txHash">) =>
        actualizar((e) =>
          conBitacora(
            { ...e, premios: [{ ...p, id: generarId("pre"), estado: "pendiente", txHash: null }, ...e.premios] },
            "Creó premio",
            "premio",
            `${nombreEmb(e, p.embajadorId)} · ${p.concepto}`,
          ),
        ),

      aprobarPremio: (id: string) =>
        actualizar((e) => {
          const p = e.premios.find((x) => x.id === id)
          return conBitacora(
            { ...e, premios: e.premios.map((x) => (x.id === id ? { ...x, estado: "aprobado" } : x)) },
            "Aprobó premio",
            "premio",
            p ? `${nombreEmb(e, p.embajadorId)} · ${p.concepto}` : id,
          )
        }),

      pagarPremio: async (id: string) => {
        const e0 = estadoRef.current
        const premio = e0?.premios.find((p) => p.id === id)
        if (!premio) return { ok: false as const, error: "Premio no encontrado" }
        const r: ResultadoStellar = await registrarPremioStellar({ id: premio.id, monto: premio.monto, moneda: premio.moneda }).catch(
          () => ({ ok: false as const, error: "No se pudo contactar a Stellar" }),
        )
        if (r.ok) {
          actualizar((e) =>
            conBitacora(
              { ...e, premios: e.premios.map((x) => (x.id === id ? { ...x, estado: "pagado", txHash: r.txHash } : x)) },
              "Pagó premio",
              "premio",
              `${nombreEmb(e, premio.embajadorId)} · ${premio.monto} ${premio.moneda}`,
            ),
          )
        }
        return r
      },

      eliminarPremio: (id: string) =>
        actualizar((e) => conBitacora({ ...e, premios: e.premios.filter((p) => p.id !== id) }, "Eliminó premio", "premio", id)),

      guardarAdmin: (a: Omit<Admin, "id"> & { id?: string }) =>
        actualizar((e) => {
          const id = a.id ?? generarId("adm")
          const existe = e.admins.some((x) => x.id === id)
          const lista = existe ? e.admins.map((x) => (x.id === id ? { ...a, id } : x)) : [...e.admins, { ...a, id }]
          return conBitacora({ ...e, admins: lista }, existe ? "Cambió rol de admin" : "Agregó admin", "admin", `${a.nombre} · ${a.rol}`)
        }),

      eliminarAdmin: (id: string) =>
        actualizar((e) => {
          const nombre = e.admins.find((a) => a.id === id)?.nombre ?? id
          return conBitacora({ ...e, admins: e.admins.filter((a) => a.id !== id) }, "Quitó admin", "admin", nombre)
        }),

      actualizarComunidad: (cambios: Partial<Comunidad>) =>
        actualizar((e) =>
          conBitacora({ ...e, comunidad: { ...e.comunidad, ...cambios } }, "Actualizó configuración", "comunidad", Object.keys(cambios).join(", ")),
        ),
    }
  }, [actualizar, estadoRef])
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoApp | null>(null)
  const estadoRef = useRef<EstadoApp | null>(null)
  estadoRef.current = estado
  const acciones = useAcciones(setEstado, estadoRef)

  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const persistidoRef = useRef<EstadoApp | null>(null)
  const colaGuardado = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let activo = true
    repositorio
      .cargarEstadoInicial()
      .then((datos) => {
        if (!activo) return
        persistidoRef.current = datos
        setEstado(datos)
      })
      .catch((err: unknown) => {
        if (activo) setErrorCarga(err instanceof Error ? err.message : "No se pudo conectar con la base de datos")
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    const anterior = persistidoRef.current
    if (!estado || !anterior || anterior === estado) return
    persistidoRef.current = estado
    colaGuardado.current = colaGuardado.current
      .then(() => repositorio.guardar(anterior, estado))
      .catch((err: unknown) => {
        console.error("[upteam] Error al guardar en la base de datos:", err)
        toast.error("No se pudieron guardar los últimos cambios. Recarga la página para ver el estado real.")
      })
  }, [estado])

  const color = estado?.comunidad.colorPrimario
  const nombreApp = estado?.comunidad.nombreApp
  useEffect(() => {
    if (!color) return
    const root = document.documentElement
    for (const v of ["--primary", "--ring", "--chart-1", "--sidebar-primary"]) root.style.setProperty(v, color)
  }, [color])
  useEffect(() => {
    if (nombreApp) document.title = `${nombreApp} · Programa de embajadores`
  }, [nombreApp])

  const valor = useMemo(() => ({ estado, acciones, errorCarga }), [estado, acciones, errorCarga])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useApp() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider")
  return ctx
}

/** Para pantallas que ya se renderizan con datos cargados. */
export function useDatos() {
  const { estado, acciones } = useApp()
  if (!estado) throw new Error("Datos no cargados")
  const adminActual = estado.admins.find((a) => a.id === estado.adminActualId) ?? estado.admins[0]
  const permitido = (p: Permiso) => (adminActual ? puede(adminActual.rol, p) : false)
  return { ...estado, acciones, adminActual, permitido }
}
