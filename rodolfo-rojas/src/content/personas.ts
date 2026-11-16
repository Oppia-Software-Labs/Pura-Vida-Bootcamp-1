export type PersonaId = 'abuelita' | 'rapero' | 'ingeniera'

export type Persona = {
  id: PersonaId
  emoji: string
  name: string
  audience: string
}

export const PERSONAS: Persona[] = [
  { id: 'abuelita', emoji: '👵', name: 'La abuelita', audience: 'Nunca escuché de cripto' },
  { id: 'rapero', emoji: '🎤', name: 'El rapero', audience: 'Dámelo corto y con ritmo' },
  { id: 'ingeniera', emoji: '🛠️', name: 'La product engineer', audience: 'Soy dev, enseñame el código' },
]
