import { describe, expect, it } from "vitest";
import { formatStroops, xlmToStroops } from "./money";

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
