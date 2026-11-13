// Simulación de conexión de wallet para Stellar DApp
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectWalletBtn');
    const statusDiv = document.getElementById('walletStatus');
    const addressDiv = document.getElementById('walletAddress');

    connectBtn.addEventListener('click', async () => {
        try {
            statusDiv.textContent = "Estado: Conectando a Stellar Testnet...";
            
            // Simulamos un pequeño retraso de red (1 segundo)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Dirección de cuenta de prueba simulada (Testnet Public Key)
            const mockPublicKey = "GD6W6X7Z6X7Z6X7Z6X7Z6X7Z6X7Z6X7Z6X7Z6X7Z6X7Z6X7Z6X7ZSTUDENT";
            
            statusDiv.textContent = "Estado: ¡Conectado con éxito!";
            addressDiv.textContent = `Cuenta: ${mockPublicKey}`;
            connectBtn.textContent = "Wallet Conectada";
            connectBtn.disabled = true;
            connectBtn.style.backgroundColor = "#10b981"; // Cambia a color verde de éxito
            
        } catch (error) {
            console.error("Error al conectar la wallet:", error);
            statusDiv.textContent = "Estado: Error de conexión";
        }
    });
});