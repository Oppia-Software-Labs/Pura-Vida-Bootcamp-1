import { describe, expect, it } from "vitest";
import { formatStroops, splitWithCap, xlmToStroops } from "./money";

describe("xlmToStroops", () => {
  it("converts whole and fractional amounts", () => {
    expect(xlmToStroops("100")).toBe(1_000_000_000n);
    expect(xlmToStroops("9999.9999999")).toBe(99_999_999_999n);
    expect(xlmToStroops("0.0000001")).toBe(1n);
  });

  it("rejects malformed amounts", () => {
    expect(() => xlmToStroops("1.12345678")).toThrow("Invalid XLM amount");
    expect(() => xlmToStroops("-1")).toThrow("Invalid XLM amount");
    expect(() => xlmToStroops("")).toThrow("Invalid XLM amount");
  });
});

describe("formatStroops", () => {
  it("trims trailing zeros", () => {
    expect(formatStroops(1_000_000_000n)).toBe("100");
    expect(formatStroops(15_000_000n)).toBe("1.5");
    expect(formatStroops(1n)).toBe("0.0000001");
    expect(formatStroops(0n)).toBe("0");
  });
});

describe("splitWithCap", () => {
  it("splits so both parts add up exactly to the total", () => {
    expect(splitWithCap(1_000_000_000n, 3000)).toEqual({ repairs: 300_000_000n, rest: 700_000_000n });
    const odd = splitWithCap(10n, 3333);
    expect(odd.repairs + odd.rest).toBe(10n);
    expect(odd.repairs).toBe(3n);
  });

  it("handles the extremes of the cap", () => {
    expect(splitWithCap(50n, 0)).toEqual({ repairs: 0n, rest: 50n });
    expect(splitWithCap(50n, 10_000)).toEqual({ repairs: 50n, rest: 0n });
  });

  it("rejects invalid input", () => {
    expect(() => splitWithCap(0n, 3000)).toThrow("Invalid total amount");
    expect(() => splitWithCap(100n, 10_001)).toThrow("Invalid repair cap");
    expect(() => splitWithCap(100n, -1)).toThrow("Invalid repair cap");
    expect(() => splitWithCap(100n, 12.5)).toThrow("Invalid repair cap");
  });
});
