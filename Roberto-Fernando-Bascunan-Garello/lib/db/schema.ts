import { boolean, date, integer, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const comunidad = pgTable("comunidad", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  nombreApp: text("nombre_app").notNull(),
  logo: text("logo"),
  colorPrimario: text("color_primario").notNull(),
})

export const admins = pgTable("admins", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  rol: text("rol").notNull(),
})

export const embajadores = pgTable("embajadores", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  pais: text("pais").notNull(),
  cumpleDia: integer("cumple_dia"),
  cumpleMes: integer("cumple_mes"),
  telegram: text("telegram"),
  wallet: text("wallet"),
  fechaIngreso: date("fecha_ingreso", { mode: "string" }).notNull(),
  estado: text("estado").notNull(),
  nivelId: text("nivel_id").notNull().default("niv-explorador"),
})

export const actividades = pgTable("actividades", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  puntosDefecto: integer("puntos_defecto").notNull(),
  puntosVariables: boolean("puntos_variables").notNull(),
  activa: boolean("activa").notNull(),
})

export const niveles = pgTable("niveles", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  puntosMinimos: integer("puntos_minimos").notNull(),
  color: text("color").notNull(),
  icono: text("icono").notNull(),
  beneficios: jsonb("beneficios").$type<string[]>().notNull(),
  orden: integer("orden").notNull(),
})

export const movimientos = pgTable("movimientos", {
  id: text("id").primaryKey(),
  embajadorId: text("embajador_id").notNull(),
  actividadId: text("actividad_id").notNull(),
  puntos: integer("puntos").notNull(),
  fecha: date("fecha", { mode: "string" }).notNull(),
  nota: text("nota").notNull(),
  cargadoPor: text("cargado_por").notNull(),
  txHash: text("tx_hash"),
  estadoBlockchain: text("estado_blockchain").notNull(),
  token: text("token").notNull(),
  revierteA: text("revierte_a"),
  revertidoPor: text("revertido_por"),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull(),
})

export const premios = pgTable("premios", {
  id: text("id").primaryKey(),
  embajadorId: text("embajador_id").notNull(),
  concepto: text("concepto").notNull(),
  monto: numeric("monto", { precision: 14, scale: 2, mode: "number" }).notNull(),
  moneda: text("moneda").notNull(),
  estado: text("estado").notNull(),
  fecha: date("fecha", { mode: "string" }).notNull(),
  txHash: text("tx_hash"),
})

export const bitacora = pgTable("bitacora", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha", { mode: "string" }).notNull(),
  adminId: text("admin_id").notNull(),
  accion: text("accion").notNull(),
  entidad: text("entidad").notNull(),
  detalle: text("detalle").notNull(),
})

export const cuentasStellar = pgTable("cuentas_stellar", {
  tipo: text("tipo").primaryKey(),
  clavePublica: text("clave_publica").notNull(),
  balanceXLM: numeric("balance_xlm", { precision: 20, scale: 7, mode: "number" }).notNull(),
  balanceUPT: numeric("balance_upt", { precision: 20, scale: 7, mode: "number" }).notNull(),
})

export const configStellar = pgTable("config_stellar", {
  id: text("id").primaryKey(),
  clavePublica: text("clave_publica").notNull(),
  claveSecreta: text("clave_secreta").notNull(),
})
