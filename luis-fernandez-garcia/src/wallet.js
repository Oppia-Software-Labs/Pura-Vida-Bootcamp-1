import { isConnected, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';

export async function connectWallet() {
  const conn = await isConnected();
  if (!conn.isConnected) throw new Error('Freighter no está instalado. Instálalo desde freighter.app');
  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message || String(access.error));
  const net = await getNetworkDetails();
  if (net.network !== 'TESTNET') throw new Error('Cambia Freighter a la red TESTNET');
  return access.address;
}

export async function currentAddress() {
  const r = await getAddress();
  return r.error ? null : r.address;
}

export const short = (a) => `${a.slice(0, 5)}…${a.slice(-5)}`;
