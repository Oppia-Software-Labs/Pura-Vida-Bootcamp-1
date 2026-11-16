import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAccount, nativeBalance } from './account';

afterEach(() => vi.unstubAllGlobals());

describe('nativeBalance', () => {
  it('selects XLM rather than another asset', () => {
    expect(nativeBalance({ balances: [
      { asset_type: 'credit_alphanum4', balance: '50.0000000' },
      { asset_type: 'native', balance: '12.3456789' },
    ] })).toBe('12.3456789');
  });

  it('rejects a missing native balance', () => {
    expect(() => nativeBalance({ balances: [] })).toThrow('saldo XLM inválido');
  });
});

describe('loadAccount', () => {
  it('treats a nonexistent Testnet account as unfunded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404 }));
    await expect(loadAccount('GTEST')).resolves.toEqual({ status: 'unfunded' });
  });

  it('reports a Horizon failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 503, ok: false }));
    await expect(loadAccount('GTEST')).rejects.toThrow('No pudimos consultar Horizon');
  });
});
