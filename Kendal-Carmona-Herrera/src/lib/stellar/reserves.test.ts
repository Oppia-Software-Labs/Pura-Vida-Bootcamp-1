import { describe, expect, it } from "vitest";

import {
  STROOPS_PER_XLM,
  computeMinimumBalanceXlm,
  computeSpendableXlm,
  stroopsToXlm,
  xlmToStroops,
} from "./reserves";

describe("xlmToStroops", () => {
  it("converts whole amounts with the protocol's seven decimals", () => {
    expect(xlmToStroops("1")).toBe(STROOPS_PER_XLM);
  });

  it("keeps fractional amounts exact", () => {
    expect(xlmToStroops("1.5")).toBe(BigInt(15_000_000));
    expect(xlmToStroops("0.0000001")).toBe(BigInt(1));
  });

  it("parses the zero-padded form Horizon actually returns", () => {
    expect(xlmToStroops("100.0000000")).toBe(BigInt(1_000_000_000));
  });

  it("refuses anything that is not a plain decimal amount", () => {
    expect(() => xlmToStroops("")).toThrow(RangeError);
    expect(() => xlmToStroops("abc")).toThrow(RangeError);
    expect(() => xlmToStroops("1.12345678")).toThrow(RangeError);
    expect(() => xlmToStroops("1,5")).toThrow(RangeError);
    expect(() => xlmToStroops("1e5")).toThrow(RangeError);
  });
});

describe("stroopsToXlm", () => {
  it("drops a zero fraction instead of padding it", () => {
    expect(stroopsToXlm(BigInt(10_000_000))).toBe("1");
  });

  it("renders the smallest unit without losing it", () => {
    expect(stroopsToXlm(BigInt(1))).toBe("0.0000001");
  });

  it("trims only trailing zeros", () => {
    expect(stroopsToXlm(BigInt(15_000_000))).toBe("1.5");
    expect(stroopsToXlm(BigInt(10_000_010))).toBe("1.000001");
  });

  it("clamps negatives to zero rather than rendering a negative balance", () => {
    expect(stroopsToXlm(BigInt(-5))).toBe("0");
  });
});

describe("computeMinimumBalanceXlm", () => {
  it("requires two base reserves for a bare account", () => {
    expect(computeMinimumBalanceXlm(0)).toBe("1");
  });

  it("adds half an XLM per subentry", () => {
    expect(computeMinimumBalanceXlm(3)).toBe("2.5");
    expect(computeMinimumBalanceXlm(10)).toBe("6");
  });

  it("ignores a nonsensical subentry count instead of producing a bad reserve", () => {
    expect(computeMinimumBalanceXlm(-4)).toBe("1");
    expect(computeMinimumBalanceXlm(Number.NaN)).toBe("1");
    expect(computeMinimumBalanceXlm(2.9)).toBe(computeMinimumBalanceXlm(2));
  });
});

describe("computeSpendableXlm", () => {
  it("subtracts the minimum reserve from the raw balance", () => {
    expect(computeSpendableXlm("100", 0, "0")).toBe("99");
  });

  it("subtracts subentries and selling liabilities together", () => {
    expect(computeSpendableXlm("100", 3, "0")).toBe("97.5");
    expect(computeSpendableXlm("100", 0, "10")).toBe("89");
  });

  it("never reports a negative spendable amount", () => {
    expect(computeSpendableXlm("2", 0, "1.5")).toBe("0");
    expect(computeSpendableXlm("1", 0, "0")).toBe("0");
  });
});
