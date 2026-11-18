import { Horizon, rpc } from "@stellar/stellar-sdk";
import { network } from "@config/network";

export const horizon = new Horizon.Server(network.horizonUrl);
export const rpcServer = new rpc.Server(network.rpcUrl);
