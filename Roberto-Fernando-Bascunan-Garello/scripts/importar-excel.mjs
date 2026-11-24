// Importa los Excel reales (cumpleaños + Leader Board) a Neon.
// Uso: node scripts/importar-excel.mjs [--aplicar]   (sin --aplicar sólo muestra el resumen)
import { readFileSync } from "node:fs"
import { read, utils } from "xlsx"
import pg from "pg"

const APLICAR = process.argv.includes("--aplicar")
const HOY = new Date().toISOString().slice(0, 10)

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const PAISES = { mexico: "MX", colombia: "CO", "costa rica": "CR", bolivia: "BO", argentina: "AR", peru: "PE", ecuador: "EC" }

// Hoja del Leader Board -> año, mes (1-12) y nota del período
const HOJAS = {
  "Marzo": [2025, 3, "Marzo 2025"],
  "Mayo": [2025, 5, "Mayo 2025"],
  "Junio": [2025, 6, "Junio 2025"],
  "Julio": [2025, 7, "Julio 2025"],
  "Agosto": [2025, 8, "Agosto 2025"],
  "Septiembre": [2025, 9, "Septiembre 2025"],
  "Octubre": [2025, 10, "Octubre 2025"],
  "Nov x Dic": [2025, 12, "Noviembre y Diciembre 2025"],
  "Ene 2026": [2026, 1, "Enero 2026"],
  "Feb 2026": [2026, 2, "Febrero 2026"],
  "Marzo 2026": [2026, 3, "Marzo 2026"],
  "Abril 2026": [2026, 4, "Abril 2026"],
  "Mayo 2026": [2026, 5, "Mayo 2026"],
  "Junio 2026": [2026, 6, "Junio 2026"],
  "Julio 2026": [2026, 7, "Julio 2026"],
  "Agosto 2026": [2026, 8, "Agosto 2026"],
  "Septiembre 2026": [2026, 9, "Septiembre 2026"],
}

// Variantes del mismo nombre detectadas en las planillas
const ALIAS = { "manu jimenez": "manuel jimenez" }

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
const limpiar = (s) => String(s ?? "").replace(/\s+/g, " ").trim()
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
const pais = (s) => PAISES[norm(s)] ?? null
const ultimoDia = (a, m) => `${a}-${String(m).padStart(2, "0")}-${String(new Date(a, m, 0).getDate()).padStart(2, "0")}`

function filas(archivo, hoja) {
  const wb = read(readFileSync(archivo), { cellDates: true })
  const datos = utils.sheet_to_json(wb.Sheets[hoja], { header: 1, defval: null, blankrows: false })
  const iHeader = datos.findIndex((r) => r.some((c) => norm(c) === "nombre"))
  const header = datos[iHeader].map(norm)
  return datos.slice(iHeader + 1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))
}

// 1) Cumpleaños: base de embajadores
const embajadores = new Map() // clave normalizada -> embajador
for (const r of filas("data/Stellar-HappyBdays-2ac113.xlsx", "Stellar")) {
  const nombre = limpiar(r.nombre)
  if (!nombre) continue
  const clave = ALIAS[norm(nombre)] ?? norm(nombre)
  if (embajadores.has(clave)) continue
  const mes = MESES.indexOf(norm(r.mes)) + 1
  const dia = Number(r["dia"])
  const tg = limpiar(r["user de telegram"]).replace(/^@/, "")
  embajadores.set(clave, {
    id: `emb-${slug(nombre)}`,
    nombre,
    pais: pais(r.pais),
    cumple_dia: mes > 0 && dia >= 1 && dia <= 31 ? dia : null,
    cumple_mes: mes > 0 && dia >= 1 ? mes : null,
    telegram: tg || null,
    fecha_ingreso: null,
    origen: "cumpleanos",
  })
}

// Busca al embajador por nombre exacto; si no, por nombre corto contenido en uno completo (único candidato)
function buscar(nombre) {
  const clave = ALIAS[norm(nombre)] ?? norm(nombre)
  if (embajadores.has(clave)) return embajadores.get(clave)
  const tokens = clave.split(" ")
  if (tokens.length < 2) return null
  const candidatos = [...embajadores.entries()].filter(([k]) => {
    const t = k.split(" ")
    return tokens.every((x) => t.includes(x))
  })
  return candidatos.length === 1 ? candidatos[0][1] : null
}

// 2) Leader Board: un movimiento por embajador y período
const movimientos = []
const porPeriodo = {}
const cruzados = new Set()
for (const [hoja, [anio, mes, nota]] of Object.entries(HOJAS)) {
  const fecha = ultimoDia(anio, mes)
  const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`
  porPeriodo[nota] = 0
  const vistos = new Set()
  for (const r of filas("data/Leader-Board-38ea63.xlsx", hoja)) {
    const nombre = limpiar(r.nombre)
    const puntos = Number(r.puntos ?? r.total)
    if (!nombre || !Number.isFinite(puntos)) continue
    let emb = buscar(nombre)
    if (emb && emb.origen === "cumpleanos" && norm(emb.nombre) !== norm(nombre)) cruzados.add(`${nombre} -> ${emb.nombre}`)
    if (!emb) {
      emb = {
        id: `emb-${slug(nombre)}`,
        nombre,
        pais: pais(r.pais),
        cumple_dia: null,
        cumple_mes: null,
        telegram: null,
        fecha_ingreso: null,
        origen: "leaderboard",
      }
      embajadores.set(norm(nombre), emb)
    }
    if (!emb.pais && pais(r.pais)) emb.pais = pais(r.pais)
    if (!emb.fecha_ingreso || inicio < emb.fecha_ingreso) emb.fecha_ingreso = inicio
    if (puntos === 0 || vistos.has(emb.id)) continue
    vistos.add(emb.id)
    movimientos.push({
      id: `mov-${anio}-${String(mes).padStart(2, "0")}-${emb.id.slice(4)}`,
      embajador_id: emb.id,
      actividad_id: "act-historico",
      puntos,
      fecha,
      nota: `Leader Board · ${nota}`,
      cargado_por: "adm-import",
      creado_en: `${fecha} 12:00:00`,
    })
    porPeriodo[nota]++
  }
}

const lista = [...embajadores.values()].map((e) => ({ ...e, pais: e.pais ?? "XX", fecha_ingreso: e.fecha_ingreso ?? HOY }))

console.log("Embajadores:", lista.length, "| sólo cumpleaños:", lista.filter((e) => e.origen === "cumpleanos" && !movimientos.some((m) => m.embajador_id === e.id)).length, "| sólo leader board:", lista.filter((e) => e.origen === "leaderboard").length)
console.log("Sin país:", lista.filter((e) => e.pais === "XX").map((e) => e.nombre))
console.log("Con cumpleaños:", lista.filter((e) => e.cumple_mes).length)
console.log("Cruces por nombre parcial:", [...cruzados])
console.log("Movimientos:", movimientos.length, "| puntos totales:", movimientos.reduce((s, m) => s + m.puntos, 0))
console.log("Por período:", porPeriodo)
const ids = new Set(); for (const e of lista) { if (ids.has(e.id)) console.log("ID duplicado:", e.id); ids.add(e.id) }

if (!APLICAR) process.exit(0)

const ACTIVIDADES = [
  ["act-historico", "Puntaje mensual (Leader Board)", "Puntos mensuales importados del Leader Board histórico.", 0, true],
  ["act-reuniones", "Participar en reuniones", "Asistencia a reuniones semanales de la comunidad.", 20, false],
  ["act-chat", "Hablar y responder en el chat", "Aportes de valor y respuestas en el grupo de Telegram.", 5, false],
  ["act-pitch", "Presentar pitch", "Presentación de un proyecto o idea ante la comunidad.", 50, false],
  ["act-desafios", "Cumplir desafíos", "Completar desafíos técnicos o de contenido.", 30, false],
  ["act-espontanea", "Espontánea", "Reconocimiento por una acción destacada no planificada.", 10, false],
  ["act-eventos", "Ir a eventos", "Asistencia a meetups, hackathons o conferencias.", 30, false],
  ["act-organizar", "Organizar eventos", "Organización de un evento local o virtual.", 100, false],
  ["act-otros", "Otros", "Actividades no contempladas. Puntos a criterio del admin.", 15, true],
]
const NIVELES = [
  ["niv-explorador", "Explorador", 0, "#4FB3C9", "compass", ["Acceso al grupo de embajadores", "Kit de bienvenida digital"], 1],
  ["niv-colaborador", "Colaborador", 300, "#7B5CF5", "handshake", ["Insignia de colaborador", "Acceso a talleres exclusivos"], 2],
  ["niv-creador", "Creador", 800, "#F8A73A", "sparkles", ["Merch oficial", "Mentorías 1:1", "Prioridad en hackathons"], 3],
  ["niv-lider", "Líder del ecosistema", 1500, "#FF4F7B", "crown", ["Viaje a evento internacional", "Voz en el comité de la comunidad", "Bono trimestral en XLM"], 4],
]

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL })
await cliente.connect()
try {
  await cliente.query("BEGIN")
  for (const t of ["movimientos", "premios", "bitacora", "embajadores", "actividades", "niveles", "admins", "comunidad", "cuentas_stellar"]) await cliente.query(`DELETE FROM ${t}`)
  await cliente.query("INSERT INTO comunidad (id, nombre, nombre_app, color_primario) VALUES ($1,$2,$3,$4)", ["com-stellar", "Stellar Comunidad Hispana", "Upteam", "#7B5CF5"])
  await cliente.query("INSERT INTO admins (id, nombre, email, rol) VALUES ($1,$2,$3,$4)", ["adm-import", "Administrador Upteam", "admin@upteam.app", "super_admin"])
  for (const a of ACTIVIDADES) await cliente.query("INSERT INTO actividades (id, nombre, descripcion, puntos_defecto, puntos_variables, activa) VALUES ($1,$2,$3,$4,$5,true)", a)
  for (const n of NIVELES) await cliente.query("INSERT INTO niveles (id, nombre, puntos_minimos, color, icono, beneficios, orden) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)", [n[0], n[1], n[2], n[3], n[4], JSON.stringify(n[5]), n[6]])
  for (const e of lista)
    await cliente.query(
      "INSERT INTO embajadores (id, nombre, pais, cumple_dia, cumple_mes, telegram, wallet, fecha_ingreso, estado) VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,'activo')",
      [e.id, e.nombre, e.pais, e.cumple_dia, e.cumple_mes, e.telegram, e.fecha_ingreso],
    )
  for (const m of movimientos)
    await cliente.query(
      "INSERT INTO movimientos (id, embajador_id, actividad_id, puntos, fecha, nota, cargado_por, tx_hash, estado_blockchain, token, creado_en) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,'pendiente','UPT',$8)",
      [m.id, m.embajador_id, m.actividad_id, m.puntos, m.fecha, m.nota, m.cargado_por, m.creado_en],
    )
  await cliente.query("INSERT INTO bitacora (id, admin_id, accion, entidad, detalle) VALUES ($1,$2,$3,$4,$5)", [
    "bit-import",
    "adm-import",
    "Importó datos",
    "sistema",
    `${lista.length} embajadores y ${movimientos.length} movimientos desde los Excel`,
  ])
  await cliente.query("COMMIT")
  console.log("Datos cargados en Neon.")
} catch (err) {
  await cliente.query("ROLLBACK")
  throw err
} finally {
  await cliente.end()
}
