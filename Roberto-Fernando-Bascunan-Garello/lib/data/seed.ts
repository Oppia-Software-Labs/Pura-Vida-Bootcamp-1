import type {
  Actividad,
  Admin,
  CodigoPais,
  CuentaStellar,
  Embajador,
  EntradaBitacora,
  EstadoApp,
  Movimiento,
  Nivel,
  Premio,
} from "@/lib/types"
import { generarClavePublicaFalsa, generarHashFalso } from "@/lib/stellar"
import { aISOFecha } from "@/lib/format"

function crearRandom(semilla: number) {
  let a = semilla
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NOMBRES: [string, CodigoPais][] = [
  ["Nayeli Chávez Robles", "MX"],
  ["Emiliano Garza Treviño", "MX"],
  ["Ximena Durán Olvera", "MX"],
  ["Rodrigo Aguilar Pech", "MX"],
  ["Fernanda Saldívar Ruiz", "MX"],
  ["Iker Montoya Lara", "MX"],
  ["Valentina Cárdenas Ospina", "CO"],
  ["Santiago Restrepo Mejía", "CO"],
  ["Mariana Quintero Gil", "CO"],
  ["Julián Betancur Ríos", "CO"],
  ["Daniela Zapata Henao", "CO"],
  ["Sebastián Arango Vélez", "CO"],
  ["Sofía Jiménez Solano", "CR"],
  ["Mateo Vargas Chaves", "CR"],
  ["Camila Brenes Mora", "CR"],
  ["Diego Alfaro Quesada", "CR"],
  ["Lucía Mamani Quispe", "BO"],
  ["Gabriel Rojas Paredes", "BO"],
  ["Andrea Choque Vaca", "BO"],
  ["Tomás Ibáñez Suárez", "BO"],
  ["Martina Bianchi Ferreyra", "AR"],
  ["Facundo Gómez Ledesma", "AR"],
  ["Agustina Pereyra Sosa", "AR"],
  ["Joaquín Medina Acosta", "AR"],
  ["Milagros Benítez Ojeda", "AR"],
  ["Thiago Romero Godoy", "AR"],
  ["Renata Huamán Salazar", "PE"],
  ["Adrián Quispe Valdivia", "PE"],
  ["Alessandra Torres Ugarte", "PE"],
  ["Bruno Cáceres Palomino", "PE"],
  ["Ariana Flores Chumpitaz", "PE"],
  ["Nicolás Espinoza Ccori", "PE"],
  ["Paula Andrade Cevallos", "EC"],
  ["Esteban Villacís Mora", "EC"],
  ["Isabella Pazmiño Loor", "EC"],
  ["Matías Granda Ordóñez", "EC"],
  ["Abril Naranjo Vera", "EC"],
  ["Leonardo Castillo Neira", "CO"],
  ["Regina Ávila Ochoa", "MX"],
  ["Samuel Paz Arguedas", "CR"],
]

const ACTIVIDADES: Actividad[] = [
  { id: "act-reuniones", nombre: "Participar en reuniones", descripcion: "Asistencia a reuniones semanales de la comunidad.", puntosDefecto: 20, puntosVariables: false, activa: true },
  { id: "act-chat", nombre: "Hablar y responder en el chat", descripcion: "Aportes de valor y respuestas en el grupo de Telegram.", puntosDefecto: 5, puntosVariables: false, activa: true },
  { id: "act-pitch", nombre: "Presentar pitch", descripcion: "Presentación de un proyecto o idea ante la comunidad.", puntosDefecto: 50, puntosVariables: false, activa: true },
  { id: "act-desafios", nombre: "Cumplir desafíos", descripcion: "Completar desafíos técnicos o de contenido.", puntosDefecto: 30, puntosVariables: false, activa: true },
  { id: "act-espontanea", nombre: "Espontánea", descripcion: "Reconocimiento por una acción destacada no planificada.", puntosDefecto: 10, puntosVariables: false, activa: true },
  { id: "act-eventos", nombre: "Ir a eventos", descripcion: "Asistencia a meetups, hackathons o conferencias.", puntosDefecto: 30, puntosVariables: false, activa: true },
  { id: "act-organizar", nombre: "Organizar eventos", descripcion: "Organización de un evento local o virtual.", puntosDefecto: 100, puntosVariables: false, activa: true },
  { id: "act-otros", nombre: "Otros", descripcion: "Actividades no contempladas. Puntos a criterio del admin.", puntosDefecto: 15, puntosVariables: true, activa: true },
]

const PESOS_ACTIVIDAD: [string, number][] = [
  ["act-reuniones", 30],
  ["act-chat", 34],
  ["act-pitch", 4],
  ["act-desafios", 12],
  ["act-espontanea", 9],
  ["act-eventos", 7],
  ["act-organizar", 2],
  ["act-otros", 2],
]

const NIVELES: Nivel[] = [
  { id: "niv-explorador", nombre: "Explorador", puntosMinimos: 0, color: "#4FB3C9", icono: "compass", beneficios: ["Acceso al grupo de embajadores", "Kit de bienvenida digital"], orden: 1 },
  { id: "niv-colaborador", nombre: "Colaborador", puntosMinimos: 300, color: "#7B5CF5", icono: "handshake", beneficios: ["Insignia de colaborador", "Acceso a talleres exclusivos"], orden: 2 },
  { id: "niv-creador", nombre: "Creador", puntosMinimos: 800, color: "#F8A73A", icono: "sparkles", beneficios: ["Merch oficial", "Mentorías 1:1", "Prioridad en hackathons"], orden: 3 },
  { id: "niv-lider", nombre: "Líder del ecosistema", puntosMinimos: 1500, color: "#FF4F7B", icono: "crown", beneficios: ["Viaje a evento internacional", "Voz en el comité de la comunidad", "Bono trimestral en XLM"], orden: 4 },
]

const ADMINS: Admin[] = [
  { id: "adm-1", nombre: "Valeria Ríos", email: "valeria@upteam.app", rol: "super_admin" },
  { id: "adm-2", nombre: "Andrés Molina", email: "andres@upteam.app", rol: "admin" },
  { id: "adm-3", nombre: "Carolina Ortega", email: "carolina@upteam.app", rol: "admin" },
]

const NOTAS = ["", "", "", "Gran aporte", "Muy activo esta semana", "Excelente participación", "Gracias por el apoyo", ""]

function elegirPonderado(random: () => number, opciones: [string, number][]) {
  const total = opciones.reduce((s, [, p]) => s + p, 0)
  let r = random() * total
  for (const [valor, peso] of opciones) {
    r -= peso
    if (r <= 0) return valor
  }
  return opciones[0][0]
}

const diasEnMes = (anio: number, mes: number) => new Date(anio, mes, 0).getDate()

export function generarDatosEjemplo(hoy: Date = new Date()): EstadoApp {
  const random = crearRandom(20260117)
  const anioHoy = hoy.getFullYear()
  const mesHoy = hoy.getMonth() + 1
  const diaHoy = hoy.getDate()

  const embajadores: Embajador[] = NOMBRES.map(([nombre, pais], i) => {
    let cumpleMes = 1 + Math.floor(random() * 12)
    let cumpleDia = 1 + Math.floor(random() * 28)
    if (i % 7 === 0 || i === 3) {
      cumpleMes = mesHoy
      const offsets = [0, 2, 5, -6, 9, 14, -2]
      const dia = diaHoy + offsets[Math.floor(i / 7) % offsets.length] + (i === 3 ? 1 : 0)
      cumpleDia = Math.min(Math.max(dia, 1), diasEnMes(anioHoy, mesHoy))
    }
    const [primer, apellido] = nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(" ")
    const mesesAtras = 10 + Math.floor(random() * 14)
    const ingreso = new Date(anioHoy, mesHoy - 1 - mesesAtras, 1 + Math.floor(random() * 27))
    return {
      id: `emb-${String(i + 1).padStart(3, "0")}`,
      nombre,
      pais,
      cumpleDia,
      cumpleMes,
      telegram: random() < 0.85 ? `${primer}_${apellido}${random() < 0.4 ? Math.floor(random() * 90 + 10) : ""}` : null,
      wallet: random() < 0.78 ? generarClavePublicaFalsa(random) : null,
      fechaIngreso: aISOFecha(ingreso),
      estado: i === 37 || i === 39 ? "inactivo" : "activo",
      nivelId: "niv-explorador",
    }
  })

  const movimientos: Movimiento[] = []
  let contador = 1
  embajadores.forEach((emb, i) => {
    const compromiso = 0.25 + random() * 1.5 + (i % 9 === 0 ? 0.8 : 0)
    for (let atras = 9; atras >= 0; atras--) {
      const fechaMes = new Date(anioHoy, mesHoy - 1 - atras, 1)
      const anio = fechaMes.getFullYear()
      const mes = fechaMes.getMonth() + 1
      const maxDia = atras === 0 ? diaHoy : diasEnMes(anio, mes)
      const cantidad = Math.round(compromiso * (2 + random() * 4) * (emb.estado === "inactivo" && atras < 3 ? 0 : 1))
      for (let k = 0; k < cantidad; k++) {
        const actividadId = elegirPonderado(random, PESOS_ACTIVIDAD)
        const actividad = ACTIVIDADES.find((a) => a.id === actividadId)!
        const puntos = actividad.puntosVariables ? 5 + Math.floor(random() * 6) * 5 : actividad.puntosDefecto
        const dia = 1 + Math.floor(random() * maxDia)
        const fecha = aISOFecha(new Date(anio, mes - 1, dia))
        movimientos.push({
          id: `mov-${String(contador++).padStart(5, "0")}`,
          embajadorId: emb.id,
          actividadId,
          puntos,
          fecha,
          nota: NOTAS[Math.floor(random() * NOTAS.length)],
          cargadoPor: ADMINS[Math.floor(random() * ADMINS.length)].id,
          txHash: generarHashFalso(random),
          estadoBlockchain: "confirmado",
          token: "StellarPoints",
          revierteA: null,
          revertidoPor: null,
          creadoEn: `${fecha}T${String(9 + Math.floor(random() * 10)).padStart(2, "0")}:${String(Math.floor(random() * 60)).padStart(2, "0")}:00`,
        })
      }
    }
  })
  movimientos.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))

  const fechaRelativa = (diasAtras: number) => aISOFecha(new Date(anioHoy, mesHoy - 1, diaHoy - diasAtras))
  const conceptos = [
    ["Top 1 del mes", 150, "XLM"],
    ["Mejor pitch del trimestre", 300, "USDC"],
    ["Organización de meetup local", 120, "XLM"],
    ["Ganador desafío técnico", 200, "XLM"],
    ["Top 3 del mes", 80, "XLM"],
    ["Contenido destacado", 50, "USDC"],
    ["Top 1 del mes", 150, "XLM"],
    ["Apoyo en hackathon", 100, "USDC"],
    ["Top 2 del mes", 100, "XLM"],
    ["Bono de liderazgo", 250, "StellarPoints"],
  ] as const
  const premios: Premio[] = conceptos.map(([concepto, monto, moneda], i) => {
    const estado = i < 5 ? "pagado" : i < 7 ? "aprobado" : "pendiente"
    return {
      id: `pre-${String(i + 1).padStart(3, "0")}`,
      embajadorId: embajadores[(i * 7 + 3) % embajadores.length].id,
      concepto,
      monto,
      moneda,
      estado,
      fecha: fechaRelativa(i < 5 ? 170 - i * 32 : 20 - i),
      txHash: estado === "pagado" ? generarHashFalso(random) : null,
    }
  })
  premios.sort((a, b) => b.fecha.localeCompare(a.fecha))

  const bitacora: EntradaBitacora[] = [
    { id: "bit-1", fecha: `${fechaRelativa(1)}T18:22:00`, adminId: "adm-1", accion: "Aprobó premio", entidad: "premio", detalle: "Top 1 del mes" },
    { id: "bit-2", fecha: `${fechaRelativa(2)}T11:05:00`, adminId: "adm-2", accion: "Cargó puntos", entidad: "movimiento", detalle: "12 embajadores · Participar en reuniones" },
    { id: "bit-3", fecha: `${fechaRelativa(4)}T16:40:00`, adminId: "adm-1", accion: "Editó nivel", entidad: "nivel", detalle: "Creador · beneficios actualizados" },
    { id: "bit-4", fecha: `${fechaRelativa(6)}T09:12:00`, adminId: "adm-3", accion: "Cargó puntos", entidad: "movimiento", detalle: "Martina Bianchi Ferreyra · Presentar pitch" },
    { id: "bit-5", fecha: `${fechaRelativa(9)}T13:30:00`, adminId: "adm-1", accion: "Creó embajador", entidad: "embajador", detalle: "Abril Naranjo Vera" },
  ]

  const cuentas: CuentaStellar[] = [
    { tipo: "registro", clavePublica: generarClavePublicaFalsa(random), balanceXLM: 10000, balanceUPT: 0 },
  ]

  return {
    comunidad: {
      id: "com-stellar",
      nombre: "Stellar Comunidad Hispana",
      nombreApp: "Upteam",
      logo: null,
      colorPrimario: "#7B5CF5",
    },
    embajadores,
    actividades: ACTIVIDADES,
    movimientos,
    niveles: NIVELES,
    premios,
    admins: ADMINS,
    bitacora,
    cuentas,
    adminActualId: "adm-1",
  }
}
