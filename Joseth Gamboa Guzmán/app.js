import { isConnected, requestAccess, getNetworkDetails } from 'https://esm.sh/@stellar/freighter-api@6.0.1';
import { HORIZON_URL, EXPLORER_URL, FREIGHTER_URL, NETWORK_NAME } from './config.js';

const $ = id => document.getElementById(id);
let connectedAddress = null;
let busy = false;

function notify(message) { $('message').textContent = message; }
function setConnected(address) {
  connectedAddress = address;
  $('address').textContent = address;
  $('status').textContent = '● Conectada';
  $('status').style.color = '#b995ff';
  $('connect').hidden = true;
  $('disconnect').hidden = false;
  $('copy').hidden = false;
  $('refresh').disabled = false;
  $('explorer').href = `${EXPLORER_URL}${encodeURIComponent(address)}`;
}
function disconnect() {
  // Desconexión local: revocar permisos se hace desde la extensión Freighter.
  connectedAddress = null;
  $('address').textContent = 'Conectá una wallet para comenzar';
  $('balance').textContent = '—';
  $('balanceInfo').textContent = 'Tu saldo aparecerá aquí.';
  $('status').textContent = '● Desconectada';
  $('status').style.color = '';
  $('connect').hidden = false;
  $('disconnect').hidden = true;
  $('copy').hidden = true;
  $('refresh').disabled = true;
  $('explorer').href = 'https://stellar.expert/explorer/testnet';
  notify('Desconectada de esta página. Los permisos de Freighter se gestionan desde la extensión.');
}
async function loadBalance() {
  if (!connectedAddress) return;
  const queriedAddress = connectedAddress;
  $('refresh').disabled = true;
  $('balanceInfo').textContent = 'Consultando Stellar Testnet…';
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${encodeURIComponent(queriedAddress)}`);
    if (queriedAddress !== connectedAddress) return;
    if (response.status === 404) {
      $('balance').textContent = '0.00';
      $('balanceInfo').textContent = 'Esta cuenta aún no está activada en Testnet.';
      notify('Podés financiarla con Friendbot para comenzar en Testnet.');
      return;
    }
    if (!response.ok) throw new Error(`Horizon respondió ${response.status}`);
    const account = await response.json();
    if (queriedAddress !== connectedAddress) return;
    const native = account.balances.find(item => item.asset_type === 'native');
    const amount = Number(native?.balance ?? 0);
    $('balance').textContent = amount.toLocaleString('en-US', { maximumFractionDigits: 4 });
    $('balanceInfo').textContent = 'Saldo consultado directamente desde Stellar Horizon.';
    notify('¡Saldo actualizado correctamente!');
  } catch (error) {
    if (queriedAddress !== connectedAddress) return;
    $('balance').textContent = '—';
    $('balanceInfo').textContent = 'No fue posible consultar el saldo.';
    notify(`Error de consulta: ${error.message}`);
  } finally { $('refresh').disabled = !connectedAddress; }
}
async function connect() {
  if (busy) return;
  busy = true;
  $('connect').disabled = true;
  notify('Buscando Freighter…');
  try {
    const connection = await isConnected();
    if (!connection?.isConnected || connection.error) {
      notify('Freighter no está disponible. Instalá la extensión en ' + FREIGHTER_URL);
      return;
    }
    const access = await requestAccess();
    if (access?.error || !access?.address) throw new Error(access?.error?.message || 'No se autorizó el acceso a la wallet.');
    const network = await getNetworkDetails();
    if (network?.error || network?.network !== NETWORK_NAME) {
      notify('Seleccioná TESTNET en Freighter y volvé a conectar. No se consultará Mainnet.');
      return;
    }
    setConnected(access.address);
    notify('¡Wallet conectada! Estás usando Stellar Testnet.');
    await loadBalance();
  } catch (error) { notify(error?.message || 'No se pudo conectar Freighter.'); }
  finally { busy = false; $('connect').disabled = false; }
}
$('connect').addEventListener('click', connect);
$('disconnect').addEventListener('click', disconnect);
$('refresh').addEventListener('click', loadBalance);
$('copy').addEventListener('click', async () => {
  if (!connectedAddress) return;
  try { await navigator.clipboard.writeText(connectedAddress); notify('Dirección pública copiada.'); }
  catch { notify('No se pudo copiar automáticamente. Seleccioná la dirección para copiarla.'); }
});
