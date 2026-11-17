/**
 * Servicio de Conexion con la Red Stellar Testnet (Horizon API & Friendbot)
 * Desarrollado por Maria del Mar Diaz Ruiz
 */

export class StellarService {
  constructor() {
    this.horizonUrl = 'https://horizon-testnet.stellar.org';
    this.friendbotUrl = 'https://friendbot.stellar.org';
  }

  /**
   * Consulta la informacion de una cuenta en Horizon Testnet
   */
  async getAccount(publicKey) {
    if (!publicKey) {
      throw new Error('Se requiere una clave pública para consultar la cuenta.');
    }

    try {
      const response = await fetch(`${this.horizonUrl}/accounts/${publicKey}`);

      if (response.status === 404) {
        // La cuenta no ha sido fondeada en Testnet
        return {
          exists: false,
          publicKey,
          xlmBalance: '0.00',
          balances: [],
          message: 'La cuenta no está activa en la red Testnet. Haz clic en "Pedir 10,000 XLM (Friendbot)" para activarla.'
        };
      }

      if (!response.ok) {
        throw new Error(`Error en el servidor Horizon: código ${response.status}`);
      }

      const data = await response.json();
      
      // Busca el balance en XLM nativo
      const nativeBalance = data.balances?.find((b) => b.asset_type === 'native');
      const xlmBalance = nativeBalance ? parseFloat(nativeBalance.balance).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00';

      return {
        exists: true,
        publicKey: data.id || publicKey,
        sequence: data.sequence,
        subentryCount: data.subentry_count,
        balances: data.balances || [],
        xlmBalance,
        rawXlmBalance: nativeBalance ? nativeBalance.balance : '0.00'
      };
    } catch (err) {
      console.error('Error al consultar Horizon:', err);
      throw err;
    }
  }

  /**
   * Solicita 10,000 XLM de prueba gratuitos a Friendbot en Testnet
   */
  async requestFriendbotFunds(publicKey) {
    if (!publicKey) {
      throw new Error('Se requiere una clave pública para recargar con Friendbot.');
    }

    try {
      const url = `${this.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Friendbot no pudo procesar la solicitud: ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: '¡10,000 XLM de prueba agregados exitosamente!',
        result
      };
    } catch (err) {
      console.error('Error con Friendbot:', err);
      throw err;
    }
  }
}

export const stellarService = new StellarService();
