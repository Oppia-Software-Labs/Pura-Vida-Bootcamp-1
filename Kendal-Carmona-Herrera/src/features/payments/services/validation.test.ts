import { StrKey } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";

import {
  maxSendableXlm,
  normalizeAmount,
  validateAmount,
  validateDestination,
  validateMemo,
  validatePayment,
  validatePaymentFields,
} from "./validation";

/** A real, checksummed account address instead of a hand-typed string. */
const VALID_ADDRESS = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 7));

describe("validateDestination", () => {
  it("requires a value", () => {
    expect(validateDestination("   ")).toBe("Enter a destination address.");
  });

  it("accepts a checksummed Stellar address", () => {
    expect(validateDestination(VALID_ADDRESS)).toBeNull();
  });

  it("rejects an address whose checksum does not hold", () => {
    const tampered = `${VALID_ADDRESS.slice(0, -1)}A`;
    expect(validateDestination(tampered)).toBe(
      "That is not a valid Stellar account address.",
    );
  });

  it("rejects a truncated address", () => {
    expect(validateDestination(VALID_ADDRESS.slice(0, 20))).not.toBeNull();
  });
});

describe("validateAmount", () => {
  it("requires a value", () => {
    expect(validateAmount("", "100")).toBe("Enter an amount to send.");
  });

  it("rejects formats the protocol cannot parse", () => {
    const message = "Use a plain decimal amount with up to 7 decimals.";
    expect(validateAmount("1.12345678", "100")).toBe(message);
    expect(validateAmount("1,5", "100")).toBe(message);
    expect(validateAmount("1e5", "100")).toBe(message);
    expect(validateAmount("-1", "100")).toBe(message);
  });

  it("rejects zero", () => {
    expect(validateAmount("0", "100")).toBe(
      "The amount must be greater than 0.",
    );
    expect(validateAmount("0.0000000", "100")).toBe(
      "The amount must be greater than 0.",
    );
  });

  it("counts the fee against the spendable balance", () => {
    // 99.99999 + 0.00001 fee lands exactly on the spendable amount.
    expect(validateAmount("99.99999", "100")).toBeNull();
    // One stroop more and the fee no longer fits.
    expect(validateAmount("99.999999", "100")).toContain(
      "more than your spendable balance",
    );
  });

  it("refuses the full spendable amount, since the fee is charged on top", () => {
    expect(validateAmount("100", "100")).toContain(
      "more than your spendable balance",
    );
  });

  it("names the real maximum and the fee instead of claiming the fee is already reserved", () => {
    const message = validateAmount("100", "100");

    expect(message).toBe(
      "That is more than your spendable balance allows. The 0.00001 XLM network fee is added on top, so the most you can send is 99.99999 XLM.",
    );
    expect(message).not.toContain("already reserves");
  });
});

describe("maxSendableXlm", () => {
  it("is the spendable balance minus the network fee", () => {
    expect(maxSendableXlm("100")).toBe("99.99999");
    expect(maxSendableXlm("9999")).toBe("9998.99999");
  });

  it("never goes below zero when the fee does not fit", () => {
    expect(maxSendableXlm("0")).toBe("0");
    expect(maxSendableXlm("0.000005")).toBe("0");
  });
});

describe("validateMemo", () => {
  it("accepts an absent memo", () => {
    expect(validateMemo("")).toBeNull();
  });

  it("accepts a memo of exactly 28 bytes", () => {
    expect(validateMemo("a".repeat(28))).toBeNull();
  });

  it("counts bytes, not characters", () => {
    expect(validateMemo("a".repeat(29))).toContain("29 bytes");
    // Eight rockets are 32 bytes of UTF-8, even though they are eight characters.
    expect(validateMemo("🚀".repeat(8))).toContain("32 bytes");
    expect(validateMemo("ñ".repeat(15))).toContain("30 bytes");
  });
});

describe("validatePayment", () => {
  const base = {
    destination: VALID_ADDRESS,
    amount: "10",
    memo: "",
    spendableXlm: "100",
  };

  it("accepts a complete, valid payment", () => {
    expect(validatePayment(base)).toBeNull();
  });

  it("reports the first failing field in form order", () => {
    expect(
      validatePayment({ ...base, destination: "nope", amount: "nope" }),
    ).toEqual({
      field: "destination",
      message: "That is not a valid Stellar account address.",
    });

    expect(validatePayment({ ...base, amount: "nope" })).toEqual({
      field: "amount",
      message: "Use a plain decimal amount with up to 7 decimals.",
    });

    expect(validatePayment({ ...base, memo: "a".repeat(29) })).toEqual({
      field: "memo",
      message: expect.stringContaining("29 bytes"),
    });
  });
});

describe("validatePaymentFields", () => {
  const base = {
    destination: VALID_ADDRESS,
    amount: "10",
    memo: "",
    spendableXlm: "100",
  };

  it("returns no errors for a valid payment", () => {
    expect(validatePaymentFields(base)).toEqual([]);
  });

  it("reports every failing field at once, in form order", () => {
    expect(
      validatePaymentFields({
        ...base,
        destination: "",
        amount: "",
        memo: "a".repeat(29),
      }),
    ).toEqual([
      { field: "destination", message: "Enter a destination address." },
      { field: "amount", message: "Enter an amount to send." },
      { field: "memo", message: expect.stringContaining("29 bytes") },
    ]);
  });
});

describe("normalizeAmount", () => {
  it("canonicalises the value that reaches the operation", () => {
    expect(normalizeAmount("12.5000000")).toBe("12.5");
    expect(normalizeAmount("007")).toBe("7");
    expect(normalizeAmount("0.0000001")).toBe("0.0000001");
  });
});
