import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as sdk from "@stellar/varial-sdk";
import {
  authorizeWallet,
  detectWallet,
  formatXlm,
  HORIZON_TESTNET,
  isTestnet,
  loadTestnetBalance,
  readWalletIdentity,
  revokeWalletAccess,
  TESTNET_PASSPHRASE,
} from "../src/stellar/wallet";

vi.mock("@stellar/varial-sdk", () => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  disconnect: vi.fn(),
}));
// Estos datos viven solo en las pruebas; la aplicación no contiene cuentas ni saldos de ejemplo.
const identity = {
  address: `G${"A".repeat(55)}`,
  network: "TESTNET",
  networkPassphrase: TESTNET_PASSPHRASE,
};
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Varial y validación de red", () => {
  it("detecta que no hay extensión sin pedir autorización", async () => {
    vi.mocked(sdk.isConnected).mockResolvedValue({ isConnected: false });
    expect(await detectWallet()).toBe(false);
    expect(sdk.requestAccess).not.toHaveBeenCalled();
  });
  it("maneja el rechazo de autorización", async () => {
    vi.mocked(sdk.requestAccess).mockResolvedValue({
      address: "",
      error: { code: -1, message: "User rejected" },
    });
    await expect(authorizeWallet()).rejects.toMatchObject({ code: "rejected" });
  });
  it("limita el tiempo de una autorización sin respuesta", async () => {
    vi.useFakeTimers();
    vi.mocked(sdk.requestAccess).mockReturnValue(new Promise(() => {}));
    const assertion = expect(authorizeWallet()).rejects.toMatchObject({
      code: "timeout",
    });
    await vi.advanceTimersByTimeAsync(90000);
    await assertion;
  });
  it("lee dirección y red sin abrir otro permiso", async () => {
    vi.mocked(sdk.getAddress).mockResolvedValue({ address: identity.address });
    vi.mocked(sdk.getNetwork).mockResolvedValue(identity);
    expect(await readWalletIdentity()).toEqual(identity);
    expect(sdk.requestAccess).not.toHaveBeenCalled();
  });
  it("no acepta una dirección vacía o acceso revocado", async () => {
    vi.mocked(sdk.getAddress).mockResolvedValue({ address: "" });
    vi.mocked(sdk.getNetwork).mockResolvedValue(identity);
    await expect(readWalletIdentity()).rejects.toMatchObject({
      code: "wallet",
    });
  });
  it("no confía solamente en el nombre Testnet", () => {
    expect(isTestnet({ ...identity, networkPassphrase: "otra red" })).toBe(
      false,
    );
    expect(isTestnet({ ...identity, network: "PUBLIC" })).toBe(false);
    expect(isTestnet(identity)).toBe(true);
  });
  it("revoca el permiso al desconectar", async () => {
    vi.mocked(sdk.disconnect).mockResolvedValue({});
    await revokeWalletAccess();
    expect(sdk.disconnect).toHaveBeenCalledOnce();
  });
});

describe("consulta de saldo Testnet", () => {
  it("bloquea otras redes antes de hacer una solicitud HTTP", async () => {
    await expect(
      loadTestnetBalance({ ...identity, network: "PUBLIC" }),
    ).rejects.toMatchObject({ code: "network" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("consulta el endpoint fijo y toma solo el activo nativo", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        balances: [
          { asset_type: "credit_alphanum4", balance: "999.0000000" },
          { asset_type: "native", balance: "1234.7654321" },
        ],
      }),
    );
    expect(await loadTestnetBalance(identity)).toEqual({
      kind: "funded",
      balance: "1234.7654321",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${HORIZON_TESTNET}/accounts/${identity.address}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
  it("distingue una cuenta inexistente de un saldo cero", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    expect(await loadTestnetBalance(identity)).toEqual({ kind: "unfunded" });
  });
  it("acepta un saldo cero confirmado por Horizon", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        balances: [{ asset_type: "native", balance: "0.0000000" }],
      }),
    );
    expect(await loadTestnetBalance(identity)).toEqual({
      kind: "funded",
      balance: "0.0000000",
    });
  });
  it.each([429, 500, 503])(
    "informa un error HTTP %s sin inventar saldo",
    async (status) => {
      fetchMock.mockResolvedValue(new Response(null, { status }));
      await expect(loadTestnetBalance(identity)).rejects.toMatchObject({
        code: "horizon",
      });
    },
  );
  it.each([
    {},
    { balances: null },
    { balances: [{ asset_type: "native", balance: "NaN" }] },
  ])("rechaza respuestas inválidas: %j", async (data) => {
    fetchMock.mockResolvedValue(Response.json(data));
    await expect(loadTestnetBalance(identity)).rejects.toMatchObject({
      code: "invalid-data",
    });
  });
  it("maneja una caída de conexión", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(loadTestnetBalance(identity)).rejects.toMatchObject({
      code: "horizon",
    });
  });
  it("preserva los siete decimales en cantidades grandes", () => {
    expect(formatXlm("922337203685.4775807")).toBe("922 337 203 685.4775807");
  });
});
