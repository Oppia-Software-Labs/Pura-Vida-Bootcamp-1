import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as relataUi from "../src/relata-ui.js";

const {
  TESTNET_PASSPHRASE,
  WRONG_NETWORK_MESSAGE,
  buildPaymentViewModel,
  formatAccountSuffix,
  formatLoadedStatus,
  formatOmittedNotice,
  formatPaymentDate,
  formatShortAddress,
  getNextTheme,
  mapHorizonError,
  mapWalletError,
  resolveInitialTheme,
  selectSpanishVoice,
  validateCustomAddress,
  validateMovementCount,
  validateWalletConnection,
} = relataUi;

const sampleAccount = `GAAA${"B".repeat(48)}7K2M`;
const counterpartyA = `GBBB${"C".repeat(48)}4M5P`;
const counterpartyB = `GCCC${"D".repeat(48)}6Q7R`;

test("does not expose a hardcoded demo preset and enforces Testnet passphrase", () => {
  assert.equal("DEMO_ACCOUNT" in relataUi, false);
  assert.equal(TESTNET_PASSPHRASE, "Test SDF Network ; September 2015");
});

test("blocks non-Testnet networks when a wallet exposes network details and never auto-switches", () => {
  const mainnet = validateWalletConnection({
    address: sampleAccount,
    walletName: "Varial",
    networkDetails: {
      network: "PUBLIC",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
      networkUrl: "https://horizon.stellar.org",
    },
  });
  assert.deepEqual(mainnet, { ok: false, code: "wrong_network", message: WRONG_NETWORK_MESSAGE });
  assert.equal(
    WRONG_NETWORK_MESSAGE,
    "Relata funciona con la red de pruebas en esta versión. Cambia tu wallet a Testnet para continuar.",
  );

  const labelSpoof = validateWalletConnection({
    address: sampleAccount,
    walletName: "Varial",
    networkDetails: {
      network: "TESTNET",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
    },
  });
  assert.equal(labelSpoof.ok, false);
  assert.equal(labelSpoof.code, "wrong_network");
});

test("handles verified Testnet, unsupported getNetwork wallets, network read errors, and invalid addresses", () => {
  const verified = validateWalletConnection({
    address: sampleAccount,
    walletName: "Varial",
    networkDetails: { network: "TESTNET", networkPassphrase: TESTNET_PASSPHRASE },
  });
  assert.deepEqual(verified, {
    ok: true,
    address: sampleAccount,
    walletName: "Varial",
    networkVerified: true,
  });

  const unsupportedGetNetwork = validateWalletConnection({
    address: sampleAccount,
    walletName: "LOBSTR",
    networkError: { code: -3, message: 'Lobstr does not support the "getNetwork" function' },
  });
  assert.deepEqual(unsupportedGetNetwork, {
    ok: true,
    address: sampleAccount,
    walletName: "LOBSTR",
    networkVerified: false,
  });

  const realNetworkReadError = validateWalletConnection({
    address: sampleAccount,
    walletName: "Varial",
    networkError: { code: -1, message: "Extension locked" },
  });
  assert.equal(realNetworkReadError.ok, false);
  assert.equal(realNetworkReadError.code, "network_details_error");

  const invalidAddress = validateWalletConnection({
    address: "invalid",
    walletName: "xBull",
    networkDetails: { networkPassphrase: TESTNET_PASSPHRASE },
  });
  assert.equal(invalidAddress.ok, false);
  assert.equal(invalidAddress.code, "invalid_account");
});

test("formats dates, address abbreviations, omitted-operations notices, and Horizon errors in Spanish", () => {
  assert.equal(formatPaymentDate("2026-11-15T10:30:00Z", { timeZone: "UTC" }), "15 de noviembre a las 10:30");
  assert.equal(formatPaymentDate("2026-11-15T00:05:00Z", { timeZone: "UTC" }), "15 de noviembre a las 00:05");
  assert.equal(formatAccountSuffix(counterpartyA), "4M5P");
  assert.equal(formatShortAddress(counterpartyA), "GBBB…4M5P");

  assert.equal(formatOmittedNotice(0), "");
  assert.equal(
    formatOmittedNotice(1),
    "Se omitió 1 operación que Relata todavía no sabe explicar en los registros revisados.",
  );
  assert.equal(
    formatOmittedNotice(2),
    "Se omitieron 2 operaciones que Relata todavía no sabe explicar en los registros revisados.",
  );

  assert.match(mapHorizonError({ code: "account_not_found" }), /no existe en Testnet/i);
  assert.match(mapHorizonError({ code: "rate_limited" }), /límite de consultas/i);
  assert.match(mapHorizonError({ code: "network_error" }), /consultar Stellar Testnet/i);
});

test("builds a complete payment view model using describePayment without attributing identities", () => {
  const vm = buildPaymentViewModel({
    id: "1001",
    pagingToken: "1001",
    direction: "received",
    counterparty: counterpartyA,
    amount: "5.0000000",
    asset: "USDC",
    createdAt: "2026-11-15T21:04:50Z",
    status: "completed",
  }, { timeZone: "UTC" });

  assert.equal(vm.directionLabel, "Recibido");
  assert.equal(vm.amount, "5.0000000");
  assert.equal(vm.assetLabel, "USDC de Testnet verificado");
  assert.equal(vm.shortCounterparty, "GBBB…4M5P");
  assert.equal(vm.accountSuffix, "4M5P");
  assert.equal(vm.statusLabel, "Completado");
  assert.equal(
    vm.explanation,
    "Recibiste 5.0000000 USDC el 15 de noviembre a las 21:04. El pago provino de una cuenta terminada en 4M5P y se completó correctamente en la red de pruebas.",
  );
});

test("selects an available Spanish speech synthesis voice and returns null when none exists", () => {
  const englishOnly = [{ name: "Microsoft David", lang: "en-US", localService: true }];
  assert.equal(selectSpanishVoice(englishOnly), null);

  const mixed = [
    { name: "Microsoft David", lang: "en-US", localService: true },
    { name: "Google español", lang: "es-ES", localService: false },
    { name: "Microsoft Sabina", lang: "es-MX", localService: true },
  ];
  assert.equal(selectSpanishVoice(mixed)?.name, "Microsoft Sabina");
});

test("maps wallet connection modal closure, declined access, missing extensions, and ambiguous network states", () => {
  const closed = mapWalletError({ code: -1, message: "The user closed the modal." });
  assert.equal(closed.code, "modal_closed");
  assert.equal(closed.tone, "info");

  const declined = mapWalletError({ code: -4, message: "User declined access" }, "Varial");
  assert.equal(declined.code, "access_rejected");
  assert.equal(declined.tone, "error");

  const missingExt = mapWalletError(new Error("Lobstr is not connected"), "LOBSTR");
  assert.equal(missingExt.code, "wallet_unavailable");
  assert.equal(missingExt.tone, "error");
  assert.match(missingExt.message, /LOBSTR/i);

  for (const networkDetails of [undefined, null, {}, { network: "TESTNET" }]) {
    const res = validateWalletConnection({
      address: sampleAccount,
      walletName: "Varial",
      networkDetails,
    });
    assert.equal(res.ok, false);
    assert.equal(res.code, "wrong_network");
    assert.equal(res.message, WRONG_NETWORK_MESSAGE);
  }
  assert.equal(
    validateWalletConnection({
      address: sampleAccount,
      walletName: "Varial",
      networkDetails: { networkPassphrase: TESTNET_PASSPHRASE, error: { message: "rpc error" } },
    }).code,
    "network_details_error",
  );
  assert.equal(
    validateWalletConnection({ address: "", walletName: "Albedo" }).code,
    "wallet_missing_address",
  );
});

test("handles edge cases for Spanish voice selection, omitted notices, and invalid addresses", () => {
  assert.equal(selectSpanishVoice(null), null);
  assert.equal(selectSpanishVoice(undefined), null);
  assert.equal(selectSpanishVoice([]), null);
  assert.equal(selectSpanishVoice([{ name: "Broken", lang: 123 }]), null);

  const crVoice = { name: "Voz CR", lang: "ES-CR", localService: true };
  assert.equal(
    selectSpanishVoice([{ name: "English", lang: "en-US", localService: true }, crVoice]),
    crVoice,
  );
  const remoteEs = { name: "Google español", lang: "es-ES", localService: false };
  assert.equal(
    selectSpanishVoice([{ name: "English", lang: "en-US", localService: true }, remoteEs]),
    remoteEs,
  );

  assert.equal(formatOmittedNotice(-1), "");
  assert.equal(formatOmittedNotice(1.5), "");
  assert.equal(formatAccountSuffix("G123"), "");
  assert.equal(formatShortAddress("G123"), "");
  assert.equal(formatAccountSuffix(sampleAccount, 0), "");
});

test("validates user-entered public Testnet addresses, trims whitespace, and warns against secret seeds", () => {
  assert.deepEqual(validateCustomAddress(`  ${sampleAccount}  `), {
    ok: true,
    address: sampleAccount,
  });

  const empty = validateCustomAddress("   ");
  assert.equal(empty.ok, false);
  assert.equal(empty.code, "empty_account");

  const secretSeed = validateCustomAddress(`S${"A".repeat(55)}`);
  assert.equal(secretSeed.ok, false);
  assert.equal(secretSeed.code, "secret_key_rejected");
  assert.match(secretSeed.message, /clave secreta/i);

  for (const bad of ["g" + sampleAccount.slice(1), "https://horizon.stellar.org", "G123", null]) {
    const res = validateCustomAddress(bad);
    assert.equal(res.ok, false);
    assert.equal(res.code, "invalid_account");
  }
});

test("validates user-entered movement count (default 5, range 1 to 50) and formats verified EURC labels", () => {
  assert.deepEqual(validateMovementCount(""), { ok: true, limit: 5 });
  assert.deepEqual(validateMovementCount("  5  "), { ok: true, limit: 5 });
  assert.deepEqual(validateMovementCount("1"), { ok: true, limit: 1 });
  assert.deepEqual(validateMovementCount("50"), { ok: true, limit: 50 });
  assert.deepEqual(validateMovementCount(12), { ok: true, limit: 12 });

  for (const bad of ["0", "-2", "51", "2.5", "abc", null]) {
    const res = validateMovementCount(bad);
    assert.equal(res.ok, false);
    assert.equal(res.code, "invalid_limit");
  }

  const eurcVm = buildPaymentViewModel({
    id: "1002",
    pagingToken: "1002",
    direction: "received",
    counterparty: counterpartyB,
    amount: "20.0000000",
    asset: "EURC",
    createdAt: "2026-11-15T20:52:05Z",
    status: "completed",
  }, { timeZone: "UTC" });
  assert.equal(eurcVm.assetLabel, "EURC de Testnet verificado");
  assert.equal(
    eurcVm.explanation,
    "Recibiste 20.0000000 EURC el 15 de noviembre a las 20:52. El pago provino de una cuenta terminada en 6Q7R y se completó correctamente en la red de pruebas.",
  );
});

test("rejects boundary movement counts and malformed secret-like or undefined custom addresses", () => {
  for (const badCount of ["5abc", "1e1", 0, 51, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, undefined, true]) {
    const res = validateMovementCount(badCount);
    assert.equal(res.ok, false);
    assert.equal(res.code, "invalid_limit");
  }
  for (const badAddr of ["s" + "A".repeat(55), "S" + "A".repeat(54), "S" + "A".repeat(56), undefined]) {
    const res = validateCustomAddress(badAddr);
    assert.equal(res.ok, false);
    assert.equal(res.code, "invalid_account");
  }
});

test("keeps index.html, src/app.js, and README.md free of removed demo controls and aligned on DOM IDs", async () => {
  const [html, appSource, readme] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/app.js", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);
  for (const text of [html, appSource, readme]) {
    for (const token of ["Probar la demo", "demo-btn", "handleDemo", "DEMO_ACCOUNT", "demo_unconfigured"]) {
      assert.equal(text.toLowerCase().includes(token.toLowerCase()), false);
    }
  }
  assert.equal(html.includes("connect-wallet-btn"), true);
  assert.equal(html.includes("refresh-wallet-btn"), true);
  assert.equal(html.includes("theme-toggle-btn"), true);
  assert.equal(html.includes("connect-varial-btn"), false);
  assert.equal(appSource.includes("window.freighterApi"), false);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, id] of appSource.matchAll(/document\.getElementById\("([^"]+)"\)/g)) {
    assert.ok(htmlIds.has(id), `Missing DOM id in index.html: ${id}`);
  }
});

test("pins stellar-wallets-kit local bundle without WalletConnect, Varial SDK, or remote CDN scripts", async () => {
  const [pkgRaw, bundle, entry, html, serverSrc] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../vendor/stellar-wallets-kit/index.js", import.meta.url), "utf8"),
    readFile(new URL("../src/wallet-kit-entry.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../server.js", import.meta.url), "utf8"),
  ]);
  const pkg = JSON.parse(pkgRaw);
  assert.equal(pkg.dependencies["@creit.tech/stellar-wallets-kit"], "2.8.0");
  assert.equal(pkg.devDependencies.esbuild, "0.28.2");
  assert.match(entry, /defaultModules/);

  for (const forbidden of ["WalletConnectModule", "@reown/appkit", "@walletconnect", "projectId"]) {
    assert.equal(bundle.includes(forbidden), false, `Unexpected WalletConnect token in bundle: ${forbidden}`);
  }
  assert.equal(/<script[^>]+src\s*=\s*["']https?:/i.test(html), false);
  assert.equal(serverSrc.includes("vendor/varial-sdk"), false);
  assert.equal(serverSrc.includes("/vendor/stellar-wallets-kit/index.js"), true);
  assert.equal(serverSrc.includes("/vendor/stellar-wallets-kit/NOTICE.md"), true);
});

test("formats clear connected and query-completed status messages for 0, 1, and multiple payments", () => {
  assert.equal(
    formatLoadedStatus({ address: sampleAccount, count: 1, walletName: "Varial" }),
    "Wallet conectada (Varial · GAAA…7K2M). Mostrando 1 pago compatible.",
  );
  assert.equal(
    formatLoadedStatus({ address: sampleAccount, count: 5, walletName: "LOBSTR" }),
    "Wallet conectada (LOBSTR · GAAA…7K2M). Mostrando 5 pagos compatibles.",
  );
  assert.equal(
    formatLoadedStatus({ address: sampleAccount, count: 0, walletName: "xBull" }),
    "Wallet conectada (xBull · GAAA…7K2M). No encontramos pagos compatibles recientes (XLM, USDC o EURC verificado de Testnet en operaciones simples completadas).",
  );
  assert.equal(
    formatLoadedStatus({ address: sampleAccount, count: 3 }),
    "Consulta completada (GAAA…7K2M). Mostrando 3 pagos compatibles.",
  );
});

test("resolves and toggles light/dark UI themes cleanly", async () => {
  assert.equal(resolveInitialTheme({ savedTheme: "dark", prefersDark: false }), "dark");
  assert.equal(resolveInitialTheme({ savedTheme: "light", prefersDark: true }), "light");
  assert.equal(resolveInitialTheme({ savedTheme: "invalid", prefersDark: true }), "dark");
  assert.equal(resolveInitialTheme({ savedTheme: null, prefersDark: false }), "light");
  assert.equal(getNextTheme("light"), "dark");
  assert.equal(getNextTheme("dark"), "light");

  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  assert.equal(css.includes(':root[data-theme="dark"]'), true);
});
