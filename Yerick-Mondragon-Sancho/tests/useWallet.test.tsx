// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as service from "../src/stellar/wallet";
import { useWallet } from "../src/hooks/useWallet";

vi.mock("../src/stellar/wallet", async (original) => ({
  ...(await original<typeof import("../src/stellar/wallet")>()),
  detectWallet: vi.fn(),
  authorizeWallet: vi.fn(),
  readWalletIdentity: vi.fn(),
  loadTestnetBalance: vi.fn(),
  revokeWalletAccess: vi.fn(),
}));
const identity = {
  address: `G${"A".repeat(55)}`,
  network: "TESTNET",
  networkPassphrase: service.TESTNET_PASSPHRASE,
};
beforeEach(() => {
  vi.mocked(service.detectWallet).mockResolvedValue(true);
  vi.mocked(service.authorizeWallet).mockResolvedValue();
  vi.mocked(service.readWalletIdentity).mockResolvedValue(identity);
  vi.mocked(service.loadTestnetBalance).mockResolvedValue({
    kind: "funded",
    balance: "5.0000000",
  });
  vi.mocked(service.revokeWalletAccess).mockResolvedValue();
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("no accede a la wallet al abrir la página", () => {
  const { result } = renderHook(() => useWallet());
  expect(result.current.phase).toBe("disconnected");
  expect(service.detectWallet).not.toHaveBeenCalled();
  expect(service.authorizeWallet).not.toHaveBeenCalled();
  expect(service.loadTestnetBalance).not.toHaveBeenCalled();
});
it("no autoriza ni consulta saldo si no existe la extensión", async () => {
  vi.mocked(service.detectWallet).mockResolvedValue(false);
  const { result } = renderHook(() => useWallet());
  await act(() => result.current.connect());
  expect(result.current.missingWallet).toBe(true);
  expect(service.authorizeWallet).not.toHaveBeenCalled();
  expect(service.loadTestnetBalance).not.toHaveBeenCalled();
});
it("un rechazo conserva la sesión desconectada", async () => {
  vi.mocked(service.authorizeWallet).mockRejectedValue(
    new service.WalletError("rejected", "Rechazado"),
  );
  const { result } = renderHook(() => useWallet());
  await act(() => result.current.connect());
  expect(result.current.authorized).toBe(false);
  expect(result.current.account).toBeNull();
});
it("bloquea el saldo si la wallet usa otra red", async () => {
  vi.mocked(service.readWalletIdentity).mockResolvedValue({
    ...identity,
    network: "PUBLIC",
  });
  const { result } = renderHook(() => useWallet());
  await act(() => result.current.connect());
  expect(result.current.phase).toBe("wrong-network");
  expect(service.loadTestnetBalance).not.toHaveBeenCalled();
});
it("actualiza el saldo sin solicitar un segundo permiso", async () => {
  const { result } = renderHook(() => useWallet());
  await act(() => result.current.connect());
  await act(() => result.current.refresh());
  expect(result.current.account).toEqual({
    kind: "funded",
    balance: "5.0000000",
  });
  expect(service.authorizeWallet).toHaveBeenCalledOnce();
});
it("borra el saldo anterior al cambiar de red", async () => {
  const { result } = renderHook(() => useWallet());
  await act(() => result.current.connect());
  vi.mocked(service.readWalletIdentity).mockResolvedValue({
    ...identity,
    network: "PUBLIC",
  });
  await act(() => result.current.refresh());
  expect(result.current.phase).toBe("wrong-network");
  expect(result.current.account).toBeNull();
});
it("descarta el saldo si cambia la cuenta durante la consulta", async () => {
  vi.mocked(service.readWalletIdentity)
    .mockResolvedValueOnce(identity)
    .mockResolvedValue({ ...identity, address: `G${"B".repeat(55)}` });
  const { result } = renderHook(() => useWallet());
  await act(() => result.current.connect());
  expect(result.current.account).toBeNull();
  expect(result.current.identity?.address).toBe(`G${"B".repeat(55)}`);
});
it("ignora una respuesta tardía después de desconectar", async () => {
  let finishBalance!: (value: service.AccountBalance) => void;
  vi.mocked(service.loadTestnetBalance).mockReturnValue(
    new Promise((resolve) => {
      finishBalance = resolve;
    }),
  );
  const { result } = renderHook(() => useWallet());
  let pending!: Promise<void>;
  await act(async () => {
    pending = result.current.connect();
    await Promise.resolve();
  });
  await act(() => result.current.disconnectWallet());
  await act(async () => {
    finishBalance({ kind: "funded", balance: "99.0000000" });
    await pending;
  });
  expect(result.current.phase).toBe("disconnected");
  expect(result.current.identity).toBeNull();
  expect(result.current.account).toBeNull();
});
