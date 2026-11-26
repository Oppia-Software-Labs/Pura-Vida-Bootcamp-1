import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction
} from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';

export const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';
export const TESTNET_PASSPHRASE = StellarSdk.Networks.TESTNET;

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const res = await isConnected();
    return !!res.isConnected;
  } catch (err) {
    console.warn('Freighter detection error:', err);
    return false;
  }
}

export async function connectFreighter(): Promise<{ address: string; network: string }> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error('La extensión Freighter no está instalada o no está activa en tu navegador.');
  }

  // Request access
  const accessResult = await requestAccess();
  if (accessResult.error) {
    throw new Error(`Error de acceso en Freighter: ${accessResult.error}`);
  }

  let address = accessResult.address;
  if (!address) {
    const addrResult = await getAddress();
    if (addrResult.error) {
      throw new Error(`Error obteniendo dirección: ${addrResult.error}`);
    }
    address = addrResult.address;
  }

  if (!address) {
    throw new Error('No se pudo obtener la dirección pública de la wallet.');
  }

  let network = 'TESTNET';
  try {
    const netResult = await getNetwork();
    if (!netResult.error && netResult.network) {
      network = netResult.network;
    }
  } catch {
    network = 'TESTNET';
  }

  return { address, network };
}

export async function fetchAccountBalance(address: string): Promise<string> {
  try {
    const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL);
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
    return nativeBalance
      ? parseFloat(nativeBalance.balance).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      : '0.00';
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return 'Cuenta nueva (Sin fondear)';
    }
    console.error('Error fetching balance:', err);
    return '0.00';
  }
}

export async function fundWithFriendbot(address: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
    if (response.ok) {
      return { success: true, message: '¡Cuenta fondeada exitosamente con 10,000 XLM de prueba en Testnet!' };
    }
    const data = await response.json().catch(() => ({}));
    return { success: false, message: data.detail || 'Friendbot no pudo procesar la solicitud (quizás ya tiene fondos).' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al contactar con Friendbot.' };
  }
}

export async function sendPaymentXlm({
  fromAddress,
  toAddress,
  amountXlm,
  memo
}: {
  fromAddress: string;
  toAddress: string;
  amountXlm: string;
  memo?: string;
}): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL);

    // Validate destination public key
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(toAddress)) {
      return { success: false, error: 'La dirección de destino no es una clave pública Stellar válida (debe empezar con G).' };
    }

    // Load source account
    const sourceAccount = await server.loadAccount(fromAddress);
    const baseFee = await server.fetchBaseFee();

    let txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: baseFee.toString(),
      networkPassphrase: TESTNET_PASSPHRASE
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: toAddress,
          asset: StellarSdk.Asset.native(),
          amount: amountXlm
        })
      )
      .setTimeout(180);

    if (memo) {
      txBuilder = txBuilder.addMemo(StellarSdk.Memo.text(memo.slice(0, 28)));
    }

    const tx = txBuilder.build();
    const xdr = tx.toXDR();

    // Sign with Freighter
    const signResult = await signTransaction(xdr, {
      networkPassphrase: TESTNET_PASSPHRASE,
      address: fromAddress
    });

    if (signResult.error) {
      return { success: false, error: `Firma rechazada en Freighter: ${signResult.error}` };
    }

    if (!signResult.signedTxXdr) {
      return { success: false, error: 'No se recibió la transacción firmada desde Freighter.' };
    }

    // Submit transaction to Horizon
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signResult.signedTxXdr, TESTNET_PASSPHRASE);
    const submitResult = await server.submitTransaction(signedTx as any);

    return {
      success: true,
      hash: submitResult.hash
    };
  } catch (err: any) {
    console.error('Error submitting payment:', err);
    const errorDetail = err?.response?.data?.extras?.result_codes?.transaction || err.message || 'Error desconocido';
    return { success: false, error: `Error en la transacción: ${errorDetail}` };
  }
}
