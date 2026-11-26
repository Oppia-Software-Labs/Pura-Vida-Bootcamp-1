import type { VerifiedPayment } from '../stellar/payment'
import { artifactAppearance } from './artifact'

/** Export only on a user action. No network, fonts, wallet signatures or secrets. */
export async function downloadRewardCard(receipt: VerifiedPayment) {
  const appearance = artifactAppearance(receipt.transactionHash)
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 630
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.fillStyle = '#080c17'; ctx.fillRect(0, 0, 1200, 630)
  const glow = ctx.createRadialGradient(910, 280, 10, 910, 280, 310)
  glow.addColorStop(0, `hsla(${appearance.hue},65%,60%,.22)`); glow.addColorStop(1, '#080c17')
  ctx.fillStyle = glow; ctx.fillRect(650, 0, 550, 630)
  ctx.save(); ctx.translate(920, 290); ctx.rotate(appearance.rotation)
  ctx.strokeStyle = `hsl(${appearance.hue},65%,70%)`; ctx.lineWidth = 2
  const count = appearance.detail ? 8 : 6
  for (let ring = 0; ring < 3; ring++) {
    ctx.beginPath()
    for (let i = 0; i <= count; i++) {
      const angle = i / count * Math.PI * 2 + ring * 0.18
      const radius = 95 + ring * 35
      const x = Math.cos(angle) * radius; const y = Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      ctx.lineTo(0, 0); ctx.moveTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
  ctx.fillStyle = '#c9b4ef'; ctx.font = '600 22px sans-serif'; ctx.fillText('STELLAR HEIST', 70, 90)
  ctx.fillStyle = '#9dacc0'; ctx.font = '16px sans-serif'; ctx.fillText('THE GENESIS VAULT', 70, 124)
  ctx.fillStyle = '#edf0f9'; ctx.font = '500 66px sans-serif'; ctx.fillText('Génesis es tuyo.', 70, 250)
  ctx.fillStyle = '#a4e6cd'; ctx.font = '24px sans-serif'; ctx.fillText('3 sellos · Operación confirmada en Testnet', 70, 310)
  ctx.fillStyle = '#a9b5c9'; ctx.font = '18px sans-serif'; ctx.fillText(`Ledger ${receipt.ledger} · ${new Date(receipt.createdAt * 1000).toISOString().slice(0, 10)}`, 70, 360)
  ctx.fillStyle = '#a9b5c9'; ctx.font = '16px monospace'; ctx.fillText('TRANSACCIÓN', 70, 485)
  ctx.fillStyle = '#d8dff0'; ctx.fillText(receipt.transactionHash, 70, 520)
  ctx.fillStyle = '#7b8ba4'; ctx.font = '16px sans-serif'; ctx.fillText('Logro educativo · Sin valor monetario · Verificable en Stellar Expert / Testnet', 70, 570)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Export failed')), 'image/png'))
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a'); link.href = url; link.download = `stellar-heist-${receipt.transactionHash.slice(0, 12)}.png`; link.click()
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
}
