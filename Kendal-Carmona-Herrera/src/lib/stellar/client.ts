import { Horizon } from "@stellar/stellar-sdk";
import { stellarConfig } from "./config";

type HorizonServer = InstanceType<typeof Horizon.Server>;

let horizonServer: HorizonServer | null = null;

/**
 * One Horizon client for the whole app, created lazily so importing this module on
 * the server during render does not open a connection nobody asked for.
 */
export function getHorizonServer(): HorizonServer {
  if (horizonServer === null) {
    horizonServer = new Horizon.Server(stellarConfig.horizonUrl);
  }

  return horizonServer;
}
