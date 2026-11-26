import { describe, expect, it } from 'vitest'
import { TOKENS } from '@/lib/assets'
import { type PaymentJson, toRecord } from '@/lib/history'
import { DEMO_RECIPIENT } from '@/lib/mate'

const YO = DEMO_RECIPIENT
const OTRA = 'GOTRACUENTA'
const USDC = TOKENS[0]

const enUsdc = {
  asset_type: 'credit_alphanum4',
  asset_code: 'USDC',
  asset_issuer: USDC.issuer ?? undefined,
}

const base = {
  id: '123-1',
  created_at: '2026-11-18T12:00:00Z',
  transaction_hash: 'abc123',
}

const pago = (extra: Partial<PaymentJson> = {}): PaymentJson => ({
  ...base,
  type: 'payment',
  asset_type: 'native',
  from: YO,
  to: OTRA,
  amount: '2.5000000',
  ...extra,
})

const alta = (extra: Partial<PaymentJson> = {}): PaymentJson => ({
  ...base,
  type: 'create_account',
  funder: OTRA,
  account: YO,
  starting_balance: '10000.0000000',
  ...extra,
})

describe('toRecord', () => {
  it('convierte un pago nativo enviado', () => {
    expect(toRecord(YO, pago())).toEqual({
      id: '123-1',
      hash: 'abc123',
      direction: 'sent',
      kind: 'payment',
      counterparty: OTRA,
      amount: 2.5,
      asset: 'XLM',
      message: '',
      date: new Date('2026-11-18T12:00:00Z'),
    })
  })

  it('convierte un pago nativo recibido', () => {
    expect(toRecord(YO, pago({ from: OTRA, to: YO }))).toMatchObject({
      direction: 'received',
      kind: 'payment',
      counterparty: OTRA,
      amount: 2.5,
    })
  })

  it('marca como activación recibida la creación de la propia cuenta', () => {
    expect(toRecord(YO, alta())).toMatchObject({
      direction: 'received',
      kind: 'activation',
      counterparty: OTRA,
      amount: 10000,
    })
  })

  it('marca como activación enviada la creación de otra cuenta', () => {
    const record = toRecord(
      YO,
      alta({ funder: YO, account: OTRA, starting_balance: '1.0000000' }),
    )
    expect(record).toMatchObject({
      direction: 'sent',
      kind: 'activation',
      counterparty: OTRA,
      amount: 1,
    })
  })

  it('reconoce un pago en USDC del emisor conocido', () => {
    expect(toRecord(YO, pago(enUsdc))).toMatchObject({
      direction: 'sent',
      amount: 2.5,
      asset: 'USDC',
    })
  })

  it('ignora un "USDC" emitido por otra cuenta', () => {
    const trucho = pago({ ...enUsdc, asset_issuer: OTRA })
    expect(toRecord(YO, trucho)).toBeNull()
  })

  it('ignora los pagos en un activo que no conoce', () => {
    expect(toRecord(YO, pago({ asset_type: 'credit_alphanum4' }))).toBeNull()
  })

  it('lee un pago con conversión igual que uno directo', () => {
    const conversion = pago({ ...enUsdc, type: 'path_payment_strict_receive' })
    expect(toRecord(YO, conversion)).toMatchObject({
      kind: 'payment',
      amount: 2.5,
      asset: 'USDC',
    })
  })

  it('ignora los tipos de operación que no conoce', () => {
    expect(toRecord(YO, { ...base, type: 'account_merge' })).toBeNull()
  })

  it('ignora un registro al que le faltan datos', () => {
    expect(toRecord(YO, pago({ amount: undefined }))).toBeNull()
    expect(toRecord(YO, alta({ funder: undefined }))).toBeNull()
  })

  it('toma el mensaje del memo de texto', () => {
    const record = toRecord(
      YO,
      pago({ transaction: { memo_type: 'text', memo: 'Gracias, che 🧉' } }),
    )
    expect(record?.message).toBe('Gracias, che 🧉')
  })

  it('deja el mensaje vacío si el memo de texto no trae contenido', () => {
    const record = toRecord(YO, pago({ transaction: { memo_type: 'text' } }))
    expect(record?.message).toBe('')
  })

  it('deja el mensaje vacío si el memo no es de texto', () => {
    const conId = toRecord(
      YO,
      pago({ transaction: { memo_type: 'id', memo: '12345' } }),
    )
    const sinMemo = toRecord(YO, pago({ transaction: { memo_type: 'none' } }))
    expect(conId?.message).toBe('')
    expect(sinMemo?.message).toBe('')
  })
})
