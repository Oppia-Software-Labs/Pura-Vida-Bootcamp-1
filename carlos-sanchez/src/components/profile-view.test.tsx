import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Attestation } from "../bindings/proofolio/src";
import { translations } from "../lib/i18n";
import { listAttestations } from "../lib/proofolio";
import { ProfileView } from "./profile-view";

vi.mock("../lib/proofolio", () => ({
  listAttestations: vi.fn(),
}));

const recipient = "GA6HBRP3FENGDRF33D2D7CQY5PKKVKPLHMP63XLLKHPBWATI2CER2SYD";

const records: Attestation[] = [
  {
    id: 1n,
    issuer: "GCKJIADXZF5JJDAPQBIRFXQXGNECVSVTWP535LWZHXIAZMDQ2Y5VXO4O",
    recipient,
    repo: "Oppia-Software-Labs/Pura-Vida-Bootcamp-1",
    pr_number: 1,
    kind: { tag: "Docs", values: undefined },
    issued_at: 1_794_889_251n,
  },
];

describe("ProfileView", () => {
  beforeEach(() => {
    vi.mocked(listAttestations).mockReset();
  });

  it("renders an on-chain timeline and grouped project using a simulated adapter", async () => {
    vi.mocked(listAttestations).mockResolvedValue(records);

    render(<ProfileView address={recipient} copy={translations.es} locale="es" />);

    expect(
      await screen.findByRole("link", {
        name: /Oppia-Software-Labs\/Pura-Vida-Bootcamp-1 #1/i,
      }),
    ).toHaveAttribute(
      "href",
      "https://github.com/Oppia-Software-Labs/Pura-Vida-Bootcamp-1/pull/1",
    );
    expect(screen.getByText("Documentación")).toBeInTheDocument();
    expect(screen.getByText("1 contribución")).toBeInTheDocument();
  });

  it("renders an explicit empty state", async () => {
    vi.mocked(listAttestations).mockResolvedValue([]);

    render(<ProfileView address={recipient} copy={translations.es} locale="es" />);

    expect(
      await screen.findByText("Este perfil todavía no tiene reconocimientos"),
    ).toBeInTheDocument();
  });
});
