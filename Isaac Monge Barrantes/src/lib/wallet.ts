import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

// Wallets Kit v2 es un singleton estático: se inicializa una sola vez.
// defaultModules() carga Varial (Freighter), xBull, Albedo, LOBSTR, Rabet, Hana, etc.
StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
});

export { StellarWalletsKit };
