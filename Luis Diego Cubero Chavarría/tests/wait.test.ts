import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import html from '../index.html?raw';
const sdk = vi.hoisted(() => ({ isConnected: vi.fn(), requestAccess: vi.fn(), getNetwork: vi.fn(), getAddress: vi.fn(), disconnect: vi.fn() }));
vi.mock('@stellar/varial-sdk', () => ({ default: sdk }));
const el = (id: string) => document.getElementById(id) as HTMLButtonElement;
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); await vi.advanceTimersByTimeAsync(0); };
const details = { network: 'TESTNET', networkPassphrase: 'Test SDF Network ; September 2015' };
let debug: ReturnType<typeof vi.spyOn>;
let storage: ReturnType<typeof vi.spyOn>;
beforeEach(async () => {
  vi.resetModules(); vi.resetAllMocks(); vi.useFakeTimers();
  vi.stubEnv('DEV', true);
  debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
  storage = vi.spyOn(Storage.prototype, 'setItem');
  sdk.isConnected.mockResolvedValue({ isConnected: true });
  sdk.requestAccess.mockResolvedValue({ address: 'SYNTHETIC_SENTINEL' });
  sdk.getAddress.mockResolvedValue({ address: 'SYNTHETIC_SENTINEL' });
  sdk.getNetwork.mockResolvedValue(details); sdk.disconnect.mockResolvedValue({});
  document.documentElement.innerHTML = html;
  await import('../src/main');
});
afterEach(() => { window.onfocus = null; vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it.each(['access', 'network'] as const)('keeps %s pending, translates guidance, and accepts late success without stale timers', async kind => {
  let resolve!: (v: any) => void;
  const pending = new Promise(r => { resolve = r; });
  (kind === 'access' ? sdk.requestAccess : sdk.getNetwork).mockReturnValueOnce(pending);
  el('connect-wallet').click(); await flush();
  await vi.advanceTimersByTimeAsync(9999);
  expect(el('wallet-status').textContent).not.toContain('10');
  await vi.advanceTimersByTimeAsync(1);
  expect(el('wallet-status').textContent).toContain('La solicitud sigue activa');
  expect(el('wallet-status').textContent).toContain(kind === 'access' ? 'cierra el aviso' : 'lectura');
  el('locale').click(); el('theme').click();
  expect(el('wallet-status').textContent).toContain('The request is still active');
  expect(el('wallet-status').textContent).toContain(kind === 'access' ? 'close the prompt' : 'read');
  el('connect-wallet').dispatchEvent(new MouseEvent('click')); window.dispatchEvent(new Event('focus'));
  expect(el('connect-wallet').disabled).toBe(true);
  expect(sdk.requestAccess).toHaveBeenCalledTimes(1); expect(sdk.getAddress).not.toHaveBeenCalled();
  resolve(kind === 'access' ? { address: 'SYNTHETIC_SENTINEL' } : details); await flush();
  expect(el('wallet-status').textContent).toContain('Testnet confirmed');
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(20000);
  expect(el('wallet-status').textContent).toContain('Testnet confirmed');
  expect(storage).not.toHaveBeenCalled();
});

it.each(['access', 'network'] as const)('cleans late %s rejection and permits a clean retry', async kind => {
  let reject!: (e: Error) => void;
  (kind === 'access' ? sdk.requestAccess : sdk.getNetwork).mockReturnValueOnce(new Promise((_r, r) => { reject = r; }));
  el('connect-wallet').click(); await flush(); await vi.advanceTimersByTimeAsync(10000);
  expect(el('wallet-status').textContent).toContain('La solicitud sigue activa');
  reject(new Error('MALICIOUS_SENTINEL')); await flush();
  expect(el('wallet-status').textContent).toContain(kind === 'access' ? 'No se pudo conectar' : 'No se pudo leer');
  expect(el('connect-wallet').disabled).toBe(false); expect(vi.getTimerCount()).toBe(0);
  el('connect-wallet').click(); await flush(); await vi.advanceTimersByTimeAsync(10000);
  expect(el('wallet-status').textContent).toContain('Testnet confirmada');
  expect(JSON.stringify(debug.mock.calls)).not.toContain('MALICIOUS_SENTINEL');
});

it('clears early timers and logs only allowlisted literals across public flows', async () => {
  const scheduled = vi.spyOn(window, 'setTimeout');
  const cleared = vi.spyOn(window, 'clearTimeout');
  el('connect-wallet').click(); await flush();
  window.dispatchEvent(new Event('focus')); await flush();
  sdk.disconnect.mockResolvedValueOnce({ error: { message: 'MALICIOUS_SENTINEL' } });
  el('disconnect-wallet').click(); await flush();
  expect(el('wallet-status').textContent).toContain('No se pudo confirmar');
  expect(el('disconnect-wallet').disabled).toBe(false);
  expect(document.activeElement).toBe(el('disconnect-wallet'));
  // Call-through spies prove all six app notice timers were explicitly cleared
  // before advancing time; no pending app timer is accepted or flushed away.
  const notices = scheduled.mock.calls.flatMap((args, i) => args[1] === 10000 ? [scheduled.mock.results[i].value] : []);
  expect(notices).toHaveLength(6);
  for (const handle of notices) expect(cleared).toHaveBeenCalledWith(handle);
  expect(debug.mock.calls.some(args => args[1] === 'slow')).toBe(false);
  // jsdom Window.js schedules focus fixup on its 16 ms rendering interval.
  // Run that one rendering tick normally, retaining the global zero assertion.
  await vi.advanceTimersByTimeAsync(16);
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(20000);
  expect(el('wallet-status').textContent).toContain('No se pudo confirmar');
  expect(vi.getTimerCount()).toBe(0);
  expect(debug.mock.calls.some(args => args[1] === 'slow')).toBe(false);
  expect(debug).toHaveBeenCalledWith('disconnect', 'sdk_error');
  for (const args of debug.mock.calls) {
    expect(args).toHaveLength(2);
    expect(['extension_check', 'access', 'network_read', 'account_read', 'disconnect']).toContain(args[0]);
    expect(['ok', 'sdk_error', 'invalid_result', 'unavailable', 'slow']).toContain(args[1]);
  }
  expect(JSON.stringify(debug.mock.calls)).not.toContain('SENTINEL');
  expect(storage).not.toHaveBeenCalled();
});

it('has no app diagnostic output when DEV is false even for slow and rejected requests', async () => {
  vi.stubEnv('DEV', false);
  let reject!: (e: Error) => void;
  sdk.requestAccess.mockReturnValueOnce(new Promise((_r, r) => { reject = r; }));
  el('connect-wallet').click(); await flush(); await vi.advanceTimersByTimeAsync(10000);
  expect(el('wallet-status').textContent).toContain('La solicitud sigue activa');
  reject(new Error('MALICIOUS_SENTINEL')); await flush();
  expect(debug).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
});
