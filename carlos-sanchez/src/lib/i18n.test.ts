import { describe, expect, it } from "vitest";
import { translations } from "./i18n";

describe("translations", () => {
  it("keeps the Spanish and English dictionaries structurally aligned", () => {
    expect(Object.keys(translations.en)).toEqual(Object.keys(translations.es));
    expect(Object.keys(translations.en.kinds)).toEqual(Object.keys(translations.es.kinds));
    expect(translations.en.howSteps).toHaveLength(translations.es.howSteps.length);
  });

  it("uses Spanish as the product's authored default", () => {
    expect(translations.es.testnet).toBe("Solo Testnet");
    expect(translations.es.newRecognition).toBe("Crear reconocimiento");
  });
});
