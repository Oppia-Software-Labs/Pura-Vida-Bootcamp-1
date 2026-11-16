import { beforeEach, describe, expect, it, vi } from 'vitest';
import { connectWallet, TESTNET_PASSPHRASE, WalletError } from './wallet';
import { getNetwork, isConnected, requestAccess } from '@stellar/varial-sdk';

vi.mock('@stellar/varial-sdk', () => ({
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
  vi.mocked(requestAccess).mockResolvedValue({ address: 'GTEST' });
  vi.mocked(getNetwork).mockResolvedValue({ network: 'TESTNET', networkPassphrase: TESTNET_PASSPHRASE });
});

describe('connectWallet', () => {
  it('returns the address only on Testnet', async () => {
    await expect(connectWallet()).resolves.toBe('GTEST');
  });

  it('reports an absent extension', async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: false });
    await expect(connectWallet()).rejects.toMatchObject({ code: 'missing-extension' } satisfies Partial<WalletError>);
  });

  it('reports rejected access', async () => {
    vi.mocked(requestAccess).mockResolvedValue({ address: '' });
    await expect(connectWallet()).rejects.toMatchObject({ code: 'access-denied' } satisfies Partial<WalletError>);
  });

  it('rejects another network', async () => {
    vi.mocked(getNetwork).mockResolvedValue({ network: 'PUBLIC', networkPassphrase: 'Public Global Stellar Network ; September 2015' });
    await expect(connectWallet()).rejects.toMatchObject({ code: 'wrong-network' } satisfies Partial<WalletError>);
  });
});
