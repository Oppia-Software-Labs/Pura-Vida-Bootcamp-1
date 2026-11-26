import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatXlmBalance, loadAccount, nativeBalance } from './account';

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

  it('rejects a malformed balance before rendering it', () => {
    expect(() => nativeBalance({ balances: [{ asset_type: 'native', balance: '1.12345678' }] })).toThrow('saldo XLM inválido');
  });
});

describe('formatXlmBalance', () => {
  it('keeps all seven decimal places without floating point rounding', () => {
    const formatted = formatXlmBalance('9007199254740993.1234567');
    expect(formatted).toContain('1234567');
    expect(formatted.replace(/\D/g, '')).toBe('90071992547409931234567');
  });

  it('removes only insignificant zeroes', () => {
    expect(formatXlmBalance('12.5000000').replace(/\D/g, '')).toBe('125');
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
