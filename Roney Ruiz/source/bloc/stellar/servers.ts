import { Horizon } from "@stellar/stellar-sdk";
import { network } from "@config/network";

export const horizon = new Horizon.Server(network.horizonUrl);
