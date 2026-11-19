import { getNetwork, isConnected, requestAccess } from '@stellar/freighter-api'
import { formatBalance, isTestnet, loadAccount, shortAddress } from './account.js'
import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="page-shell">
    <header class="topbar">
      <a class="brand" href="#inicio" aria-label="Stellar Vista, inicio">
        <span class="brand-mark">✳</span><span>stellar<span class="brand-accent">vista</span></span>
      </a>
      <span class="network-pill"><span class="pulse"></span> TESTNET</span>
    </header>

    <main id="inicio">
      <div class="intro-label"><span class="line"></span> TU ESPACIO EN LA RED ESTELAR</div>
      <h1>Tu cuenta Stellar,<br /><em>sin complicaciones.</em></h1>
      <p class="lead">Conecta tu wallet para explorar tu dirección y saldo en la red de pruebas. Sin claves privadas, sin transacciones.</p>

      <section class="dashboard" aria-labelledby="wallet-title">
        <div class="card-head">
          <div class="card-icon" aria-hidden="true">✦</div>
          <div><div class="eyebrow">MI WALLET</div><h2 id="wallet-title">Conexión de wallet</h2></div>
          <span id="status-badge" class="status-badge">Desconectada</span>
        </div>

        <div id="empty-state" class="empty-state">
          <div class="orbit" aria-hidden="true"><div class="orbit-core">✳</div></div>
          <h3>Tu universo empieza aquí</h3>
          <p>Conecta Freighter para ver tu cuenta de Stellar Testnet en tiempo real.</p>
          <button id="connect" class="primary-button" type="button">Conectar Freighter <span aria-hidden="true">↗</span></button>
          <a class="install-link" href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer">¿No tienes Freighter? Instálala aquí <span aria-hidden="true">↗</span></a>
        </div>

        <div id="account-state" class="account-state" hidden>
          <div class="account-overview">
            <div><div class="eyebrow">SALDO DISPONIBLE</div><div class="balance-line"><strong id="balance">—</strong><span>XLM</span></div><div class="caption">Stellar Testnet · saldo de prueba</div></div>
            <div class="balance-art" aria-hidden="true">✳</div>
          </div>
          <div class="account-details">
            <div class="eyebrow">DIRECCIÓN PÚBLICA</div>
            <div class="address-row"><code id="address"></code><button id="copy" class="icon-button" type="button" title="Copiar dirección">Copiar</button></div>
            <div id="funding-note" class="funding-note" hidden>Esta cuenta aún no está financiada en Testnet. Puedes conseguir XLM de prueba en el Friendbot de Stellar.</div>
            <div class="account-actions">
              <button id="refresh" class="secondary-button" type="button">↻ Actualizar saldo</button>
              <a id="explorer" class="text-link" href="#" target="_blank" rel="noopener noreferrer">Ver en Stellar Expert ↗</a>
              <button id="disconnect" class="text-button" type="button">Desconectar</button>
            </div>
          </div>
        </div>
        <p id="message" class="message" role="alert" hidden></p>
      </section>

      <div class="info-grid">
        <div class="info-card"><span class="info-icon">◎</span><div><strong>Solo lectura</strong><p>Tu wallet nunca comparte claves privadas con esta aplicación.</p></div></div>
        <div class="info-card"><span class="info-icon">◇</span><div><strong>Red de pruebas</strong><p>Consulta datos de Testnet. Ningún XLM real está en riesgo.</p></div></div>
        <div class="info-card"><span class="info-icon">↗</span><div><strong>Datos en vivo</strong><p>El saldo se obtiene directamente de Horizon de Stellar.</p></div></div>
      </div>
    </main>
    <footer>Hecho por Daniel Elizondo <span>·</span> Construido sobre Stellar</footer>
  </div>
`

const $ = (selector) => document.querySelector(selector)
let address = ''
let busy = false

function showMessage(text, kind = 'error') {
  $('#message').textContent = text
  $('#message').className = `message ${kind}`
  $('#message').hidden = !text
}

function setBusy(value) {
  busy = value
  $('#connect').disabled = value
  $('#connect').textContent = value ? 'Conectando…' : 'Conectar Freighter ↗'
  $('#refresh').disabled = value
}

function showAccount(value) {
  $('#empty-state').hidden = value
  $('#account-state').hidden = !value
  $('#status-badge').textContent = value ? 'Conectada' : 'Desconectada'
  $('#status-badge').classList.toggle('connected', value)
}

async function refreshAccount() {
  if (!address || busy) return
  setBusy(true)
  showMessage('')
  try {
    const network = await getNetwork()
    if (network.error || !isTestnet(network.network, network.networkPassphrase)) {
      showAccount(false)
      showMessage('Selecciona Testnet en Freighter y vuelve a conectar para consultar el saldo.')
      address = ''
      return
    }

    const account = await loadAccount(address)
    $('#balance').textContent = formatBalance(account.balance)
    $('#funding-note').hidden = account.funded
    showMessage('Saldo actualizado desde Horizon.', 'success')
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'No se pudo consultar el saldo.')
  } finally {
    setBusy(false)
  }
}

$('#connect').addEventListener('click', async () => {
  if (busy) return
  setBusy(true)
  showMessage('')
  try {
    const connection = await isConnected()
    if (!connection.isConnected) {
      showMessage('No se detectó Freighter. Instala la extensión, desbloquéala y recarga esta página.')
      return
    }

    const access = await requestAccess()
    if (access.error || !access.address) {
      showMessage(access.error?.message || 'No se autorizó el acceso a la dirección pública.')
      return
    }

    const network = await getNetwork()
    if (network.error || !isTestnet(network.network, network.networkPassphrase)) {
      showMessage('Selecciona Testnet en Freighter y vuelve a conectar para consultar el saldo.')
      return
    }

    address = access.address
    $('#address').textContent = shortAddress(address)
    $('#address').title = address
    $('#explorer').href = `https://stellar.expert/explorer/testnet/account/${encodeURIComponent(address)}`
    showAccount(true)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'No se pudo conectar la wallet.')
  } finally {
    setBusy(false)
  }
  if (address) await refreshAccount()
})

$('#refresh').addEventListener('click', refreshAccount)
$('#disconnect').addEventListener('click', () => {
  address = ''
  $('#balance').textContent = '—'
  showAccount(false)
  showMessage('')
})
$('#copy').addEventListener('click', async () => {
  if (!address) return
  try {
    await navigator.clipboard.writeText(address)
    showMessage('Dirección pública copiada.', 'success')
  } catch {
    showMessage('No se pudo copiar. Usa la dirección visible al pasar el cursor sobre ella.')
  }
})
