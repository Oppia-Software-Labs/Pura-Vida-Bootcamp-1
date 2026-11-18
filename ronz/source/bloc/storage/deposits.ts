const KEY = "plazo.deposits";
const BALANCE_ID = /^[0-9a-f]{72}$/i;

export function readSharedDepositId(): string | null {
  const id = new URLSearchParams(location.search).get("deposit");
  return id && BALANCE_ID.test(id) ? id.toLowerCase() : null;
}

export function loadDepositIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveDepositId(id: string): void {
  try {
    const ids = loadDepositIds();
    if (!ids.includes(id)) localStorage.setItem(KEY, JSON.stringify([...ids, id]));
  } catch {
    return;
  }
}
