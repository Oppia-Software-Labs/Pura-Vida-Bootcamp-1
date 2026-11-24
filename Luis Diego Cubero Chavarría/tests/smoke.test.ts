import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';

describe('lab page', () => {
  it('introduces the real connection lab and its safe scope in Spanish', () => {
    document.documentElement.innerHTML = html;
    const main = document.querySelector('main');
    expect(main).not.toBeNull();
    expect(main?.querySelector('h1')?.textContent).toBe('Conecta tu wallet Stellar');
    expect([...document.querySelectorAll('main summary')].map(e => e.textContent)).toEqual(['¿Qué pasa al conectar?', '¿Por qué Testnet?']);
    expect([...document.querySelectorAll('.progress li')].map(e => e.textContent)).toEqual(['Extensión', 'Aprobación', 'Red']);
    expect(main?.textContent).toContain('Práctica solo en Testnet.');
    expect(main?.textContent).toContain('Sin fondos reales, pagos ni firmas.');
    expect(main?.textContent).toContain('Nunca compartas claves privadas ni frases de recuperación.');
    expect(main?.textContent).toContain('El acceso se solicita únicamente al pulsar conectar.');
    expect(main?.textContent).toContain('La red se comprueba tras aprobar y al volver a esta página.');
    expect(main?.textContent).toContain('Desconectar se aplica a la cuenta y red activas, no a todos los permisos históricos.');
    expect(main?.querySelector('button')?.textContent).toBe('Conectar Varial');
    expect(document.querySelector('select')).toBeNull();
  });
});
