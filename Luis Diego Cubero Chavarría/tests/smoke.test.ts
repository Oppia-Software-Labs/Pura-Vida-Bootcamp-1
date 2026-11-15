import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';

describe('lab page', () => {
  it('introduces the lab and explains its safe connection scope', () => {
    document.documentElement.innerHTML = html;

    const main = document.querySelector('main');
    expect(main).not.toBeNull();
    expect(main?.querySelector('h1')?.textContent).toBe('Stellar Wallet Lab');
    expect(main?.textContent).toContain('Testnet practice only');
    expect(main?.textContent).toContain('No real funds or purchases are needed.');
    expect(main?.textContent).toContain('Never share private keys or recovery phrases.');
    expect(main?.textContent).toContain('Access is requested only when you click.');
    expect(main?.textContent).toContain('The wallet network is checked after approval and rechecked when you return to this page.');
    expect(main?.textContent).toContain('Disconnect applies to the active account and network, not all historical permissions.');
    expect(main?.querySelector('button')?.textContent).toBe('Connect Varial');
  });
});
