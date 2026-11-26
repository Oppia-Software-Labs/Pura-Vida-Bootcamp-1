import { NotFoundError, StrKey } from "@stellar/stellar-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TESTNET } from "@/lib/stellar/constants";

import { sendPayment } from "./payment";

const SOURCE = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const DESTINATION = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 2));

const loadAccount = vi.fn();
const submitTransaction = vi.fn();
const signPaymentTransaction = vi.fn();

vi.mock("@/lib/stellar/client", () => ({
  getHorizonServer: () => ({ loadAccount, submitTransaction }),
}));

// The real adapter talks to a browser extension; only its contract matters here.
vi.mock("@/features/wallet/services/varial-wallet", () => ({
  WalletAdapterError: class WalletAdapterError extends Error {},
  mapSdkError: (error: unknown) => ({ message: String(error) }),
  signPaymentTransaction: (...args: unknown[]) => signPaymentTransaction(...args),
}));

const input = {
  sourceAddress: SOURCE,
  destination: DESTINATION,
  amount: "10",
  memo: "test",
  networkPassphrase: TESTNET.passphrase,
  spendableXlm: "100",
};

describe("sendPayment", () => {
  beforeEach(() => {
    loadAccount.mockReset();
    submitTransaction.mockReset();
    signPaymentTransaction.mockReset();
  });

  it("stops before the signature request when the destination account does not exist", async () => {
    loadAccount.mockImplementation(async (address: string) => {
      if (address === SOURCE) return { account_id: SOURCE, sequence: "1" };
      throw new NotFoundError("Not Found", {});
    });

    const result = await sendPayment(input);

    expect(result).toEqual({
      ok: false,
      error: {
        reason: "unknown",
        message:
          "The destination account does not exist on Testnet. It has to be funded before it can receive a payment.",
      },
    });
    expect(loadAccount).toHaveBeenCalledWith(DESTINATION);
    expect(signPaymentTransaction).not.toHaveBeenCalled();
    expect(submitTransaction).not.toHaveBeenCalled();
  });

  it("still asks for a signature when the destination account exists", async () => {
    loadAccount.mockImplementation(async (address: string) => ({
      account_id: address,
      sequence: "1",
    }));
    signPaymentTransaction.mockRejectedValue(new Error("declined"));

    await sendPayment(input);

    expect(loadAccount).toHaveBeenCalledWith(DESTINATION);
    expect(signPaymentTransaction).toHaveBeenCalledTimes(1);
  });
});
