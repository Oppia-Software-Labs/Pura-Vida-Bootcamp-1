import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';

describe('starter page', () => {
  it('introduces the lab and explains its safe, inactive scope', () => {
    document.documentElement.innerHTML = html;

    const main = document.querySelector('main');
    expect(main).not.toBeNull();
    expect(main?.querySelector('h1')?.textContent).toBe('Stellar Wallet Lab');
    expect(main?.textContent).toContain('Testnet practice only');
    expect(main?.textContent).toContain('No real funds or purchases are needed.');
    expect(main?.textContent).toContain('Never share private keys or recovery phrases.');
    expect(main?.textContent).toContain('Wallet integration is next and is not active yet.');
    expect(main?.textContent).toContain('No wallet access is requested by this page.');
  });
});
