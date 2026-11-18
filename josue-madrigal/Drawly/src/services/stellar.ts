import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransactionWithKit } from './walletKit';

export const STELLAR_CONFIG = {
  network: 'TESTNET',
  networkPassphrase: StellarSdk.Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
  explorerUrl: 'https://stellar.expert/explorer/testnet/account',
  explorerAccountUrl: 'https://stellar.expert/explorer/testnet/account',
  explorerTxUrl: 'https://stellar.expert/explorer/testnet/tx',
  explorerLedgerUrl: 'https://stellar.expert/explorer/testnet/ledger',
};

// Bóveda oficial del Pozo Dinámico (Pari-Mutuel) en Testnet
export const DYNAMIC_POOL_VAULT_ADDRESS = 'GBCDCSUZWND6IGDT6CGPQAN35QSDOPAIXVKJ47LMSGP4GYPLVYWJYVFI';

// Bóveda oficial dedicada para Custodia de Activos en Escrow (Asset Escrow / RaaS) en Testnet
export const ASSET_ESCROW_VAULT_ADDRESS = 'GDZCRG36MYS3SRWJ6Z527R2C542MSCPEA6FX7AWK7GVJJA425JXDEU26';

// Alias de retrocompatibilidad
export const RAFFLE_VAULT_ADDRESS = DYNAMIC_POOL_VAULT_ADDRESS;

// Instancia única del servidor Horizon para Testnet
export const horizonServer = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);

export interface AccountBalanceInfo {
  balance: string;
  exists: boolean;
  error?: string;
}

/**
 * Calcula el tamaño en bytes UTF-8 de una cadena de texto (para validar Memo.text <= 28 bytes)
 */
export function getUtf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Consulta el balance actual de XLM nativo en Horizon Testnet
 */
export async function fetchXlmBalance(publicKey: string): Promise<AccountBalanceInfo> {
  if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
    return { balance: '0', exists: false, error: 'Clave pública inválida' };
  }

  try {
    const account = await horizonServer.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b) => b.asset_type === 'native');
    return {
      balance: nativeBalance ? parseFloat(nativeBalance.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0',
      exists: true,
    };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; name?: string; message?: string };
    if (err?.response?.status === 404 || err?.name === 'NotFoundError') {
      return { balance: '0', exists: false };
    }
    console.error('Error al consultar Horizon:', error);
    return { balance: '0', exists: false, error: err?.message || 'Error al consultar la red' };
  }
}

/**
 * Fondea la cuenta con 10,000 XLM usando Friendbot en Testnet
 */
export async function requestFriendbotFunding(publicKey: string): Promise<{ success: boolean; message: string }> {
  if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
    return { success: false, message: 'Dirección pública inválida' };
  }

  try {
    const response = await fetch(`${STELLAR_CONFIG.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);
    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: '¡Cuenta fondeada exitosamente con 10,000 XLM de Friendbot!',
      };
    } else {
      return {
        success: false,
        message: data?.detail || data?.title || 'Friendbot no pudo procesar la solicitud.',
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    return {
      success: false,
      message: `Error al conectar con Friendbot: ${err.message}`,
    };
  }
}

export interface PurchaseTicketParams {
  userAddress: string;
  alias: string;
  destinationVault?: string;
  amount?: string;
  onStatusUpdate?: (status: string) => void;
}

export interface PurchaseTicketResult {
  hash: string;
  ledger: number;
}

export interface ParticipantEntry {
  ticketNumber: number;
  alias: string;
  sourceAccount: string;
  hash: string;
  createdAt: string;
}

export interface LiveParticipantsResult {
  entries: ParticipantEntry[];
  totalPotXlm: number;
}

/**
 * Consulta la API de Horizon Testnet (server.transactions().forAccount(POOL_ADDRESS))
 * para listar todas las entradas válidas al sorteo filtrando transacciones exitosas con Memo.text
 */
export async function fetchLiveParticipants(
  vaultAddress: string = RAFFLE_VAULT_ADDRESS
): Promise<LiveParticipantsResult> {
  try {
    const response = await horizonServer
      .transactions()
      .forAccount(vaultAddress)
      .order('asc')
      .limit(200)
      .call();

    // Filtra las transacciones exitosas que tengan un Memo de tipo texto
    const validTxs = response.records.filter(
      (tx) => tx.successful && tx.memo_type === 'text' && !!tx.memo
    );

    const entries: ParticipantEntry[] = validTxs.map((tx, idx) => ({
      ticketNumber: idx + 1,
      alias: tx.memo || 'Anónimo',
      sourceAccount: tx.source_account,
      hash: tx.hash,
      createdAt: tx.created_at,
    }));

    // Cada entrada equivale a 1 XLM en el pozo
    const totalPotXlm = entries.length * 1;

    return {
      entries,
      totalPotXlm,
    };
  } catch (error) {
    console.error('Error al consultar participantes en Horizon:', error);
    throw error;
  }
}

export interface DrawWinnerResult {
  winner: ParticipantEntry;
  winnerIndex: number;
  ledgerSequence: number;
  ledgerHash: string;
  seedHex: string;
  seedDecimal: number;
  participantsCount: number;
  closedAt: string;
}

/**
 * Ejecuta el sorteo verificable on-chain consultando el último ledger en Horizon Testnet
 * y derivando el índice ganador de forma determinista mediante hash.slice(-8) % participants.length
 */
export async function executeVerifiableDraw(
  participants: ParticipantEntry[]
): Promise<DrawWinnerResult> {
  if (participants.length === 0) {
    throw new Error('Se requiere al menos 1 participante para realizar el sorteo.');
  }

  // 1. Consulta el último ledger cerrado en Horizon Testnet
  const response = await horizonServer.ledgers().order('desc').limit(1).call();
  const latestLedger = response.records[0];

  if (!latestLedger || !latestLedger.hash) {
    throw new Error('No se pudo obtener el último ledger cerrado en Horizon Testnet.');
  }

  // 2. Toma el hash criptográfico del ledger como semilla pública
  const ledgerHash = latestLedger.hash;
  const ledgerSequence = latestLedger.sequence;
  const closedAt = latestLedger.closed_at;

  // 3. Convierte los últimos 8 caracteres hexadecimales a entero
  const seedHex = ledgerHash.slice(-8);
  const seedDecimal = parseInt(seedHex, 16);

  // 4. Aplica módulo con el total de participantes (% participants.length)
  const winnerIndex = seedDecimal % participants.length;
  const winner = participants[winnerIndex];

  return {
    winner,
    winnerIndex,
    ledgerSequence,
    ledgerHash,
    seedHex,
    seedDecimal,
    participantsCount: participants.length,
    closedAt,
  };
}

/**
 * Construye, firma y envía la transacción de compra de 1 boleto (1 XLM)
 * guardando el alias del usuario en el Memo.text (máx 28 bytes)
 */
export async function buyRaffleTicket({
  userAddress,
  alias,
  destinationVault = DYNAMIC_POOL_VAULT_ADDRESS,
  amount = '1',
  onStatusUpdate,
}: PurchaseTicketParams): Promise<PurchaseTicketResult> {
  const trimmedAlias = alias.trim();
  const byteLength = getUtf8ByteLength(trimmedAlias);

  if (byteLength === 0) {
    throw new Error('Debes ingresar un nombre o alias para tu boleto.');
  }

  if (byteLength > 28) {
    throw new Error(`El alias excede el límite de 28 bytes de Stellar (${byteLength} bytes).`);
  }

  onStatusUpdate?.('Cargando cuenta desde Horizon Testnet...');
  let account: Awaited<ReturnType<typeof horizonServer.loadAccount>>;
  try {
    account = await horizonServer.loadAccount(userAddress);
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; name?: string };
    if (err?.response?.status === 404 || err?.name === 'NotFoundError') {
      throw new Error('Tu cuenta no está fondeada en Testnet. Usa el botón de Fondear 10,000 XLM primero.');
    }
    throw new Error('Error al cargar la cuenta desde Horizon.');
  }

  // Verificar balance suficiente
  const nativeBalance = account.balances.find((b: { asset_type: string; balance: string }) => b.asset_type === 'native');
  const availableXlm = nativeBalance ? parseFloat(nativeBalance.balance) : 0;
  const cost = parseFloat(amount);
  if (availableXlm < cost + 0.001) {
    throw new Error(`Balance insuficiente (${availableXlm.toFixed(2)} XLM). Necesitas al menos ${cost} XLM más comisión.`);
  }

  onStatusUpdate?.(`Construyendo transacción con ${amount} XLM y Memo.text...`);
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationVault,
        asset: StellarSdk.Asset.native(),
        amount: amount,
      })
    )
    .addMemo(StellarSdk.Memo.text(trimmedAlias))
    .setTimeout(180)
    .build();

  const xdr = transaction.toXDR();

  onStatusUpdate?.('Solicitando firma en tu wallet conectada...');
  let signedTxXdr: string;
  try {
    signedTxXdr = await signTransactionWithKit(xdr);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes('User declined') || err.message?.includes('rejected') || err.message?.includes('User rejected')) {
      throw new Error('Firma rechazada por el usuario en la wallet.');
    }
    if (err.message?.includes('not installed') || err.message?.includes('Not installed')) {
      throw new Error('Wallet no detectada. Instala Freighter, xBull o usa Albedo.');
    }
    throw new Error(err.message || 'Error al firmar con la wallet.');
  }

  onStatusUpdate?.('Enviando transacción a Stellar Testnet...');
  try {
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedTxXdr,
      STELLAR_CONFIG.networkPassphrase
    ) as StellarSdk.Transaction;

    const response = await horizonServer.submitTransaction(signedTx);

    return {
      hash: response.hash,
      ledger: response.ledger,
    };
  } catch (error: unknown) {
    const err = error as {
      response?: {
        data?: {
          extras?: {
            result_codes?: {
              transaction?: string;
              operations?: string[];
            };
          };
          title?: string;
          detail?: string;
        };
      };
      message?: string;
    };

    const extras = err?.response?.data?.extras?.result_codes;
    if (extras?.operations?.includes('op_underfunded')) {
      throw new Error('Cuenta sin fondos suficientes para transferir y pagar comisiones en Testnet.');
    }
    if (extras?.transaction === 'tx_bad_seq') {
      throw new Error('Secuencia de transacción desincronizada. Por favor reintenta en unos segundos.');
    }
    if (extras?.transaction === 'tx_insufficient_fee') {
      throw new Error('Comisión de red insuficiente.');
    }
    if (err?.response?.data?.detail) {
      throw new Error(`Error de Horizon: ${err.response.data.detail}`);
    }
    throw new Error(err?.message || 'Error al enviar la transacción a Horizon Testnet.');
  }
}

/**
 * Acorta una clave pública de Stellar (ej: GABC...WXYZ)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
