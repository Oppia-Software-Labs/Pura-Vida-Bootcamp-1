export const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

type HorizonBalance = { asset_type: string; balance: string };
type HorizonAccount = { balances: HorizonBalance[] };

export type AccountResult =
  | { status: 'funded'; balance: string }
  | { status: 'unfunded' };

export function nativeBalance(account: HorizonAccount): string {
  const balance = account.balances.find((item) => item.asset_type === 'native');
  if (!balance || !/^\d+(\.\d{1,7})?$/.test(balance.balance)) {
    throw new Error('Horizon devolvió un saldo XLM inválido.');
  }
  return balance.balance;
}

export function formatXlmBalance(balance: string): string {
  if (!/^\d+(\.\d{1,7})?$/.test(balance)) {
    throw new Error('El saldo XLM tiene un formato inválido.');
  }
  const [whole, fraction] = balance.split('.');
  const wholeFormatted = new Intl.NumberFormat('es-CR').format(BigInt(whole));
  const visibleFraction = fraction?.replace(/0+$/, '');
  if (!visibleFraction) return wholeFormatted;
  const decimal = new Intl.NumberFormat('es-CR').formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? ',';
  return `${wholeFormatted}${decimal}${visibleFraction}`;
}

export async function loadAccount(address: string, signal?: AbortSignal): Promise<AccountResult> {
  const response = await fetch(`${HORIZON_TESTNET}/accounts/${encodeURIComponent(address)}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (response.status === 404) return { status: 'unfunded' };
  if (!response.ok) throw new Error('No pudimos consultar Horizon. Inténtalo de nuevo.');

  const account = (await response.json()) as HorizonAccount;
  if (!account || !Array.isArray(account.balances)) {
    throw new Error('Horizon devolvió una respuesta inesperada.');
  }
  return { status: 'funded', balance: nativeBalance(account) };
}
