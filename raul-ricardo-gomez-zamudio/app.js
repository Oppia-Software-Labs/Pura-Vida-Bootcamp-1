import { isConnected, requestAccess } from "https://esm.sh/@stellar/freighter-api@4.1.0";

const connectBtn = document.getElementById('connectWalletBtn');
const statusDiv = document.getElementById('walletStatus');
const addressDiv = document.getElementById('walletAddress');

connectBtn.addEventListener('click', async () => {
    try {
        connectBtn.disabled = true;
        statusDiv.textContent = "Estado: Verificando Freighter...";

        // 1. Verificamos si Freighter está instalado y desbloqueado (devuelve true o false)
        const connected = await isConnected();
        
        if (!connected) {
            statusDiv.textContent = "Estado: Freighter no detectado. Instálalo o desbloquéalo.";
            connectBtn.disabled = false;
            return;
        }

        // 2. Solicitamos la conexión (devuelve directamente la llave pública en texto)
        statusDiv.textContent = "Estado: Solicitando permisos...";
        const publicKey = await requestAccess();

        // 3. Mostramos el éxito en pantalla
        if (publicKey) {
            statusDiv.textContent = "Estado: ¡Conectado con éxito!";
            addressDiv.textContent = `Cuenta: ${publicKey}`;
            connectBtn.textContent = "Wallet Conectada";
            connectBtn.style.backgroundColor = "#10b981"; // Verde
        }

    } catch (error) {
        console.error("Error al conectar:", error);
        statusDiv.textContent = "Estado: Conexión rechazada o fallida.";
        connectBtn.disabled = false;
    }
});