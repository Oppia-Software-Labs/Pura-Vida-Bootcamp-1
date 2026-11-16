import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import html from '../index.html?raw';

const sdk = vi.hoisted(() => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  getNetwork: vi.fn(),
  getAddress: vi.fn(),
  disconnect: vi.fn(),
}));
vi.mock('@stellar/varial-sdk', () => ({ default: sdk }));

const address = 'G' + 'A'.repeat(55); // Synthetic fixture, not a real account.
const testnetPassphrase = 'Test SDF Network ; September 2015';
const network = () => document.querySelector<HTMLElement>('#wallet-network')!;
const button = () => document.querySelector<HTMLButtonElement>('#connect-wallet')!;
const disconnect = () => document.querySelector<HTMLButtonElement>('#disconnect-wallet')!;
const status = () => document.querySelector('#wallet-status')!;
const output = () => document.querySelector<HTMLElement>('#wallet-address')!;

async function clickAndSettle() {
  button().click();
  await vi.waitFor(() => expect(button().textContent).not.toBe('Connecting…'));
}

function expectFailure(message: string) {
  expect(status().textContent).toBe(message);
  expect(button().disabled).toBe(false);
  expect(button().textContent).toBe('Connect Varial');
  expect(output().hidden).toBe(true);
  expect(output().textContent).toBe('');
  if (message !== 'Unable to read the wallet network. Please retry.') {
    expect(sdk.getNetwork).not.toHaveBeenCalled();
  }
  expect(network().hidden).toBe(true);
  expect(network().textContent).toBe('');
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
}

afterEach(() => { window.onfocus = null; });

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  sdk.getAddress.mockResolvedValue({ address });
  sdk.disconnect.mockResolvedValue({});
  sdk.isConnected.mockResolvedValue({ isConnected: true });
  sdk.requestAccess.mockResolvedValue({ address });
  sdk.getNetwork.mockResolvedValue({ network: 'TESTNET', networkPassphrase: testnetPassphrase });
  document.documentElement.innerHTML = html;
  await import('../src/main');
});

describe('presentation preferences', () => {
  it('keeps uncertain disconnect presentation truthful in both locales without reopening access', async () => {
    button().click();
    await vi.waitFor(() => expect(output().hidden).toBe(false));
    sdk.disconnect.mockResolvedValueOnce({ error: { message: 'Failed' } });
    disconnect().click();
    await vi.waitFor(() => expect(disconnect().disabled).toBe(false));
    expect(button().textContent).toBe('Estado sin confirmar');
    expect(button().disabled).toBe(true);
    expect(disconnect().hidden).toBe(false);
    expect(output().hidden).toBe(true);
    expect(network().hidden).toBe(true);
    expect([...document.querySelectorAll('.placeholder')].map(e => e.textContent))
      .toEqual(['Datos actuales no disponibles', 'Datos actuales no disponibles']);
    document.querySelector<HTMLButtonElement>('#locale')!.click();
    expect(button().textContent).toBe('Connection unconfirmed');
    expect([...document.querySelectorAll('.placeholder')].map(e => e.textContent))
      .toEqual(['Current details unavailable', 'Current details unavailable']);
    button().dispatchEvent(new MouseEvent('click'));
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    let finish!: (value: object) => void;
    sdk.disconnect.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    disconnect().click();
    expect(button().textContent).toBe('Connection unconfirmed');
    expect(button().disabled).toBe(true);
    expect(disconnect().disabled).toBe(true);
    window.dispatchEvent(new Event('focus'));
    expect(button().textContent).toBe('Connection unconfirmed');
    expect(sdk.getAddress).not.toHaveBeenCalled();
    finish({});
    await vi.waitFor(() => expect(disconnect().hidden).toBe(true));
    expect(button().textContent).toBe('Connect Varial');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(sdk.disconnect).toHaveBeenCalledTimes(2);
  });
  it('preserves pending consent, connected details, disconnect and focus states across switches', async () => {
    const locale = () => document.querySelector<HTMLButtonElement>('#locale')!.click();
    const theme = () => document.querySelector<HTMLButtonElement>('#theme')!.click();
    let approve!: (value: { address: string }) => void;
    sdk.requestAccess.mockReturnValue(new Promise(resolve => { approve = resolve; }));
    button().click();
    await vi.waitFor(() => expect(sdk.requestAccess).toHaveBeenCalledTimes(1));
    locale(); theme();
    expect(status().textContent).toBe('Waiting for Varial approval…');
    expect(button().textContent).toBe('Connecting…');
    expect(button().disabled).toBe(true);
    button().dispatchEvent(new MouseEvent('click'));
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    approve({ address });
    await vi.waitFor(() => expect(output().hidden).toBe(false));
    locale(); theme();
    expect(status().textContent).toBe('Conectada. Testnet confirmada: lista para practicar.');
    expect(button().textContent).toBe('Conectada');
    expect(output().textContent).toBe(address);
    expect(sdk.getNetwork).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('focus'));
    locale();
    expect(status().textContent).toBe('Checking wallet connection…');
    await vi.waitFor(() => expect(disconnect().disabled).toBe(false));
    expect(status().textContent).toBe('Connected. Testnet confirmed — ready for practice.');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    sdk.disconnect.mockResolvedValueOnce({ error: { message: 'Failed' } });
    disconnect().click();
    locale();
    expect(status().textContent).toBe('Desconectando…');
    expect(disconnect().textContent).toBe('Desconectando…');
    await vi.waitFor(() => expect(disconnect().disabled).toBe(false));
    expect(status().textContent).toBe('No se pudo confirmar la desconexión. Reintenta desconectar.');
    locale(); theme();
    expect(status().textContent).toBe('Disconnection could not be confirmed. Retry disconnect.');
    expect(output().hidden).toBe(true);
    expect(network().hidden).toBe(true);
    expect(button().disabled).toBe(true);
    expect(sdk.disconnect).toHaveBeenCalledTimes(1);
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
  it('defaults to dark Spanish without wallet calls and switches labels in memory', () => {
    expect(document.documentElement.lang).toBe('es');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(button().textContent).toBe('Conectar Varial');
    document.querySelector<HTMLButtonElement>('#theme')!.click();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.querySelector('#theme')?.textContent).toContain('Cambiar a oscuro');
    document.querySelector<HTMLButtonElement>('#locale')!.click();
    expect(document.documentElement.lang).toBe('en');
    expect(button().textContent).toBe('Connect Varial');
    expect(output().getAttribute('aria-label')).toBe('Public wallet address');
    expect(sdk.isConnected).not.toHaveBeenCalled();
    expect(sdk.requestAccess).not.toHaveBeenCalled();
  });

  it('translates the current error without requesting again', async () => {
    sdk.requestAccess.mockResolvedValue({ error: { message: 'Denied' } });
    button().click();
    await vi.waitFor(() => expect(button().disabled).toBe(false));
    expect(status().textContent).toBe('Conexión no aprobada. Vuelve a intentarlo en Varial.');
    document.querySelector<HTMLButtonElement>('#locale')!.click();
    expect(status().textContent).toBe('Connection was not approved. Try again in Varial.');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(sdk.getNetwork).not.toHaveBeenCalled();
  });
});

describe('Varial connection', () => {
  // Existing behavior assertions explicitly exercise English after the Spanish default.
  beforeEach(() => document.querySelector<HTMLButtonElement>('#locale')!.click());
  it('uses callable methods from the actual installed default export', async () => {
    const actual = await vi.importActual<typeof import('@stellar/varial-sdk')>('@stellar/varial-sdk');
    expect(typeof actual.default.isConnected).toBe('function');
    expect(typeof actual.default.requestAccess).toBe('function');
    expect(typeof actual.default.getNetwork).toBe('function');
    expect(typeof actual.default.getAddress).toBe('function');
    expect(typeof actual.default.disconnect).toBe('function');
  });

  it('does not check or request access before an explicit click', () => {
    expect(button()).not.toBeNull();
    expect(button().disabled).toBe(false);
    expect(status().textContent).toBe('Not connected. Connect to share your public address.');
    expect(output().hidden).toBe(true);
    expect(output().textContent).toBe('');
    expect(network().hidden).toBe(true);
    expect(network().textContent).toBe('');
    window.dispatchEvent(new Event('focus'));
    expect(sdk.getAddress).not.toHaveBeenCalled();
    expect(sdk.getNetwork).not.toHaveBeenCalled();
    expect(sdk.isConnected).not.toHaveBeenCalled();
    expect(sdk.requestAccess).not.toHaveBeenCalled();
  });

  it('shows only the approved address and does not request again after success', async () => {
    await clickAndSettle();
    expect(status().textContent).toBe('Connected. Testnet confirmed — ready for practice.');
    expect(network().hidden).toBe(false);
    expect(network().textContent).toBe('TESTNET');
    expect(sdk.getNetwork).toHaveBeenCalledTimes(1);
    expect(output().hidden).toBe(false);
    expect(output().textContent).toBe(address);
    expect(button().disabled).toBe(true);
    expect(button().textContent).toBe('Connected');
    button().click();
    expect(sdk.isConnected).toHaveBeenCalledTimes(1);
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('does not request access when the extension is missing', async () => {
    sdk.isConnected.mockResolvedValue({ isConnected: false });
    await clickAndSettle();
    expectFailure('Varial extension not found. Install or enable it, then retry.');
    expect(sdk.requestAccess).not.toHaveBeenCalled();
  });

  it('handles a denied SDK response and allows a successful retry', async () => {
    sdk.requestAccess.mockResolvedValueOnce({ address, error: { code: -1, message: 'Denied' } });
    await clickAndSettle();
    expectFailure('Connection was not approved. Try again in Varial.');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    await clickAndSettle();
    expect(output().textContent).toBe(address);
    expect(sdk.requestAccess).toHaveBeenCalledTimes(2);
  });

  it('handles an extension-check SDK error without requesting access', async () => {
    sdk.isConnected.mockResolvedValue({ isConnected: true, error: { message: 'Unavailable' } });
    await clickAndSettle();
    expectFailure('Unable to connect to Varial. Please retry.');
    expect(sdk.requestAccess).not.toHaveBeenCalled();
  });

  it('handles a rejected access promise', async () => {
    sdk.requestAccess.mockRejectedValue(new Error('Rejected'));
    await clickAndSettle();
    expectFailure('Unable to connect to Varial. Please retry.');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty address', async () => {
    sdk.requestAccess.mockResolvedValue({ address: '   ' });
    await clickAndSettle();
    expectFailure('Varial returned no public address. Please retry.');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
  });

  it('shows the raw non-Testnet name and warns without changing networks', async () => {
    sdk.getNetwork.mockResolvedValue({ network: '<Custom Mainnet>', networkPassphrase: 'Public Global Stellar Network ; September 2015' });
    await clickAndSettle();
    expect(status().textContent).toBe('Connected to a non-Testnet network. This lab is for Testnet practice; change networks in Varial.');
    expect(network().textContent).toBe('<Custom Mainnet>');
    expect(network().children.length).toBe(0);
    expect(network().hidden).toBe(false);
    expect(output().textContent).toBe(address);
    expect(button().disabled).toBe(true);
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(sdk.getNetwork).toHaveBeenCalledTimes(1);
  });

  it('does not trust a Testnet label with a different passphrase', async () => {
    sdk.getNetwork.mockResolvedValue({ network: 'TESTNET', networkPassphrase: 'Different network' });
    await clickAndSettle();
    expect(status().textContent).toBe('Connected to a non-Testnet network. This lab is for Testnet practice; change networks in Varial.');
    expect(network().textContent).toBe('TESTNET');
    expect(network().hidden).toBe(false);
    expect(output().textContent).toBe(address);
    expect(button().disabled).toBe(true);
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(sdk.getNetwork).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['SDK error', { network: 'TESTNET', networkPassphrase: testnetPassphrase, error: { message: 'Unavailable' } }],
    ['empty name', { network: ' ', networkPassphrase: testnetPassphrase }],
    ['empty passphrase', { network: 'TESTNET', networkPassphrase: '' }],
    ['missing details', {}],
  ])('clears partial details and allows retry after network %s', async (_reason, result) => {
    sdk.getNetwork.mockResolvedValueOnce(result);
    await clickAndSettle();
    expectFailure('Unable to read the wallet network. Please retry.');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(sdk.getNetwork).toHaveBeenCalledTimes(1);
    await clickAndSettle();
    expect(status().textContent).toBe('Connected. Testnet confirmed — ready for practice.');
    expect(output().textContent).toBe(address);
    expect(network().textContent).toBe('TESTNET');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(2);
    expect(sdk.getNetwork).toHaveBeenCalledTimes(2);
  });

  it('handles a rejected network lookup without exposing partial connection data', async () => {
    sdk.getNetwork.mockRejectedValue(new Error('Unavailable'));
    await clickAndSettle();
    expectFailure('Unable to read the wallet network. Please retry.');
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(sdk.getNetwork).toHaveBeenCalledTimes(1);
  });

  it('disables the button while busy and ignores duplicate clicks', async () => {
    let approve!: (value: { address: string }) => void;
    sdk.requestAccess.mockReturnValue(new Promise((resolve) => { approve = resolve; }));
    button().click();
    expect(button().disabled).toBe(true);
    expect(button().textContent).toBe('Connecting…');
    expect(status().textContent).toBe('Waiting for Varial approval…');
    button().click();
    button().dispatchEvent(new MouseEvent('click'));
    window.dispatchEvent(new Event('focus'));
    await vi.waitFor(() => expect(sdk.requestAccess).toHaveBeenCalledTimes(1));
    expect(sdk.isConnected).toHaveBeenCalledTimes(1);
    expect(sdk.getAddress).not.toHaveBeenCalled();
    expect(sdk.getNetwork).not.toHaveBeenCalled();
    approve({ address });
    await vi.waitFor(() => expect(status().textContent).toBe('Connected. Testnet confirmed — ready for practice.'));
    expect(sdk.getNetwork).toHaveBeenCalledTimes(1);
  });
});

function expectCleared(message: string) {
  expect(status().textContent).toBe(message);
  expect(output().textContent).toBe('');
  expect(output().hidden).toBe(true);
  expect(network().textContent).toBe('');
  expect(network().hidden).toBe(true);
  expect(button().disabled).toBe(false);
  expect(disconnect().hidden).toBe(true);
  expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
}

describe('disconnect and return to page', () => {
  beforeEach(() => document.querySelector<HTMLButtonElement>('#locale')!.click());
  it('disconnects once, clears data, focuses connect and permits explicit reconnect', async () => {
    await clickAndSettle();
    expect(disconnect().hidden).toBe(false);
    disconnect().click();
    await vi.waitFor(() => expect(disconnect().hidden).toBe(true));
    expectCleared('Disconnected for the active account and network.');
    expect(document.activeElement).toBe(button());
    expect(sdk.disconnect).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('focus'));
    expect(sdk.getAddress).not.toHaveBeenCalled();
    await clickAndSettle();
    expect(sdk.requestAccess).toHaveBeenCalledTimes(2);
  });

  it.each(['returned error', 'rejection'])('allows retry after disconnect %s without claiming success', async (kind) => {
    await clickAndSettle();
    if (kind === 'rejection') sdk.disconnect.mockRejectedValueOnce(new Error('Failed'));
    else sdk.disconnect.mockResolvedValueOnce({ error: { message: 'Failed' } });
    disconnect().click();
    await vi.waitFor(() => expect(disconnect().disabled).toBe(false));
    expect(status().textContent).toBe('Disconnection could not be confirmed. Retry disconnect.');
    expect(output().hidden).toBe(true);
    expect(output().textContent).toBe('');
    expect(network().hidden).toBe(true);
    expect(network().textContent).toBe('');
    expect(button().disabled).toBe(true);
    expect(disconnect().hidden).toBe(false);
    expect(sdk.disconnect).toHaveBeenCalledTimes(1);
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    disconnect().click();
    await vi.waitFor(() => expect(disconnect().hidden).toBe(true));
    expect(sdk.disconnect).toHaveBeenCalledTimes(2);
  });

  it('serializes pending disconnect and ignores focus and duplicate clicks', async () => {
    await clickAndSettle();
    let finish!: (value: object) => void;
    sdk.disconnect.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    disconnect().click();
    expect(disconnect().disabled).toBe(true);
    expect(status().textContent).toBe('Disconnecting…');
    disconnect().dispatchEvent(new MouseEvent('click'));
    window.dispatchEvent(new Event('focus'));
    expect(sdk.disconnect).toHaveBeenCalledTimes(1);
    expect(sdk.getAddress).not.toHaveBeenCalled();
    expect(sdk.getNetwork).toHaveBeenCalledTimes(1);
    finish({});
    await vi.waitFor(() => expect(disconnect().hidden).toBe(true));
    expectCleared('Disconnected for the active account and network.');
  });

  it('revalidates once on focus without requesting access or racing disconnect', async () => {
    await clickAndSettle();
    let finish!: (value: { address: string }) => void;
    sdk.getAddress.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    window.dispatchEvent(new Event('focus'));
    expect(status().textContent).toBe('Checking wallet connection…');
    expect(output().hidden).toBe(true);
    expect(network().hidden).toBe(true);
    expect(disconnect().disabled).toBe(true);
    window.dispatchEvent(new Event('focus'));
    disconnect().dispatchEvent(new MouseEvent('click'));
    expect(sdk.getAddress).toHaveBeenCalledTimes(1);
    expect(sdk.disconnect).not.toHaveBeenCalled();
    finish({ address });
    await vi.waitFor(() => expect(status().textContent).toBe('Connected. Testnet confirmed — ready for practice.'));
    expect(output().textContent).toBe(address);
    expect(output().hidden).toBe(false);
    expect(network().hidden).toBe(false);
    expect(network().textContent).toBe('TESTNET');
    expect(disconnect().disabled).toBe(false);
    expect(sdk.getNetwork).toHaveBeenCalledTimes(2);
    expect(sdk.requestAccess).toHaveBeenCalledTimes(1);
  });

  it.each(['account', 'network', 'empty address', 'address error', 'network error', 'network rejection'])('invalidates stale data after %s on focus without a popup', async (kind) => {
    await clickAndSettle();
    if (kind === 'account') sdk.getAddress.mockResolvedValue({ address: 'G' + 'B'.repeat(55) });
    if (kind === 'empty address') sdk.getAddress.mockResolvedValue({ address: '' });
    if (kind === 'address error') sdk.getAddress.mockResolvedValue({ address, error: { message: 'Denied' } });
    if (kind === 'network') sdk.getNetwork.mockResolvedValue({ network: 'MAINNET', networkPassphrase: 'Other' });
    if (kind === 'network error') sdk.getNetwork.mockResolvedValue({ network: '', networkPassphrase: '' });
    if (kind === 'network rejection') sdk.getNetwork.mockRejectedValue(new Error('Unavailable'));
    window.dispatchEvent(new Event('focus'));
    await vi.waitFor(() => expect(button().disabled).toBe(false));
    expectCleared('Wallet connection changed or is unavailable. Please reconnect.');
    expect(sdk.getAddress).toHaveBeenCalledTimes(1);
    expect(sdk.disconnect).not.toHaveBeenCalled();
    expect(sdk.getNetwork).toHaveBeenCalledTimes(['account', 'empty address', 'address error'].includes(kind) ? 1 : 2);
  });
});
