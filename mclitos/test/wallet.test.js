import test from 'node:test';
import assert from 'node:assert/strict';
import { createWalletClient, TESTNET_PASSPHRASE } from '../src/wallet.js';

const address = 'G' + 'A'.repeat(55);
const otherAddress = 'G' + 'B'.repeat(55);
function setup(overrides = {}, fetcher = async () => ({
  ok: true, json: async () => ({ balances: [
    { asset_type: 'native', balance: '10000.0000000' },
    { asset_type: 'credit_alphanum4', asset_code: 'USD', asset_issuer: otherAddress, balance: '2.5000000' },
  ] }),
})) {
  const sdk = {
    isConnected: async () => ({ isConnected: true }),
    requestAccess: async () => ({ address }),
    getAddress: async () => ({ address }),
    getNetworkDetails: async () => ({ networkPassphrase: TESTNET_PASSPHRASE }),
    ...overrides,
  };
  return createWalletClient(sdk, fetcher);
}

test('conecta con permiso explícito y devuelve la dirección pública', async () => {
  let permissions = 0;
  const client = setup({ requestAccess: async () => { permissions++; return { address }; } });
  assert.equal(await client.connect(), address);
  assert.equal(permissions, 1);
});

test('consulta solo Horizon Testnet y conserva saldo y emisor sin redondear', async () => {
  let called;
  const client = setup({}, async (url, options) => {
    called = { url, options };
    return { ok: true, json: async () => ({ balances: [
      { asset_type: 'native', balance: '1234.0000001' },
      { asset_type: 'credit_alphanum4', asset_code: 'USD', asset_issuer: otherAddress, balance: '2.5000000' },
    ] }) };
  });
  const balances = await client.loadBalances(address);
  assert.equal(called.url, 'https://horizon-testnet.stellar.org/accounts/' + address);
  assert.ok(called.options.signal);
  assert.deepEqual(balances, [
    { code: 'XLM', issuer: null, amount: '1234.0000001' },
    { code: 'USD', issuer: otherAddress, amount: '2.5000000' },
  ]);
});

test('extensión ausente, rechazo y red equivocada producen mensajes útiles', async (t) => {
  for (const [label, overrides, message] of [
    ['ausente', { isConnected: async () => ({ isConnected: false }) }, /Instalá Varial/],
    ['rechazo', { requestAccess: async () => ({ error: { message: 'denegado' } }) }, /No se autorizó/],
    ['sin dirección', { requestAccess: async () => ({ address: '' }) }, /dirección válida/],
    ['red', { getNetworkDetails: async () => ({ networkPassphrase: 'Public Global Stellar Network ; September 2015' }) }, /Testnet/],
    ['error de red', { getNetworkDetails: async () => ({ error: { message: 'bloqueado' } }) }, /No se pudo leer la red/],
  ]) await t.test(label, async () => {
    await assert.rejects(setup(overrides).connect(), message);
  });
});

test('cuenta sin activar se distingue de saldo cero y errores de Horizon', async () => {
  await assert.rejects(setup({}, async () => ({ ok: false, status: 404 })).loadBalances(address), /no está activada/);
  await assert.rejects(setup({}, async () => ({ ok: false, status: 503 })).loadBalances(address), /Horizon/);
  await assert.rejects(setup({}, async () => { throw new Error('offline'); }).loadBalances(address), /conexión/);
});

test('respuesta JSON incompleta muestra un error útil en español', async () => {
  await assert.rejects(setup({}, async () => ({
    ok: true, json: async () => { throw new SyntaxError('Unexpected end of JSON input'); },
  })).loadBalances(address), /respuesta inesperada/);
});

test('no publica el saldo si cuenta o red cambian durante la consulta', async () => {
  let changed = false;
  const client = setup({ getAddress: async () => ({ address: changed ? otherAddress : address }) }, async () => {
    changed = true;
    return { ok: true, json: async () => ({ balances: [{ asset_type: 'native', balance: '1.0000000' }] }) };
  });
  await assert.rejects(client.loadBalances(address), /cuenta de la wallet cambió/);
});

test('refrescar rechaza cambio de cuenta o red y no consulta el saldo', async () => {
  let calls = 0;
  for (const overrides of [
    { getAddress: async () => ({ address: otherAddress }) },
    { getNetworkDetails: async () => ({ networkPassphrase: 'mainnet' }) },
  ]) {
    await assert.rejects(setup(overrides, async () => { calls++; }).loadBalances(address));
  }
  assert.equal(calls, 0);
});

