import { Fingerprint, ScanLine, Send, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Mission {
  id: number
  title: string
  icon: LucideIcon
  summary: string
  description: string
  objective: string
  notice: string
  action: string
}

// Presentation content only. No client-controlled completion or blockchain evidence.
export const missions: readonly Mission[] = [
  {
    id: 1, title: 'Identidad', icon: Fingerprint,
    summary: 'Tu wallet es tu identidad. El primer paso está en tus manos.',
    description: 'Toda infiltración comienza con una identidad. Tu wallet será la llave de entrada a la cámara Génesis.',
    objective: 'Conectar una wallet compatible con Stellar y comprobar su dirección y configuración en Testnet.',
    notice: 'Solo necesitarás tu dirección pública. Nunca te pediremos claves privadas ni frases de recuperación.',
    action: 'Conectar wallet · Próximamente',
  },
  {
    id: 2, title: 'Prueba criptográfica', icon: ScanLine,
    summary: 'No basta con decir quién eres. Demuestra que tienes el control.',
    description: 'La segunda cerradura necesita una prueba que solo tú puedes crear: una firma con la clave de tu wallet.',
    objective: 'Firmar un reto único con un nonce y fecha de vencimiento. El protocolo comprobará la firma y el mensaje exacto.',
    notice: 'La firma demostrará control de la clave. Este desafío no requiere enviar un pago.',
    action: 'Solicitar firma · Próximamente',
  },
  {
    id: 3, title: 'Transacción Stellar', icon: Send,
    summary: 'Deja tu huella en la red. La última cerradura espera una prueba real.',
    description: 'El último protocolo conectará tu recorrido con la red Stellar. La bóveda solo reconocerá una transacción confirmada.',
    objective: 'Autorizar un envío de XLM de prueba a un destino aprobado y verificar su resultado exitoso en Stellar Testnet.',
    notice: 'Se utilizará exclusivamente Testnet. En esta vista no hay pagos ni hashes de transacciones.',
    action: 'Preparar transacción · Próximamente',
  },
]

export const introduction = [
  { icon: ShieldCheck, label: '01 / EL OBJETIVO', title: 'Hay algo al otro lado.', description: 'La cámara Génesis protege un artefacto digital único. Tres protocolos custodian su acceso. Tu misión: demostrar que mereces cruzar la puerta.' },
  { icon: Fingerprint, label: '02 / EL PLAN', title: 'Tu identidad es la llave.', description: 'Conectarás tu wallet, demostrarás el control de tu clave y autorizarás una transacción en Stellar Testnet. Cada prueba verificada abrirá una cerradura.' },
  { icon: Sparkles, label: '03 / EL ARTEFACTO', title: 'Una huella irrepetible.', description: 'Al completar la operación, el hash de tu transacción dará forma al artefacto Génesis. Por ahora puedes explorar los desafíos; la integración blockchain llegará en la siguiente etapa.' },
] as const
