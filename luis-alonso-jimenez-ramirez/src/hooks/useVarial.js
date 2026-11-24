import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  getAddress,
  requestAccess,
  getNetwork,
  disconnect as disconnectWallet,
} from "@stellar/varial-sdk";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || "";
}

function isUserRejection(error) {
  const msg = getErrorMessage(error).toLowerCase();
  return (
    msg.includes("decline") ||
    msg.includes("reject") ||
    msg.includes("cancel") ||
    msg.includes("denied") ||
    msg.includes("closed")
  );
}

export function useVarial() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [network, setNetwork] = useState(null);
  const [networkPassphrase, setNetworkPassphrase] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const checkConnection = useCallback(async () => {
    try {
      const { isConnected: installed, error: connError } = await isConnected();
      if (connError || !installed) return;

      // getAddress devuelve "" hasta que la app tenga permiso concedido
      const { address: addr, error: addressError } = await getAddress();
      if (addressError || !addr) return;

      const {
        network: net,
        networkPassphrase: passphrase,
        error: networkError,
      } = await getNetwork();
      if (networkError) return;

      setConnected(true);
      setAddress(addr);
      setNetwork(net || null);
      setNetworkPassphrase(passphrase || null);
    } catch {
      // Si la extensión no está disponible en la carga inicial, permanecemos desconectados
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      const { isConnected: installed, error: connError } = await isConnected();
      if (connError || !installed) {
        setError(
          "No se detectó la extensión Freighter / Varial en tu navegador. Instálala y recarga la página para conectar tu wallet."
        );
        return null;
      }

      const { address: addr, error: accessError } = await requestAccess();
      if (accessError) {
        if (isUserRejection(accessError)) {
          setError("Conexión cancelada por el usuario en Freighter / Varial.");
        } else {
          setError(
            getErrorMessage(accessError) ||
              "No se pudo obtener acceso a tu wallet Freighter / Varial."
          );
        }
        return null;
      }

      if (!addr) {
        setError("Conexión cancelada: no se recibió ninguna llave pública.");
        return null;
      }

      const {
        network: net,
        networkPassphrase: passphrase,
        error: networkError,
      } = await getNetwork();

      if (networkError) {
        setError(
          getErrorMessage(networkError) ||
            "No se pudo leer la red activa desde Freighter / Varial."
        );
        return null;
      }

      setConnected(true);
      setAddress(addr);
      setNetwork(net || null);
      setNetworkPassphrase(passphrase || null);
      return addr;
    } catch (err) {
      if (isUserRejection(err)) {
        setError("Conexión cancelada por el usuario en Freighter / Varial.");
      } else {
        setError(
          getErrorMessage(err) ||
            "Ocurrió un error inesperado al conectar con Freighter / Varial."
        );
      }
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
    } catch {
      // Algunas versiones anteriores de Freighter no implementan disconnect()
    } finally {
      setConnected(false);
      setAddress(null);
      setNetwork(null);
      setNetworkPassphrase(null);
      setError(null);
    }
  }, []);

  const isTestnet =
    connected &&
    (network?.toUpperCase() === "TESTNET" ||
      networkPassphrase === TESTNET_PASSPHRASE);

  return {
    connected,
    address,
    network,
    networkPassphrase,
    isTestnet,
    connecting,
    error,
    connect,
    disconnect,
  };
}
