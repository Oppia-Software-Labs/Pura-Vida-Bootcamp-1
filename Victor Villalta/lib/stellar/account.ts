import { assertPublicAddress, verifiedTestnetServer } from "./server";
import { horizonFailure } from "./errors";

const operationNames: Record<string, string> = {
  create_account: "Crear cuenta",
  payment: "Pago",
  path_payment_strict_send: "Pago con conversión",
  path_payment_strict_receive: "Pago con conversión",
  change_trust: "Habilitar activo",
  allow_trust: "Autorizar activo",
  set_options: "Configurar cuenta",
  account_merge: "Fusionar cuentas",
  manage_data: "Guardar dato",
  manage_sell_offer: "Oferta de venta",
  manage_buy_offer: "Oferta de compra",
  create_passive_sell_offer: "Oferta pasiva de venta",
  create_claimable_balance: "Crear saldo reclamable",
  claim_claimable_balance: "Reclamar saldo",
  liquidity_pool_deposit: "Depositar en piscina de liquidez",
  liquidity_pool_withdraw: "Retirar de piscina de liquidez",
  invoke_host_function: "Invocar contrato",
};

export type AccountSummary = {
  balance: string;
  assets: { id: string; name: string; balance: string; issuer: string | null }[];
  history: { hash: string; date: string; successful: boolean; operations: string[] }[];
};

export async function loadAccountSummary(address: string): Promise<AccountSummary | null> {
  assertPublicAddress(address);
  const server = await verifiedTestnetServer();
  const account = await server.loadAccount(address).catch((error: unknown) => {
    if (horizonFailure(error).status === 404) return null;
    throw error;
  });
  if (!account) return null;

  const native = account.balances.find((asset) => asset.asset_type === "native");
  const assets = account.balances.flatMap<AccountSummary["assets"][number]>((asset) => {
    if (asset.asset_type === "native") return [];
    if (asset.asset_type === "liquidity_pool_shares") {
      return [{ id: asset.liquidity_pool_id, name: "Participación en piscina de liquidez", balance: asset.balance, issuer: null }];
    }
    return [{ id: `${asset.asset_code}:${asset.asset_issuer}`, name: asset.asset_code, balance: asset.balance, issuer: asset.asset_issuer }];
  });

  const { records } = await server.transactions().forAccount(address).order("desc").limit(5).call();
  const history = await Promise.all(records.map(async (transaction) => {
    const operations = await server.operations()
      .forTransaction(transaction.hash).limit(100).includeFailed(true).call()
      .then(({ records }) => [...new Set(records.map(({ type }) => operationNames[type] ?? "Otra operación de Stellar"))])
      .catch(() => []);

    return {
      hash: transaction.hash,
      date: transaction.created_at,
      successful: transaction.successful,
      operations,
    };
  }));

  return { balance: native?.balance ?? "0", assets, history };
}
