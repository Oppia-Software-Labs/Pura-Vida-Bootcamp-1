import {
  Account,
  Keypair,
  Networks,
  NotFoundError,
  type Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAsset, XLM } from '@/lib/assets'
import { horizon } from '@/lib/config'
import {
  buildMateTx,
  MateError,
  maxCost,
  YERBA_FUND,
  yerbaShare,
} from '@/lib/mate'

// Horizon se reemplaza por un doble: estos tests no salen a la red.
vi.mock('@/lib/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/config')>()),
  horizon: { loadAccount: vi.fn(), strictReceivePaths: vi.fn() },
}))

const USDC = getAsset('USDC')!
const FROM = Keypair.random().publicKey()
const TO = Keypair.random().publicKey()

type Saldo = Record<string, string>
const xlm = (balance: string): Saldo => ({ asset_type: 'native', balance })
const usdc = (balance: string): Saldo => ({
  asset_type: 'credit_alphanum4',
  asset_code: USDC.code,
  asset_issuer: USDC.issuer!,
  balance,
})

/** Define qué cuentas existen en la red simulada y con qué saldos. */
function red(cuentas: Record<string, Saldo[]>) {
  vi.mocked(horizon.loadAccount).mockImplementation(async (address) => {
    const balances = cuentas[address]
    if (!balances) throw new NotFoundError('no existe', {})
    return Object.assign(new Account(address, '1'), { balances }) as never
  })
}

/** Define las ofertas de cambio que devuelve la cotización. */
function ofertas(records: { source_amount: string; path: object[] }[]) {
  vi.mocked(horizon.strictReceivePaths).mockReturnValue({
    call: async () => ({ records }),
  } as never)
}

const operaciones = (xdr: string) =>
  TransactionBuilder.fromXDR(xdr, Networks.TESTNET).operations

const mate = (extra: Partial<Parameters<typeof buildMateTx>[0]> = {}) =>
  buildMateTx({
    from: FROM,
    to: TO,
    asset: XLM,
    amount: 2,
    message: '',
    ...extra,
  })

beforeEach(() => {
  vi.mocked(horizon.loadAccount).mockReset()
  vi.mocked(horizon.strictReceivePaths).mockReset()
})

describe('yerbaShare', () => {
  it('calcula el 5 % del monto', () => {
    expect(yerbaShare(10)).toBe(0.5)
    expect(yerbaShare(2)).toBe(0.1)
  })

  it('redondea a los 7 decimales de Stellar', () => {
    expect(yerbaShare(1.2345678)).toBe(0.0617284)
    expect(yerbaShare(0.0000001)).toBe(0)
  })
})

describe('maxCost', () => {
  it('suma el 1 % de margen a la cotización', () => {
    expect(maxCost(100)).toBeCloseTo(101, 7)
  })
})

describe('buildMateTx', () => {
  it('XLM a una cuenta que existe: un pago', async () => {
    red({ [FROM]: [xlm('100')], [TO]: [xlm('5')] })
    const ops = operaciones(await mate())
    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      type: 'payment',
      destination: TO,
      amount: '2.0000000',
      asset: { code: 'XLM' },
    })
  })

  it('XLM a una cuenta que no existe: la crea con ese monto', async () => {
    red({ [FROM]: [xlm('100')] })
    const ops = operaciones(await mate({ amount: 1 }))
    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      type: 'createAccount',
      destination: TO,
      startingBalance: '1.0000000',
    })
  })

  it('no crea una cuenta con menos de 1 XLM', async () => {
    red({ [FROM]: [xlm('100')] })
    const intento = mate({ amount: 0.5 })
    await expect(intento).rejects.toBeInstanceOf(MateError)
    await expect(intento).rejects.toThrow('al menos 1 XLM')
  })

  it('no envía USDC a una cuenta que no existe', async () => {
    red({ [FROM]: [xlm('100'), usdc('50')] })
    await expect(mate({ asset: USDC })).rejects.toThrow('todavía no existe')
  })

  it('no envía USDC si el destino no lo habilitó', async () => {
    red({ [FROM]: [xlm('100'), usdc('50')], [TO]: [xlm('5')] })
    await expect(mate({ asset: USDC })).rejects.toThrow('no habilitó USDC')
  })

  it('no toma por USDC un activo con el mismo código y otro emisor', async () => {
    const otro = { ...usdc('0'), asset_issuer: Keypair.random().publicKey() }
    red({ [FROM]: [xlm('100'), usdc('50')], [TO]: [xlm('5'), otro] })
    await expect(mate({ asset: USDC })).rejects.toThrow('no habilitó USDC')
  })

  it('USDC con saldo suficiente: un pago en USDC', async () => {
    red({ [FROM]: [xlm('100'), usdc('50')], [TO]: [xlm('5'), usdc('0')] })
    const ops = operaciones(await mate({ asset: USDC }))
    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      type: 'payment',
      destination: TO,
      amount: '2.0000000',
      asset: { code: 'USDC', issuer: USDC.issuer },
    })
    expect(horizon.strictReceivePaths).not.toHaveBeenCalled()
  })

  it('USDC sin saldo: paga con XLM a la mejor cotización más el margen', async () => {
    red({ [FROM]: [xlm('100')], [TO]: [xlm('5'), usdc('0')] })
    ofertas([
      { source_amount: '12.0000000', path: [] },
      { source_amount: '10.0000000', path: [] },
    ])
    const ops = operaciones(await mate({ asset: USDC }))
    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      type: 'pathPaymentStrictReceive',
      destination: TO,
      sendAsset: { code: 'XLM' },
      sendMax: '10.1000000',
      destAmount: '2.0000000',
      destAsset: { code: 'USDC', issuer: USDC.issuer },
    })
  })

  it('USDC sin saldo y sin ofertas: avisa antes de firmar', async () => {
    red({ [FROM]: [xlm('100')], [TO]: [xlm('5'), usdc('0')] })
    ofertas([])
    await expect(mate({ asset: USDC })).rejects.toThrow('nadie lo cambia')
  })

  it('con aporte: suma un segundo pago del 5 % al fondo', async () => {
    red({ [FROM]: [xlm('100')], [TO]: [xlm('5')], [YERBA_FUND]: [xlm('5')] })
    const ops = operaciones(await mate({ amount: 10, withYerba: true }))
    expect(ops).toHaveLength(2)
    expect(ops[0]).toMatchObject({ type: 'payment', destination: TO })
    expect(ops[1]).toMatchObject({
      type: 'payment',
      destination: YERBA_FUND,
      amount: '0.5000000',
    })
  })

  it('con aporte: el USDC usado en el mate no cuenta para el aporte', async () => {
    red({
      [FROM]: [xlm('100'), usdc('10')],
      [TO]: [xlm('5'), usdc('0')],
      [YERBA_FUND]: [xlm('5'), usdc('0')],
    })
    ofertas([{ source_amount: '3.0000000', path: [] }])
    const ops = operaciones(
      await mate({ asset: USDC, amount: 10, withYerba: true }),
    )
    expect(ops.map((op) => op.type)).toEqual([
      'payment',
      'pathPaymentStrictReceive',
    ])
    expect(ops[1]).toMatchObject({
      destination: YERBA_FUND,
      destAmount: '0.5000000',
    })
  })

  it('no suma aporte cuando el mate ya va al fondo', async () => {
    red({ [FROM]: [xlm('100')], [YERBA_FUND]: [xlm('5')] })
    const ops = operaciones(await mate({ to: YERBA_FUND, withYerba: true }))
    expect(ops).toHaveLength(1)
  })

  it('el mensaje viaja como memo de texto', async () => {
    red({ [FROM]: [xlm('100')], [TO]: [xlm('5')] })
    const tx = TransactionBuilder.fromXDR(
      await mate({ message: '  gracias  ' }),
      Networks.TESTNET,
    ) as Transaction
    expect(tx.memo.type).toBe('text')
    expect(new TextDecoder().decode(tx.memo.value as Uint8Array)).toBe(
      'gracias',
    )
  })
})
