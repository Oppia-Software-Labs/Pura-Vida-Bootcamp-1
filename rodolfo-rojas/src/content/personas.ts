export type PersonaId = 'abuelita' | 'rapero' | 'dev'

export type Persona = {
  id: PersonaId
  name: string
  short: string
  avatarAlt: string
  blurb: string
  greeting: string
}

export const PERSONAS: Persona[] = [
  {
    id: 'abuelita',
    name: 'La abuelita',
    short: 'Abuelita',
    avatarAlt: 'Abuelita en pixel art con moño gris, anteojos y chal azul',
    blurb: 'Nunca escuchó de cripto. Te lo explica con la pulpería, el bus y el SINPE.',
    greeting: 'Venga, mijo, siéntese. Primero abramos su monedero y después le cuento todo con calma.',
  },
  {
    id: 'rapero',
    name: 'El rapero',
    short: 'Rapero',
    avatarAlt: 'Rapero en pixel art con gorra azul, lentes oscuros y cadena dorada',
    blurb: 'Corto, con rima y con ritmo. Si no rima, no se te queda.',
    greeting: 'Conectá la wallet, que sin monedero no hay flow.\nDespués te tiro los 8 versos.',
  },
  {
    id: 'dev',
    name: 'La desarrolladora',
    short: 'Desarrolladora',
    avatarAlt: 'Desarrolladora en pixel art con audífonos azules, anteojos y hoodie',
    blurb: 'La comparación simple primero y después el código real del SDK.',
    greeting: 'Conectá tu wallet en testnet: la vamos a usar para firmar transacciones reales sin plata real.',
  },
]

export function personaById(id: PersonaId): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0]
}
