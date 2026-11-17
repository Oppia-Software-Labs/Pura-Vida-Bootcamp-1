import { Fingerprint, ScanLine, Send, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Mission {
  id: number
  title: string
  navTitle: string
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
    id: 1, title: 'Tu identidad', navTitle: 'Identidad', icon: Fingerprint,
    summary: 'Conecta tu wallet.',
    description: 'Conecta tu wallet: será tu identidad en la bóveda.',
    objective: 'Conectar una wallet y comprobar la cuenta en Stellar Testnet.',
    notice: 'Una wallet es tu cuenta digital. Tu clave privada siempre es tuya.',
    action: 'Conectar wallet',
  },
  {
    id: 2, title: 'Demuestra que eres tú', navTitle: 'Firma', icon: ScanLine,
    summary: 'Demuestra que es tuya.',
    description: 'Firma un mensaje con tu wallet para abrir el segundo sello.',
    objective: 'Verificar la firma de un mensaje único con vencimiento.',
    notice: 'No gastarás XLM.',
    action: 'Firmar mensaje',
  },
  {
    id: 3, title: 'La prueba final', navTitle: 'Operación', icon: Send,
    summary: 'Deja tu huella.',
    description: 'Envía 0,1 XLM de prueba a tu propia cuenta y abre el último sello.',
    objective: 'Enviar XLM de prueba y comprobar su confirmación en Testnet.',
    notice: 'En Testnet no usas dinero real.',
    action: 'Enviar prueba',
  },
]

export const introduction = [
  { icon: ShieldCheck, label: '01', title: 'Conecta tu wallet.', description: 'Tu cuenta digital será tu identidad en la bóveda.' },
  { icon: Fingerprint, label: '02', title: 'Demuestra que es tuya.', description: 'Firma un mensaje. Este paso no envía dinero.' },
  { icon: Sparkles, label: '03', title: 'Abre el último sello.', description: 'Una operación de prueba en Stellar dará forma a tu artefacto. Testnet no usa dinero real.' },
] as const
