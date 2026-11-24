import { Keypair } from "@stellar/stellar-sdk";
import { errorMessage } from "../lib/stellar/errors.ts";
import { fundTestAccount } from "../lib/stellar/friendbot.ts";
import { verifiedTestnetServer } from "../lib/stellar/server.ts";

try {
  // Solo conservamos la dirección pública. Este proceso no escribe secretos.
  const address = Keypair.random().publicKey();
  await fundTestAccount(address);
  const server = await verifiedTestnetServer();
  await server.loadAccount(address);
  process.stdout.write(address + "\n");
} catch (error) {
  process.stderr.write(errorMessage(error) + "\n");
  process.exitCode = 1;
}
