// Stellar Wallets Kit touches `window` and registers web components, so it can
// only run in the browser. Load and initialise it lazily, once.
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit/types";

type Kit = typeof import("@creit.tech/stellar-wallets-kit").StellarWalletsKit;

let kitPromise: Promise<Kit> | undefined;

export function getWalletKit(): Promise<Kit> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Wallet kit is only available in the browser"));
  }
  kitPromise ??= (async () => {
    const [{ StellarWalletsKit, Networks }, { AlbedoModule }, { FreighterModule }, { xBullModule }, { LobstrModule }] =
      await Promise.all([
        import("@creit.tech/stellar-wallets-kit"),
        import("@creit.tech/stellar-wallets-kit/modules/albedo"),
        import("@creit.tech/stellar-wallets-kit/modules/freighter"),
        import("@creit.tech/stellar-wallets-kit/modules/xbull"),
        import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
      ]);
    StellarWalletsKit.init({
      modules: [new FreighterModule(), new AlbedoModule(), new xBullModule(), new LobstrModule()],
      network: Networks.TESTNET,
    });
    return StellarWalletsKit;
  })().catch((err) => {
    kitPromise = undefined;
    throw err;
  });
  return kitPromise;
}

export type { ISupportedWallet };
