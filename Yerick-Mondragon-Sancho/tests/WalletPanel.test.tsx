// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { WalletPanel } from "../src/components/WalletPanel";
import type { useWallet } from "../src/hooks/useWallet";
import { TESTNET_PASSPHRASE } from "../src/stellar/wallet";

const address = `G${"A".repeat(55)}`;
const wallet: ReturnType<typeof useWallet> = {
  phase: "connected",
  identity: {
    address,
    network: "TESTNET",
    networkPassphrase: TESTNET_PASSPHRASE,
  },
  account: { kind: "funded", balance: "1.0000001" },
  error: null,
  missingWallet: false,
  updatedAt: new Date(),
  authorized: true,
  busy: false,
  disconnecting: false,
  connect: vi.fn(),
  refresh: vi.fn(),
  disconnectWallet: vi.fn(),
};
afterEach(cleanup);

it("copia exactamente la dirección recibida de la wallet", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(<WalletPanel wallet={wallet} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Copiar dirección pública" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe("Dirección copiada"),
  );
  expect(writeText).toHaveBeenCalledWith(address);
});

it("ofrece copia manual si el navegador bloquea el portapapeles", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
  });
  render(<WalletPanel wallet={wallet} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Copiar dirección pública" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain(
      "cópiela manualmente",
    ),
  );
  expect(screen.getByText(address)).toBeTruthy();
});
