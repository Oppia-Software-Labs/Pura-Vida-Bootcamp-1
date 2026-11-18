import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWallet } from "./use-wallet";
import type { WalletAdapter } from "../lib/wallet";
import { WalletError } from "../lib/wallet";

vi.mock("@creit.tech/stellar-wallets-kit/sdk", () => ({
  StellarWalletsKit: {
    init: vi.fn(),
    setNetwork: vi.fn(),
    authModal: vi.fn(),
    getNetwork: vi.fn(),
    signTransaction: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
  defaultModules: () => [],
}));

vi.mock("@creit.tech/stellar-wallets-kit/types", () => ({
  Networks: { TESTNET: "Test SDF Network ; September 2015" },
}));

const connection = {
  address: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  network: "TESTNET",
  networkPassphrase: "Test SDF Network ; September 2015",
};

function createAdapter(): WalletAdapter {
  return {
    connect: vi.fn().mockResolvedValue(connection),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getAccount: vi.fn().mockResolvedValue({ exists: true, xlmBalance: "10000.0000000" }),
    fundWithFriendbot: vi
      .fn()
      .mockResolvedValue({ exists: true, xlmBalance: "10000.0000000" }),
  };
}

describe("useWallet", () => {
  it("connects through a simulated wallet adapter", async () => {
    const adapter = createAdapter();
    const { result } = renderHook(() => useWallet(adapter));

    await act(async () => result.current.connect());

    expect(result.current.state).toMatchObject({
      status: "connected",
      connection,
      account: { exists: true, xlmBalance: "10000.0000000" },
    });
    expect(adapter.getAccount).toHaveBeenCalledWith(connection.address);
  });

  it("exposes a wrong-network state without keeping a connection", async () => {
    const adapter = createAdapter();
    vi.mocked(adapter.connect).mockRejectedValue(
      new WalletError("wrong-network", "Expected TESTNET."),
    );
    const { result } = renderHook(() => useWallet(adapter));

    await act(async () => result.current.connect());

    expect(result.current.state).toMatchObject({
      status: "wrong-network",
      connection: null,
      errorCode: "wrong-network",
    });
  });

  it("funds an unfunded Testnet account with the adapter", async () => {
    const adapter = createAdapter();
    vi.mocked(adapter.getAccount).mockResolvedValue({ exists: false, xlmBalance: null });
    const { result } = renderHook(() => useWallet(adapter));

    await act(async () => result.current.connect());
    await act(async () => result.current.fund());

    expect(adapter.fundWithFriendbot).toHaveBeenCalledWith(connection.address);
    expect(result.current.state.account).toEqual({
      exists: true,
      xlmBalance: "10000.0000000",
    });
  });
});
