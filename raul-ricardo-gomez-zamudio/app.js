// Conexión real con la wallet Freighter (JavaScript puro, módulo de navegador)
import {
    isConnected,
    requestAccess,
} from "https://esm.sh/@stellar/freighter-api@4.1.0";

const connectBtn = document.getElementById('connectWalletBtn');
const statusDiv = document.getElementById('walletStatus');
const addressDiv = document.getElementById('walletAddress');

function setStatus(message) {
    statusDiv.textContent = `Estado: ${message}`;
}

function showConnected(publicKey) {
    setStatus("¡Conectado con éxito!");
    addressDiv.textContent = `Llave pública: ${publicKey}`;
    connectBtn.textContent = "Wallet Conectada";
    connectBtn.disabled = true;
    connectBtn.style.backgroundColor = "#10b981";
}

async function connectWallet() {
    connectBtn.disabled = true;
    try {
        setStatus("Verificando Freighter...");
        const connection = await isConnected();
        if (connection.error || !connection.isConnected) {
            setStatus("Freighter no está instalada. Instálala desde freighter.app");
            connectBtn.disabled = false;
            return;
        }

        setStatus("Esperando autorización en Freighter...");
        const access = await requestAccess();
        if (access.error) {
            throw new Error(access.error.message || String(access.error));
        }
        if (!access.address) {
            throw new Error("Freighter no devolvió una llave pública");
        }

        showConnected(access.address);
    } catch (error) {
        console.error("Error al conectar la wallet:", error);
        setStatus(`Error de conexión (${error.message})`);
        connectBtn.disabled = false;
    }
}

connectBtn.addEventListener('click', connectWallet);
