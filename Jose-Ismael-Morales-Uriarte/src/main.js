import './style.css'
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'

StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
})

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'

document.querySelector('#app').innerHTML = `
  <section style="text-align:center; padding:2rem;">
    <h1>Mi primera app en Stellar</h1>
    <p>un wallet para empezar.</p>
    <button id="connect">Conectar wallet</button>
    <button id="disconnect" style="display:none;">Desconectar</button>
    <p id="status"></p>
    <p id="balance"></p>
  </section>
`

const connectBtn = document.querySelector('#connect')
const disconnectBtn = document.querySelector('#disconnect')
const status = document.querySelector('#status')
const balanceEl = document.querySelector('#balance')

// Pide a Horizon el balance de XLM, pero Devuelve null si la cuenta no existe en testnet, (en teoria xd).
async function getXlmBalance(address) {
  const response = await fetch(`${HORIZON_TESTNET}/accounts/${address}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Error al consultar el balance')
  const data = await response.json()
  const xlm = data.balances.find((b) => b.asset_type === 'native')
  return xlm ? xlm.balance : '0'
}

connectBtn.addEventListener('click', async () => {
  try {
    const { address } = await StellarWalletsKit.authModal()
    status.textContent = `Wallet conectada: ${address}`
    connectBtn.style.display = 'none'
    disconnectBtn.style.display = 'inline-block'

    balanceEl.textContent = 'Consultando balance...'
    try {
      const balance = await getXlmBalance(address)
      if (balance === null) {
        balanceEl.innerHTML =
          'Tu cuenta aún no existe en testnet. Fondéala gratis en ' +
          '<a href="https://lab.stellar.org/account/fund" target="_blank">Stellar Lab</a> ' +
          'y vuelve a conectar.'
      } else {
        balanceEl.textContent = `Balance (testnet): ${balance} XLM`
      }
    } catch (error) {
      balanceEl.textContent = 'No se pudo consultar el balance.'
      console.error(error)
    }
  } catch (error) {
    status.textContent = 'No se pudo conectar la wallet.'
    console.error(error)
  }
})

disconnectBtn.addEventListener('click', async () => {
  await StellarWalletsKit.disconnect()
  status.textContent = ''
  balanceEl.textContent = ''
  connectBtn.style.display = 'inline-block'
  disconnectBtn.style.display = 'none'
})