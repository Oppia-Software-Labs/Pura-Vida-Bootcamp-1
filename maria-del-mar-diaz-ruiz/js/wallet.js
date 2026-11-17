/**
 * Modulo de Manejo de Wallet Stellar (Freighter API & Cuentas Testnet)
 * Desarrollado por Maria del Mar Diaz Ruiz
 */

export class StellarWallet {
  constructor() {
    this.publicKey = null;
    this.network = 'TESTNET';
    this.walletType = null; // 'freighter' | 'manual' | 'demo'
    this.listeners = [];
  }

  /**
   * Comprueba si la extension de Freighter esta disponible en el navegador
   */
  isFreighterAvailable() {
    return typeof window !== 'undefined' && Boolean(window.freighterApi);
  }

  /**
   * Conecta con la wallet de Freighter
   */
  async connectFreighter() {
    if (!this.isFreighterAvailable()) {
      throw new Error(
        'No se detectó la extensión de Freighter en tu navegador. Puedes instalarla desde https://www.freighter.app o probar ingresando una clave pública de prueba.'
      );
    }

    try {
      // Solicita permiso o comprueba conexion
      const isConnected = await window.freighterApi.isConnected();
      if (!isConnected) {
        // En algunas versiones se solicita acceso
        if (window.freighterApi.requestAccess) {
          await window.freighterApi.requestAccess();
        }
      }

      // Obtiene la clave publica de la cuenta activa
      const pubKey = await window.freighterApi.getPublicKey();
      if (!pubKey) {
        throw new Error('No se pudo obtener la clave pública de Freighter.');
      }

      // Obtiene la red configurada en la wallet si esta disponible
      try {
        if (window.freighterApi.getNetwork) {
          this.network = (await window.freighterApi.getNetwork()) || 'TESTNET';
        }
      } catch (netErr) {
        console.warn('No se pudo leer la red de Freighter, usando TESTNET por defecto:', netErr);
      }

      this.publicKey = pubKey;
      this.walletType = 'freighter';
      this.notifyListeners();
      return this.publicKey;
    } catch (err) {
      console.error('Error conectando Freighter:', err);
      throw err;
    }
  }

  /**
   * Permite conectar manualmente con una clave publica de Testnet
   */
  connectManual(publicKey) {
    const trimmed = (publicKey || '').trim();
    if (!this.isValidPublicKey(trimmed)) {
      throw new Error('La clave pública ingresada no tiene un formato Stellar válido (debe empezar con G y tener 56 caracteres).');
    }

    this.publicKey = trimmed;
    this.walletType = 'manual';
    this.network = 'TESTNET';
    this.notifyListeners();
    return this.publicKey;
  }

  /**
   * Genera una clave publica demo de prueba para evaluar la app sin wallet
   */
  connectDemo() {
    // Genera una direccion Stellar sintetica de prueba con formato standard G...
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let randomKey = 'G';
    for (let i = 0; i < 55; i++) {
      randomKey += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    this.publicKey = randomKey;
    this.walletType = 'demo';
    this.network = 'TESTNET';
    this.notifyListeners();
    return this.publicKey;
  }

  /**
   * Desconecta la sesion actual
   */
  disconnect() {
    this.publicKey = null;
    this.walletType = null;
    this.notifyListeners();
  }

  /**
   * Valida si un string tiene estructura basica de clave publica Stellar
   */
  isValidPublicKey(key) {
    return typeof key === 'string' && key.startsWith('G') && key.length === 56;
  }

  /**
   * Formatea una direccion publica para mostrarla compacta (Ej: GABCD...WXYZ)
   */
  formatAddress(key) {
    if (!key) return '';
    return `${key.slice(0, 5)}...${key.slice(-5)}`;
  }

  /**
   * Copia texto al portapapeles
   */
  async copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }

  /**
   * Sistema de subscripcion a cambios de estado de la wallet
   */
  onStateChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    const state = {
      isConnected: Boolean(this.publicKey),
      publicKey: this.publicKey,
      walletType: this.walletType,
      network: this.network
    };
    this.listeners.forEach((callback) => callback(state));
  }
}

export const stellarWallet = new StellarWallet();
