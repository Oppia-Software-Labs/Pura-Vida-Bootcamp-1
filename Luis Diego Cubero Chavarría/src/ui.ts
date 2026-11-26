import { messages, type MessageKey } from './messages';

let locale: 'es' | 'en' = 'es';
let theme: 'dark' | 'light' = 'dark';
let statusKey: MessageKey = 'idle';
// Completed steps per status; statuses not listed (slow notices) keep the current progress.
const progress: Partial<Record<MessageKey, number>> = {
  idle: 0, failed: 0, missing: 0, disconnecting: 0, disconnected: 0, uncertain: 0, changed: 0, connecting: 0,
  waiting: 1, denied: 1, empty: 1, reading: 2, networkError: 2, other: 2, checking: 2, testnet: 3,
};
const labels = new Map<HTMLElement, MessageKey>();
export function label(element: HTMLElement, key: MessageKey) {
  labels.set(element, key);
  element.textContent = messages[key][locale === 'es' ? 0 : 1];
}
export function status(key: MessageKey) {
  statusKey = key;
  const element = document.querySelector<HTMLElement>('#wallet-status')!;
  label(element, key);
  const done = progress[key];
  if (done !== undefined) document.querySelectorAll<HTMLElement>('.progress li').forEach((step, i) => { step.dataset.done = String(i < done); });
  element.dataset.warning = String(['failed', 'missing', 'denied', 'empty', 'networkError', 'other', 'uncertain', 'changed'].includes(key));
}
function render() {
  document.documentElement.lang = locale;
  document.documentElement.dataset.theme = theme;
  document.title = messages.title[locale === 'es' ? 0 : 1];
  document.querySelectorAll<HTMLElement>('[data-t]').forEach(element => {
    if (!labels.has(element)) label(element, element.dataset.t as MessageKey);
  });
  for (const [element, key] of labels) label(element, key);
  document.querySelector('.progress')!.setAttribute('aria-label', messages.progress[locale === 'es' ? 0 : 1]);
  for (const [id, key] of [['wallet-address', 'addressLabel'], ['wallet-network', 'networkLabel']] as const) {
    document.getElementById(id)!.setAttribute('aria-label', messages[key][locale === 'es' ? 0 : 1]);
  }
  for (const [id, key] of [['theme', theme], ['locale', 'locale']] as const) {
    const name = messages[key][locale === 'es' ? 0 : 1];
    const toggle = document.getElementById(id)!;
    toggle.setAttribute('aria-label', name);
    toggle.title = name;
  }
  label(document.querySelector<HTMLElement>('#locale-label')!, 'localeCode');
  document.querySelector('#sun')!.toggleAttribute('hidden', theme !== 'dark');
  document.querySelector('#moon')!.toggleAttribute('hidden', theme !== 'light');
  status(statusKey);
}
export function initializeUI() {
  document.querySelector('#theme')!.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    render();
  });
  document.querySelector('#locale')!.addEventListener('click', () => {
    locale = locale === 'es' ? 'en' : 'es';
    render();
  });
  render();
}
