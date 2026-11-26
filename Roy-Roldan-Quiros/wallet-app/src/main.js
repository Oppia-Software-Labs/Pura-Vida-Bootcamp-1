import './style.css'
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'

StellarWalletsKit.init({
  network: Networks.TESTNET,
  modules: defaultModules(),
})

async function getXlmBalance(address) {
  const url = `https://horizon-testnet.stellar.org/accounts/${encodeURIComponent(address)}`
  const response = await fetch(url)

  if (response.status === 404) {
    throw new Error('La cuenta no existe en Testnet o todavía no está financiada.')
  }
  if (!response.ok) {
    throw new Error(`Error de Horizon: ${response.status}`)
  }

  const account = await response.json()
  const nativeBalance = account.balances.find(
    (balance) => balance.asset_type === 'native'
  )?.balance

  if (nativeBalance === undefined) {
    throw new Error('La respuesta no contiene el balance nativo de XLM.')
  }
  return nativeBalance
}

document.querySelector('#app').innerHTML = `
  <h1>Mi primera app en Stellar</h1>
  <span class="network">Red: Testnet</span>
  <div><button id="connect">Conectar wallet</button></div>
  <div class="card" id="status">Sin conectar</div>
`

document.querySelector('#connect').addEventListener('click', async () => {
  const status = document.querySelector('#status')
  try {
    const { address } = await StellarWalletsKit.authModal()
    status.textContent = `Conectado: ${address}\nConsultando balance...`

    const xlm = await getXlmBalance(address)
    status.textContent = `Conectado: ${address}\nBalance: ${xlm} XLM`
  } catch (error) {
    status.textContent = `Error: ${error.message}`
    console.error(error)
  }
})