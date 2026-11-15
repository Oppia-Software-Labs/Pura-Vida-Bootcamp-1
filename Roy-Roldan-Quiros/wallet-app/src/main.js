import './style.css'
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'

// 1. Iniciar el kit apuntando a la red de pruebas (testnet)
StellarWalletsKit.init({
  network: Networks.TESTNET,
  modules: defaultModules(),
})

// 2. Dibujar la interfaz
document.querySelector('#app').innerHTML = `
  <h1>Mi primera app en Stellar</h1>
  <p>Red: Testnet</p>
  <button id="connect">Conectar wallet</button>
  <p id="status">Sin conectar</p>
`

// 3. Qué pasa al hacer clic en el botón
document.querySelector('#connect').addEventListener('click', async () => {
  const status = document.querySelector('#status')
  try {
    const { address } = await StellarWalletsKit.authModal()
    status.textContent = `Conectado: ${address}`
  } catch (error) {
    status.textContent = 'No se pudo conectar'
    console.error(error)
  }
})