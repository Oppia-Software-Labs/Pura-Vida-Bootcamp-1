const STORAGE_KEY = 'stellar-savings-goals-v1'
const SCALE = 10_000_000n

function stroopsToDecimal(stroops) {
  const whole = stroops / SCALE
  const fraction = (stroops % SCALE).toString().padStart(7, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

function decimalToStroops(text) {
  if (!/^\d+(\.\d+)?$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  const padded = (fraction + '0000000').slice(0, 7)
  return BigInt(whole) * SCALE + BigInt(padded)
}

export function parseAmount(raw) {
  const trimmed = String(raw ?? '').trim().replace(',', '.')
  if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) return null
  const stroops = decimalToStroops(trimmed)
  if (stroops === null || stroops <= 0n) return null
  return stroopsToDecimal(stroops)
}

export function sumAmounts(amounts) {
  const total = amounts.reduce((sum, amount) => sum + (decimalToStroops(amount) ?? 0n), 0n)
  return stroopsToDecimal(total)
}

export function progressPercent(total, target) {
  const saved = decimalToStroops(total) ?? 0n
  const goal = decimalToStroops(target) ?? 0n
  if (goal <= 0n || saved <= 0n) return '0'
  const scaled = (saved * 1_000_000_000n) / goal
  if (scaled === 0n) return '< 0.0000001'
  const whole = scaled / 10_000_000n
  const fraction = (scaled % 10_000_000n).toString().padStart(7, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export function visualPercent(total, target) {
  const label = progressPercent(total, target)
  if (label.startsWith('<')) return 0
  const value = Number(label)
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(value, 100)
}

function normalizeAmount(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    const text = value.toFixed(7).replace(/\.?0+$/, '')
    return parseAmount(text)
  }
  if (typeof value === 'string') return parseAmount(value)
  return null
}

function normalizeDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return value
}

function normalizeContribution(value) {
  if (!value || typeof value !== 'object') return []
  if (typeof value.id !== 'string' || value.id.length === 0) return []
  const amount = normalizeAmount(value.amount)
  const date = normalizeDate(value.date)
  if (!amount || !date) return []
  return [{ id: value.id, amount, date }]
}

function normalizeGoal(value) {
  if (!value || typeof value !== 'object') return []
  if (typeof value.id !== 'string' || value.id.length === 0) return []
  if (typeof value.name !== 'string' || value.name.trim().length === 0) return []
  const target = normalizeAmount(value.target)
  if (!target) return []

  const seen = new Set()
  const contributions = []
  if (Array.isArray(value.contributions)) {
    for (const item of value.contributions) {
      const [entry] = normalizeContribution(item)
      if (!entry || seen.has(entry.id)) continue
      seen.add(entry.id)
      contributions.push(entry)
    }
  }

  return [{ id: value.id, name: value.name.trim(), target, contributions }]
}

export function loadGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap(normalizeGoal)
  } catch {
    return []
  }
}

export function saveGoals(goals) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  } catch {
    /* storage full or blocked */
  }
}

export { STORAGE_KEY }
