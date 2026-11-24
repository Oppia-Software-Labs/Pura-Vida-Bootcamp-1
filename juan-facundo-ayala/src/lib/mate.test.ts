import { Keypair } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import {
  DEMO_RECIPIENT,
  horizonErrorMessage,
  isAmountTooLarge,
  isValidAddress,
  MEMO_MAX_BYTES,
  memoBytes,
  parseAmount,
} from '@/lib/mate'

/** Arma un error con la forma que devuelve Horizon al rechazar un envío. */
const rechazo = (result_codes: {
  transaction?: string
  operations?: string[]
}) => ({ response: { data: { extras: { result_codes } } } })

const GENERICO = 'La red rechazó la transacción. Probá de nuevo.'

describe('memoBytes', () => {
  it('cuenta un byte por cada letra sin tilde', () => {
    expect(memoBytes('')).toBe(0)
    expect(memoBytes('mate')).toBe(4)
  })

  it('cuenta dos bytes por cada vocal con tilde', () => {
    expect(memoBytes('á')).toBe(2)
    expect(memoBytes('café')).toBe(5)
  })

  it('cuenta dos bytes por la ñ', () => {
    expect(memoBytes('ñ')).toBe(2)
    expect(memoBytes('mañana')).toBe(7)
  })

  it('cuenta cuatro bytes por un emoji', () => {
    expect(memoBytes('🧉')).toBe(4)
    expect(memoBytes('mate 🧉')).toBe(9)
  })

  it('distingue el borde de los 28 bytes del memo', () => {
    expect(memoBytes('a'.repeat(28))).toBe(MEMO_MAX_BYTES)
    expect(memoBytes('a'.repeat(29))).toBeGreaterThan(MEMO_MAX_BYTES)
    // 14 letras de dos bytes ya ocupan los 28 bytes.
    expect(memoBytes('ñ'.repeat(14))).toBe(MEMO_MAX_BYTES)
    expect(memoBytes('ñ'.repeat(14) + 'a')).toBeGreaterThan(MEMO_MAX_BYTES)
  })
})

describe('isValidAddress', () => {
  it('acepta la cuenta de demostración', () => {
    expect(isValidAddress(DEMO_RECIPIENT)).toBe(true)
  })

  it('acepta una clave pública recién generada', () => {
    expect(isValidAddress(Keypair.random().publicKey())).toBe(true)
  })

  it('rechaza una clave secreta', () => {
    const secreta = Keypair.random().secret()
    expect(secreta.startsWith('S')).toBe(true)
    expect(isValidAddress(secreta)).toBe(false)
  })

  it('rechaza una dirección con el checksum roto', () => {
    const letra = DEMO_RECIPIENT[10] === 'A' ? 'B' : 'A'
    const rota = DEMO_RECIPIENT.slice(0, 10) + letra + DEMO_RECIPIENT.slice(11)
    expect(rota).toHaveLength(DEMO_RECIPIENT.length)
    expect(isValidAddress(rota)).toBe(false)
  })

  it('rechaza una dirección incompleta', () => {
    expect(isValidAddress(DEMO_RECIPIENT.slice(0, -1))).toBe(false)
  })

  it('rechaza el texto vacío', () => {
    expect(isValidAddress('')).toBe(false)
  })
})

describe('parseAmount', () => {
  it('acepta un entero', () => {
    expect(parseAmount('5')).toBe(5)
    expect(parseAmount('100')).toBe(100)
  })

  it('acepta decimales con coma', () => {
    expect(parseAmount('1,5')).toBe(1.5)
  })

  it('acepta decimales con punto', () => {
    expect(parseAmount('1.5')).toBe(1.5)
  })

  it('acepta hasta 7 decimales', () => {
    expect(parseAmount('0.0000001')).toBe(0.0000001)
    expect(parseAmount('1,1234567')).toBe(1.1234567)
  })

  it('acepta hasta el máximo y rechaza lo que lo pasa', () => {
    expect(parseAmount('100000000')).toBe(100_000_000)
    expect(parseAmount('100000000,0000001')).toBeNull()
    expect(parseAmount('9999999999999')).toBeNull()
  })

  it('distingue un monto demasiado grande de uno mal escrito', () => {
    expect(isAmountTooLarge('9999999999999')).toBe(true)
    expect(isAmountTooLarge('100000000')).toBe(false)
    expect(isAmountTooLarge('abc')).toBe(false)
  })

  it('rechaza 8 decimales', () => {
    expect(parseAmount('0.00000001')).toBeNull()
    expect(parseAmount('1,12345678')).toBeNull()
  })

  it('rechaza la notación científica', () => {
    expect(parseAmount('1e3')).toBeNull()
  })

  it('rechaza la notación hexadecimal', () => {
    expect(parseAmount('0x10')).toBeNull()
  })

  it('rechaza un monto negativo', () => {
    expect(parseAmount('-1')).toBeNull()
  })

  it('rechaza el cero', () => {
    expect(parseAmount('0')).toBeNull()
    expect(parseAmount('0,00')).toBeNull()
  })

  it('rechaza el texto vacío', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('   ')).toBeNull()
  })

  it('rechaza un monto con separador de miles', () => {
    expect(parseAmount('1.000,50')).toBeNull()
  })

  it('rechaza texto que no es un número', () => {
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('d')).toBeNull()
    expect(parseAmount('1,')).toBeNull()
    expect(parseAmount(',5')).toBeNull()
  })

  it('ignora los espacios de alrededor', () => {
    expect(parseAmount('  2,5  ')).toBe(2.5)
  })
})

describe('horizonErrorMessage', () => {
  it.each([
    ['op_underfunded', 'No te alcanza el saldo para ese monto.'],
    ['op_no_destination', 'La cuenta de destino no existe en la red.'],
    [
      'op_low_reserve',
      'No te alcanzan los XLM: una parte queda como reserva de la cuenta.',
    ],
    ['op_no_trust', 'La cuenta de destino no habilitó ese activo.'],
    ['op_too_few_offers', 'En este momento nadie cambia XLM por ese activo.'],
    ['op_already_exists', 'La cuenta de destino ya existe. Probá de nuevo.'],
  ])('traduce el código de operación %s', (codigo, mensaje) => {
    expect(
      horizonErrorMessage(
        rechazo({ transaction: 'tx_failed', operations: [codigo] }),
      ),
    ).toBe(mensaje)
  })

  it.each([
    [
      'tx_insufficient_balance',
      'No te alcanza el saldo para pagar la comisión.',
    ],
    ['tx_bad_seq', 'La transacción quedó desactualizada. Probá de nuevo.'],
    ['tx_too_late', 'La transacción venció antes de enviarse. Probá de nuevo.'],
    ['tx_bad_auth', 'La firma no corresponde a esta cuenta o a esta red.'],
  ])('traduce el código de transacción %s', (codigo, mensaje) => {
    expect(horizonErrorMessage(rechazo({ transaction: codigo }))).toBe(mensaje)
  })

  it('prioriza el código de la operación sobre el de la transacción', () => {
    expect(
      horizonErrorMessage(
        rechazo({ transaction: 'tx_bad_seq', operations: ['op_underfunded'] }),
      ),
    ).toBe('No te alcanza el saldo para ese monto.')
  })

  it('saltea las operaciones exitosas hasta encontrar la que falló', () => {
    expect(
      horizonErrorMessage(
        rechazo({
          transaction: 'tx_failed',
          operations: ['op_success', 'op_underfunded'],
        }),
      ),
    ).toBe('No te alcanza el saldo para ese monto.')
  })

  it('devuelve el mensaje genérico ante un código desconocido', () => {
    expect(
      horizonErrorMessage(
        rechazo({ transaction: 'tx_failed', operations: ['op_malformed'] }),
      ),
    ).toBe(GENERICO)
    expect(horizonErrorMessage(rechazo({}))).toBe(GENERICO)
  })

  it('devuelve texto vacío si el error no trae result_codes', () => {
    expect(horizonErrorMessage(new Error('Network Error'))).toBe('')
    expect(horizonErrorMessage({ response: { data: {} } })).toBe('')
    expect(horizonErrorMessage(null)).toBe('')
    expect(horizonErrorMessage(undefined)).toBe('')
    expect(horizonErrorMessage('boom')).toBe('')
  })
})
