import { describe, expect, it } from 'vitest'
import {
  ASSETS,
  getAsset,
  matchAsset,
  TOKENS,
  toSdkAsset,
  XLM,
} from '@/lib/assets'

const USDC = TOKENS[0]

describe('assets', () => {
  it('ofrece XLM y USDC, en ese orden', () => {
    expect(ASSETS.map((asset) => asset.code)).toEqual(['XLM', 'USDC'])
  })

  it('XLM es el único activo sin emisor', () => {
    expect(XLM.issuer).toBeNull()
    expect(TOKENS.every((asset) => asset.issuer !== null)).toBe(true)
  })

  it('busca un activo por su código', () => {
    expect(getAsset('USDC')?.name).toBe('Dólar digital')
    expect(getAsset('DOGE')).toBeUndefined()
  })

  it('convierte al formato del SDK', () => {
    expect(toSdkAsset(XLM).isNative()).toBe(true)
    expect(toSdkAsset(USDC).getCode()).toBe('USDC')
    expect(toSdkAsset(USDC).getIssuer()).toBe(USDC.issuer)
  })
})

describe('matchAsset', () => {
  it('reconoce el activo nativo', () => {
    expect(matchAsset({ asset_type: 'native' })).toBe(XLM)
  })

  it('reconoce un activo por código y emisor', () => {
    const json = { asset_code: 'USDC', asset_issuer: USDC.issuer ?? '' }
    expect(matchAsset(json)).toBe(USDC)
  })

  it('no confunde un activo con el mismo código y otro emisor', () => {
    expect(
      matchAsset({ asset_code: 'USDC', asset_issuer: 'GOTROEMISOR' }),
    ).toBeUndefined()
  })
})
