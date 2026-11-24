import { useCallback, useState } from "react";
import { StellarWalletsKit, Networks } from "@creit-tech/stellar-wallets-kit";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";

// v2 es un singleton estático: se inicia una sola vez al cargar el módulo.
StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
});

export function useStellarWallet() {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Abre el selector de wallets y devuelve la dirección elegida.
      const { address } = await StellarWalletsKit.authModal();
      setAddress(address);
    } catch (e) {
      // Por ejemplo, si el usuario cierra el modal sin elegir wallet.
      setError(e?.message ?? "No se pudo conectar la wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await StellarWalletsKit.disconnect();
    setAddress(null);
  }, []);

  return { address, loading, error, connect, disconnect };
}
