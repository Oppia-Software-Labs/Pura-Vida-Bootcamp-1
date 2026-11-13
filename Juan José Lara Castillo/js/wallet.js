/**
 * Stellar Wallet Connection & Horizon Testnet Service
 * StellarCalc - Juan José Lara Castillo
 * 
 * Supports:
 * - Freighter Wallet API (@stellar/freighter-api / window.freighterApi)
 * - Albedo Web Wallet (Sin requerir extensiones en el navegador)
 * - Varial Wallet Extension
 * - Entrada Manual de Clave Pública Stellar (G...)
 * - Modo Demo Testnet instantáneo con fondeo Friendbot
 */
class StellarWalletService {
  constructor() {
    this.publicKey = null;
    this.isConnected = false;
    this.walletType = null; // 'freighter' | 'albedo' | 'varial' | 'manual' | 'demo'
    this.network = 'TESTNET';
    this.horizonUrl = 'https://horizon-testnet.stellar.org';
    this.friendbotUrl = 'https://friendbot.stellar.org';
    this.accountData = null;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    this.notify();
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn({
          isConnected: this.isConnected,
          publicKey: this.publicKey,
          walletType: this.walletType,
          network: this.network,
          accountData: this.accountData
        });
      } catch (e) {
        console.error('Wallet subscriber error:', e);
      }
    });
  }

  /**
   * Helper para obtener la instancia de Freighter disponible
   */
  async getFreighterInstance(retries = 3) {
    for (let i = 0; i < retries; i++) {
      if (typeof window.freighterApi !== 'undefined') {
        return window.freighterApi;
      }
      if (typeof window.freighter !== 'undefined') {
        return window.freighter;
      }
      await new Promise(r => setTimeout(r, 150));
    }
    return window.freighterApi || window.freighter || null;
  }

  /**
   * Conectar con Freighter Wallet (Extensión)
   */
  async connectFreighter() {
    try {
      const freighter = await this.getFreighterInstance();
      
      if (!freighter) {
        throw new Error(
          'La extensión Freighter no fue detectada. Si recién la instalaste en Chrome, por favor RECARGA LA PÁGINA (F5) para que el navegador inyecte la extensión en esta pestaña activa.'
        );
      }

      let key = '';

      // Intento 1: requestAccess() oficial de Freighter API
      if (typeof freighter.requestAccess === 'function') {
        try {
          const access = await freighter.requestAccess();
          if (access) {
            if (access.error) {
              throw new Error(`Acceso denegado o cancelado en Freighter: ${access.error}`);
            }
            if (access.address) {
              key = access.address;
            } else if (typeof access === 'string') {
              key = access;
            }
          }
        } catch (accessErr) {
          console.warn('requestAccess error:', accessErr);
          if (accessErr.message && accessErr.message.includes('denegado')) {
            throw accessErr;
          }
        }
      }

      // Intento 2: getAddress()
      if (!key && typeof freighter.getAddress === 'function') {
        try {
          const addrObj = await freighter.getAddress();
          if (addrObj && addrObj.address) {
            key = addrObj.address;
          } else if (typeof addrObj === 'string') {
            key = addrObj;
          }
        } catch (e) {
          console.warn('getAddress error:', e);
        }
      }

      // Intento 3: getPublicKey()
      if (!key && typeof freighter.getPublicKey === 'function') {
        try {
          key = await freighter.getPublicKey();
        } catch (e) {
          console.warn('getPublicKey error:', e);
        }
      }

      if (!key) {
        throw new Error(
          'No se pudo obtener la clave pública de Freighter. Asegúrate de tener la extensión desbloqueada, permitir la conexión en el popup y recargar la página (F5).'
        );
      }

      this.publicKey = key;
      this.isConnected = true;
      this.walletType = 'freighter';

      await this.refreshAccount();
      return { success: true, publicKey: this.publicKey };
    } catch (err) {
      console.warn('Freighter connection error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Conectar con Albedo (Web Wallet - Funciona en cualquier navegador sin extensiones)
   */
  async connectAlbedo() {
    try {
      if (typeof window.albedo === 'undefined') {
        throw new Error('El script de Albedo no se cargó correctamente. Verifica tu conexión a internet.');
      }

      const res = await window.albedo.publicKey({
        require_existing: false
      });

      if (!res || !res.pubkey) {
        throw new Error('No se seleccionó ninguna cuenta en Albedo.');
      }

      this.publicKey = res.pubkey;
      this.isConnected = true;
      this.walletType = 'albedo';

      await this.refreshAccount();
      return { success: true, publicKey: this.publicKey };
    } catch (err) {
      return { success: false, error: err.message || 'Conexión con Albedo cancelada.' };
    }
  }

  /**
   * Conectar con Varial Wallet (Extensión)
   */
  async connectVarial() {
    try {
      const varial = window.varial || (window.stellar && window.stellar.varial) || window.freighterApi;
      if (!varial) {
        throw new Error(
          'Varial Wallet no respondió en la ventana activa. Asegúrate de tenerla desbloqueada o prueba conectar con Albedo.'
        );
      }

      let key = '';
      if (typeof varial.connect === 'function') {
        const res = await varial.connect();
        key = res.publicKey || res.address || res;
      } else if (typeof varial.requestAccess === 'function') {
        const res = await varial.requestAccess();
        key = res.address || res;
      } else if (typeof varial.getPublicKey === 'function') {
        key = await varial.getPublicKey();
      }

      if (!key) {
        throw new Error('No se pudo obtener la clave de Varial Wallet.');
      }

      this.publicKey = key;
      this.isConnected = true;
      this.walletType = 'varial';

      await this.refreshAccount();
      return { success: true, publicKey: this.publicKey };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Conectar ingresando una clave pública Stellar (G...) manualmente
   */
  async connectCustomKey(pubkey) {
    try {
      const trimmed = (pubkey || '').trim().toUpperCase();
      if (!trimmed.startsWith('G') || trimmed.length !== 56) {
        throw new Error('La clave pública de Stellar debe iniciar con "G" y tener exactamente 56 caracteres.');
      }

      this.publicKey = trimmed;
      this.isConnected = true;
      this.walletType = 'manual';

      await this.refreshAccount();
      return { success: true, publicKey: this.publicKey };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Generar o conectar una cuenta de prueba Demo Testnet
   */
  async connectDemoWallet() {
    try {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let mockKey = 'G';
      for (let i = 0; i < 55; i++) {
        mockKey += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      }

      this.publicKey = mockKey;
      this.isConnected = true;
      this.walletType = 'demo';

      this.accountData = {
        subentry_count: 2,
        balances: [
          { asset_type: 'native', balance: '10000.0000000' },
          { asset_type: 'credit_alphanum4', asset_code: 'USDC', balance: '500.0000000' }
        ],
        isDemo: true
      };

      this.notify();
      return { success: true, publicKey: this.publicKey };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Desconectar la wallet actual
   */
  disconnect() {
    this.publicKey = null;
    this.isConnected = false;
    this.walletType = null;
    this.accountData = null;
    this.notify();
  }

  /**
   * Consulta datos de la cuenta en Horizon Testnet
   */
  async refreshAccount() {
    if (!this.publicKey) return null;

    if (this.walletType === 'demo') {
      this.notify();
      return this.accountData;
    }

    try {
      const response = await fetch(`${this.horizonUrl}/accounts/${this.publicKey}`);
      if (response.status === 404) {
        // Cuenta no fondeada aún en Testnet (común en cuentas nuevas de Freighter)
        this.accountData = {
          unfunded: true,
          subentry_count: 0,
          balances: [{ asset_type: 'native', balance: '0.0000000' }]
        };
      } else if (response.ok) {
        const data = await response.json();
        this.accountData = {
          unfunded: false,
          subentry_count: data.subentry_count || 0,
          balances: data.balances || []
        };
      } else {
        throw new Error(`Horizon status: ${response.status}`);
      }
      this.notify();
      return this.accountData;
    } catch (err) {
      console.warn('Error al consultar Horizon:', err);
      // Mantener la clave pública conectada aunque sea cuenta nueva sin fondear
      this.accountData = {
        unfunded: true,
        subentry_count: 0,
        balances: [{ asset_type: 'native', balance: '0.0000000' }]
      };
      this.notify();
      return this.accountData;
    }
  }

  /**
   * Fondeo con Friendbot en Testnet (activa cuentas nuevas de Freighter de inmediato)
   */
  async fundWithFriendbot() {
    if (!this.publicKey) {
      throw new Error('Primero debes conectar una wallet.');
    }

    if (this.walletType === 'demo') {
      const currentNative = this.accountData.balances.find(b => b.asset_type === 'native');
      if (currentNative) {
        currentNative.balance = (parseFloat(currentNative.balance) + 10000).toFixed(7);
      }
      this.notify();
      return { success: true, message: 'Cuenta Demo recargada con +10,000 XLM' };
    }

    try {
      const res = await fetch(`${this.friendbotUrl}?addr=${encodeURIComponent(this.publicKey)}`);
      if (!res.ok) {
        throw new Error('Friendbot no pudo fondear la cuenta en este momento. Intenta de nuevo en unos segundos.');
      }
      await this.refreshAccount();
      return { success: true, message: '¡Cuenta fondeada exitosamente con 10,000 XLM en Stellar Testnet!' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getNativeBalance() {
    if (!this.accountData || !this.accountData.balances) {
      return '0.0000000';
    }
    const native = this.accountData.balances.find((b) => b.asset_type === 'native');
    return native ? parseFloat(native.balance).toFixed(7) : '0.0000000';
  }

  getSubentryCount() {
    return this.accountData ? (this.accountData.subentry_count || 0) : 0;
  }
}

// Global instance
window.StellarWalletService = StellarWalletService;
