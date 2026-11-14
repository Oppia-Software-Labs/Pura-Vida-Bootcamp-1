import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";


StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
});

export async function connectWallet() {
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectWallet() {
  await StellarWalletsKit.disconnect();
}