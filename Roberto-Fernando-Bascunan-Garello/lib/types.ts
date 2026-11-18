export type CodigoPais = "MX" | "CO" | "CR" | "BO" | "AR" | "PE" | "EC" | "XX"

export type EstadoBlockchain = "pendiente" | "confirmado" | "error" | "historico"
export type EstadoEmbajador = "activo" | "inactivo"
export type EstadoPremio = "pendiente" | "aprobado" | "pagado"
export type RolAdmin = "super_admin" | "admin"
export type MonedaPremio = "XLM" | "USDC" | "StellarPoints"
export type IconoNivel = "compass" | "handshake" | "sparkles" | "crown" | "star" | "rocket" | "shield" | "gem"

export interface Comunidad {
  id: string
  nombre: string
  nombreApp: string
  logo: string | null
  colorPrimario: string
}

export interface Embajador {
  id: string
  nombre: string
  pais: CodigoPais
  cumpleDia: number | null
  cumpleMes: number | null
  telegram: string | null
  wallet: string | null
  fechaIngreso: string
  estado: EstadoEmbajador
  nivelId: string
}

export interface Actividad {
  id: string
  nombre: string
  descripcion: string
  puntosDefecto: number
  puntosVariables: boolean
  activa: boolean
}

export interface Movimiento {
  id: string
  embajadorId: string
  actividadId: string
  puntos: number
  fecha: string
  nota: string
  cargadoPor: string
  txHash: string | null
  estadoBlockchain: EstadoBlockchain
  token: "StellarPoints"
  revierteA: string | null
  revertidoPor: string | null
  creadoEn: string
}

export interface Nivel {
  id: string
  nombre: string
  puntosMinimos: number
  color: string
  icono: IconoNivel
  beneficios: string[]
  orden: number
}

export interface Premio {
  id: string
  embajadorId: string
  concepto: string
  monto: number
  moneda: MonedaPremio
  estado: EstadoPremio
  fecha: string
  txHash: string | null
}

export interface Admin {
  id: string
  nombre: string
  email: string
  rol: RolAdmin
}

export interface EntradaBitacora {
  id: string
  fecha: string
  adminId: string
  accion: string
  entidad: "embajador" | "movimiento" | "actividad" | "nivel" | "premio" | "admin" | "comunidad" | "sistema"
  detalle: string
}

export interface CuentaStellar {
  tipo: "registro"
  clavePublica: string
  balanceXLM: number
  balanceUPT: number
}

export interface EstadoApp {
  comunidad: Comunidad
  embajadores: Embajador[]
  actividades: Actividad[]
  movimientos: Movimiento[]
  niveles: Nivel[]
  premios: Premio[]
  admins: Admin[]
  bitacora: EntradaBitacora[]
  cuentas: CuentaStellar[]
  adminActualId: string
}

export type Periodo =
  | { tipo: "total" }
  | { tipo: "anio"; anio: number }
  | { tipo: "mes"; anio: number; mes: number }
