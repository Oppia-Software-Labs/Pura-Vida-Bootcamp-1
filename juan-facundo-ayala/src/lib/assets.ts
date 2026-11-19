import { Asset } from '@stellar/stellar-sdk'

export type AssetCode = 'XLM' | 'USDC'

export type MateAsset = {
  code: AssetCode
  name: string
  /** Cuenta emisora; null para XLM, que es el activo nativo de la red. */
  issuer: string | null
}

// En Stellar un activo se identifica por código Y emisor: cualquiera puede
// emitir algo llamado "USDC". Por eso la app solo acepta activos con emisor
// verificado. El de USDC es el de Circle en Testnet, tal como figura en la
// documentación oficial de Stellar (consultada con Raven).
export const ASSETS: MateAsset[] = [
  { code: 'XLM', name: 'Lumens', issuer: null },
  {
    code: 'USDC',
    name: 'Dólar digital',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  },
]

export const XLM = ASSETS[0]

/** Los activos que hay que habilitar (trustline) antes de poder recibirlos. */
export const TOKENS = ASSETS.filter((asset) => asset.issuer !== null)

export const getAsset = (code: string): MateAsset | undefined =>
  ASSETS.find((asset) => asset.code === code)

export const toSdkAsset = (asset: MateAsset): Asset =>
  asset.issuer === null ? Asset.native() : new Asset(asset.code, asset.issuer)

/** Forma en que Horizon describe un activo dentro de un saldo o un pago. */
type HorizonAsset = {
  asset_type?: string
  asset_code?: string
  asset_issuer?: string
}

/**
 * Reconoce un activo de Horizon solo si coincide código y emisor. Así un
 * "USDC" emitido por otra cuenta no se confunde con el de Circle.
 */
export function matchAsset(json: HorizonAsset): MateAsset | undefined {
  if (json.asset_type === 'native') return XLM
  return TOKENS.find(
    (asset) =>
      asset.code === json.asset_code && asset.issuer === json.asset_issuer,
  )
}
