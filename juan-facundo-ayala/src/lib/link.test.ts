import { describe, expect, it } from 'vitest'
import { buildMateLink, parseMateLink } from '@/lib/link'
import { DEMO_RECIPIENT } from '@/lib/mate'

const BASE = 'https://mate.example/app/'

const buscar = (params: Record<string, string>) =>
  `?${new URLSearchParams(params).toString()}`

describe('buildMateLink', () => {
  it('arma el link con la dirección en el parámetro para', () => {
    expect(buildMateLink(BASE, DEMO_RECIPIENT)).toBe(
      `${BASE}?para=${DEMO_RECIPIENT}`,
    )
  })

  it('descarta la búsqueda y el hash que traía la URL', () => {
    const link = buildMateLink(
      `${BASE}?monto=5&otra=cosa#seccion`,
      DEMO_RECIPIENT,
    )
    expect(link).toBe(`${BASE}?para=${DEMO_RECIPIENT}`)
  })
})

describe('parseMateLink', () => {
  it('lee de vuelta el link que arma buildMateLink', () => {
    const link = buildMateLink(BASE, DEMO_RECIPIENT)
    expect(parseMateLink(new URL(link).search)).toEqual({
      to: DEMO_RECIPIENT,
      asset: 'XLM',
      amount: '',
      message: '',
    })
  })

  it('lee destinatario, monto y mensaje', () => {
    const search = buscar({
      para: DEMO_RECIPIENT,
      monto: '2,5',
      mensaje: 'Gracias, che 🧉',
    })
    expect(parseMateLink(search)).toEqual({
      to: DEMO_RECIPIENT,
      asset: 'XLM',
      amount: '2,5',
      message: 'Gracias, che 🧉',
    })
  })

  it('recorta los espacios de cada dato', () => {
    const search = buscar({
      para: ` ${DEMO_RECIPIENT} `,
      monto: ' 3 ',
      mensaje: '  hola  ',
    })
    expect(parseMateLink(search)).toEqual({
      to: DEMO_RECIPIENT,
      asset: 'XLM',
      amount: '3',
      message: 'hola',
    })
  })

  it('devuelve null si la dirección no es válida', () => {
    expect(parseMateLink(buscar({ para: 'GNOESUNACUENTA' }))).toBeNull()
    expect(
      parseMateLink(buscar({ para: DEMO_RECIPIENT.slice(0, -1), monto: '5' })),
    ).toBeNull()
  })

  it('devuelve null si no trae parámetros', () => {
    expect(parseMateLink('')).toBeNull()
    expect(parseMateLink('?')).toBeNull()
    expect(parseMateLink('?monto=5&mensaje=hola')).toBeNull()
  })

  it('descarta un monto inválido pero conserva el resto', () => {
    for (const monto of ['abc', '-1', '0', '1e3', '1.000,50', '0.00000001']) {
      expect(
        parseMateLink(buscar({ para: DEMO_RECIPIENT, monto, mensaje: 'hola' })),
      ).toEqual({
        to: DEMO_RECIPIENT,
        asset: 'XLM',
        amount: '',
        message: 'hola',
      })
    }
  })

  it('descarta un mensaje de más de 28 bytes', () => {
    const search = buscar({
      para: DEMO_RECIPIENT,
      monto: '1',
      mensaje: 'a'.repeat(29),
    })
    expect(parseMateLink(search)).toEqual({
      to: DEMO_RECIPIENT,
      asset: 'XLM',
      amount: '1',
      message: '',
    })
  })

  it('acepta un mensaje de exactamente 28 bytes', () => {
    const mensaje = 'ñ'.repeat(14)
    const link = parseMateLink(buscar({ para: DEMO_RECIPIENT, mensaje }))
    expect(link?.message).toBe(mensaje)
  })

  it('descarta un mensaje corto en letras pero largo en bytes', () => {
    const link = parseMateLink(
      buscar({ para: DEMO_RECIPIENT, mensaje: '🧉'.repeat(8) }),
    )
    expect(link?.message).toBe('')
  })

  it('lee el activo pedido, sin importar mayúsculas', () => {
    const search =
      '?' + new URLSearchParams({ para: DEMO_RECIPIENT, activo: 'usdc' })
    expect(parseMateLink(search)?.asset).toBe('USDC')
  })

  it('usa XLM si el activo pedido no es uno conocido', () => {
    const search =
      '?' + new URLSearchParams({ para: DEMO_RECIPIENT, activo: 'DOGE' })
    expect(parseMateLink(search)?.asset).toBe('XLM')
  })
})
