import { describe, expect, it } from 'vitest'
import {
  type AccountInfo,
  FEE_MARGIN_XLM,
  formatXlm,
  formatXlmExact,
  maxSendable,
  reservedXlm,
} from '@/lib/account'

const cuenta = (available: number): AccountInfo => ({
  funded: true,
  balance: available + 1,
  reserved: 1,
  available,
  tokens: {},
})

/**
 * Intl puede separar con espacios duros según la versión de ICU: se
 * normaliza cualquier espacio para comparar solo dígitos y signos.
 */
const normalizar = (texto: string) => texto.replace(/\s/g, ' ')

describe('reservedXlm', () => {
  it('reserva 1 XLM en una cuenta nueva', () => {
    expect(reservedXlm({ subentries: 0 })).toBe(1)
  })

  it('suma media reserva por cada subentrada', () => {
    expect(reservedXlm({ subentries: 1 })).toBe(1.5)
    expect(reservedXlm({ subentries: 3 })).toBe(2.5)
  })

  it('suma las reservas que patrocina y resta las que le patrocinan', () => {
    expect(reservedXlm({ subentries: 0, sponsoring: 2 })).toBe(2)
    expect(reservedXlm({ subentries: 2, sponsored: 2 })).toBe(1)
    expect(reservedXlm({ subentries: 2, sponsoring: 2, sponsored: 1 })).toBe(
      2.5,
    )
  })

  it('suma los XLM comprometidos en ofertas de venta', () => {
    expect(reservedXlm({ subentries: 0, sellingLiabilities: 10.5 })).toBe(11.5)
    expect(reservedXlm({ subentries: 1, sellingLiabilities: 4 })).toBe(5.5)
  })
})

describe('maxSendable', () => {
  it('devuelve 0 si todavía no hay datos de la cuenta', () => {
    expect(maxSendable(null)).toBe(0)
  })

  it('descuenta el margen de comisión y trunca a dos decimales', () => {
    expect(maxSendable(cuenta(9999))).toBe(9998.99)
  })

  it('trunca en vez de redondear', () => {
    expect(maxSendable(cuenta(1.999))).toBe(1.99)
  })

  it('devuelve 0 si lo disponible es menor al margen', () => {
    expect(maxSendable(cuenta(FEE_MARGIN_XLM / 2))).toBe(0)
    expect(maxSendable(cuenta(0))).toBe(0)
  })
})

describe('formatXlm', () => {
  it('muestra siempre dos decimales con coma', () => {
    expect(normalizar(formatXlm(1))).toBe('1,00')
    expect(normalizar(formatXlm(0.5))).toBe('0,50')
  })

  it('separa los miles con punto', () => {
    expect(normalizar(formatXlm(9999))).toBe('9.999,00')
    expect(normalizar(formatXlm(1234567.891))).toBe('1.234.567,89')
  })

  it('redondea a dos decimales', () => {
    expect(normalizar(formatXlm(0.001))).toBe('0,00')
    expect(normalizar(formatXlm(2.346))).toBe('2,35')
  })
})

describe('formatXlmExact', () => {
  it('muestra al menos dos decimales', () => {
    expect(normalizar(formatXlmExact(1))).toBe('1,00')
    expect(normalizar(formatXlmExact(1234.5))).toBe('1.234,50')
  })

  it('no redondea los montos chicos', () => {
    expect(normalizar(formatXlmExact(0.001))).toBe('0,001')
    expect(normalizar(formatXlmExact(0.0000001))).toBe('0,0000001')
  })

  it('corta en 7 decimales, que es la precisión de Stellar', () => {
    expect(normalizar(formatXlmExact(1.12345678))).toBe('1,1234568')
  })
})
