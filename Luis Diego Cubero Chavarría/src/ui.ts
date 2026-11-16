import { messages, type MessageKey } from './messages';

let locale: 'es' | 'en' = 'es';
let theme: 'dark' | 'light' = 'dark';
let statusKey: MessageKey = 'idle';
const labels = new Map<HTMLElement, MessageKey>();
export function label(element: HTMLElement, key: MessageKey) {
  labels.set(element, key);
  element.textContent = messages[key][locale === 'es' ? 0 : 1];
}
export function status(key: MessageKey) {
  statusKey = key;
  const element = document.querySelector<HTMLElement>('#wallet-status')!;
  label(element, key);
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
  for (const [id, key] of [['wallet-address', 'addressLabel'], ['wallet-network', 'networkLabel']] as const) {
    document.getElementById(id)!.setAttribute('aria-label', messages[key][locale === 'es' ? 0 : 1]);
  }
  label(document.querySelector<HTMLElement>('#theme-label')!, theme);
  label(document.querySelector<HTMLElement>('#locale-label')!, 'locale');
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
