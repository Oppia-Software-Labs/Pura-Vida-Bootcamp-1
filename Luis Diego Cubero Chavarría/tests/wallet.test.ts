import { beforeEach, describe, expect, it, vi } from 'vitest';
import html from '../index.html?raw';

const sdk = vi.hoisted(() => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
}));
vi.mock('@stellar/varial-sdk', () => ({ default: sdk }));

const address = 'G' + 'A'.repeat(55); // Synthetic fixture, not a real account.
const button = () => document.querySelector<HTMLButtonElement>('#connect-wallet')!;
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
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  sdk.isConnected.mockResolvedValue({ isConnected: true });
  sdk.requestAccess.mockResolvedValue({ address });
  document.documentElement.innerHTML = html;
  await import('../src/main');
});

describe('Varial connection', () => {
  it('uses callable methods from the actual installed default export', async () => {
    const actual = await vi.importActual<typeof import('@stellar/varial-sdk')>('@stellar/varial-sdk');
    expect(typeof actual.default.isConnected).toBe('function');
    expect(typeof actual.default.requestAccess).toBe('function');
  });

  it('does not check or request access before an explicit click', () => {
    expect(button()).not.toBeNull();
    expect(button().disabled).toBe(false);
    expect(status().textContent).toBe('Not connected. Connect to share your public address.');
    expect(output().hidden).toBe(true);
    expect(output().textContent).toBe('');
    expect(sdk.isConnected).not.toHaveBeenCalled();
    expect(sdk.requestAccess).not.toHaveBeenCalled();
  });

  it('shows only the approved address and does not request again after success', async () => {
    await clickAndSettle();
    expect(status().textContent).toBe('Connected. Network has not been checked.');
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

  it('disables the button while busy and ignores duplicate clicks', async () => {
    let approve!: (value: { address: string }) => void;
    sdk.requestAccess.mockReturnValue(new Promise((resolve) => { approve = resolve; }));
    button().click();
    expect(button().disabled).toBe(true);
    expect(button().textContent).toBe('Connecting…');
    expect(status().textContent).toBe('Waiting for Varial approval…');
    button().click();
    button().dispatchEvent(new MouseEvent('click'));
    await vi.waitFor(() => expect(sdk.requestAccess).toHaveBeenCalledTimes(1));
    expect(sdk.isConnected).toHaveBeenCalledTimes(1);
    approve({ address });
    await vi.waitFor(() => expect(status().textContent).toBe('Connected. Network has not been checked.'));
  });
});
