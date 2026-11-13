import { isConnected, requestAccess } from "https://esm.sh/@stellar/freighter-api@4.1.0";

const connectBtn = document.getElementById('connectWalletBtn');
const statusDiv = document.getElementById('walletStatus');
const addressDiv = document.getElementById('walletAddress');

connectBtn.addEventListener('click', async () => {
    try {
        connectBtn.disabled = true;
        statusDiv.textContent = "Estado: Verificando Freighter...";

        // 1. Verificamos si Freighter está instalado (la API v4 devuelve { isConnected })
        const { isConnected: ok } = await isConnected();

        if (!ok) {
            statusDiv.textContent = "Estado: Freighter no detectado. Instálalo o desbloquéalo.";
            connectBtn.disabled = false;
            return;
        }

        // 2. Solicitamos la conexión (la API v4 devuelve { address, error })
        statusDiv.textContent = "Estado: Solicitando permisos...";
        const { address, error } = await requestAccess();

        if (error) {
            const message = error.message || String(error);
            statusDiv.textContent = `Estado: Error - ${message}`;
            connectBtn.disabled = false;
            return;
        }

        // 3. Mostramos el éxito en pantalla
        if (address) {
            statusDiv.textContent = "Estado: ¡Conectado con éxito!";
            addressDiv.textContent = `Llave pública: ${address}`;
            connectBtn.textContent = "Wallet Conectada";
            connectBtn.style.backgroundColor = "#10b981"; // Verde
        } else {
            statusDiv.textContent = "Estado: Freighter no devolvió una llave pública.";
            connectBtn.disabled = false;
        }

    } catch (err) {
        console.error("Error al conectar:", err);
        statusDiv.textContent = "Estado: Conexión rechazada o fallida.";
        connectBtn.disabled = false;
    }
});
