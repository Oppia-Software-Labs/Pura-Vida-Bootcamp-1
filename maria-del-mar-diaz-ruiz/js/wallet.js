const VERIFIED_TESTNET_ACCOUNTS = [
  'GC2KGRRAD3DXE2N3ICPS6LOIJHT3K2NNIEC2NT57HOUGY2OKJ2X33V3Y',
  'GCLTEWSSRGULWCGPW3POI252S7CN3IA5J6LGIGMPHPEQVQEMXQHEKXHH',
  'GAE4US2ZFKXU53NC5LQ5UREBVG3PCLC5HRMELA25NC4GJUTSXAQSEL3E',
  'GDG7NFYGK4SCLYJS7UXYYH3TAKR3JHKQRORVZWPR2T36IMLD76S6OXLW',
  'GA562B5L2GS2U6HCWKXYDH5WF3HX3WXOIEYNGRQKJOI62UZ4CGKLDRZB',
  'GCPBYH3H6HUPT6RI2QBB5SES72YXMYGGJFIGIA4KW73NKEUWIANYKF6K'
];

let accountIndex = 0;

export class StellarWallet {
  constructor() {
    this.publicKey = null;
    this.network = 'TESTNET';
    this.walletType = null;
    this.listeners = [];
  }

  isFreighterAvailable() {
    return typeof window !== 'undefined' && Boolean(window.freighterApi);
  }

  async connectFreighter() {
    if (!this.isFreighterAvailable()) {
      return this.connectDemo();
    }

    try {
      const isConnected = await window.freighterApi.isConnected();
      if (!isConnected && window.freighterApi.requestAccess) {
        await window.freighterApi.requestAccess();
      }

      const pubKey = await window.freighterApi.getPublicKey();
      if (!pubKey) {
        return this.connectDemo();
      }

      try {
        if (window.freighterApi.getNetwork) {
          this.network = (await window.freighterApi.getNetwork()) || 'TESTNET';
        }
      } catch {
        this.network = 'TESTNET';
      }

      this.publicKey = pubKey;
      this.walletType = 'freighter';
      this.notifyListeners();
      return this.publicKey;
    } catch {
      return this.connectDemo();
    }
  }

  connectManual(publicKey) {
    const trimmed = (publicKey || '').trim();
    if (!this.isValidPublicKey(trimmed)) {
      throw new Error('La clave pública ingresada debe empezar con G y tener 56 caracteres válidos.');
    }

    this.publicKey = trimmed;
    this.walletType = 'manual';
    this.network = 'TESTNET';
    this.notifyListeners();
    return this.publicKey;
  }

  connectDemo() {
    const key = VERIFIED_TESTNET_ACCOUNTS[accountIndex % VERIFIED_TESTNET_ACCOUNTS.length];
    accountIndex++;

    this.publicKey = key;
    this.walletType = 'demo';
    this.network = 'TESTNET';
    this.notifyListeners();
    return this.publicKey;
  }

  disconnect() {
    this.publicKey = null;
    this.walletType = null;
    this.notifyListeners();
  }

  isValidPublicKey(key) {
    return typeof key === 'string' && /^G[A-Z2-7]{55}$/.test(key);
  }

  formatAddress(key) {
    if (!key) return '';
    return `${key.slice(0, 5)}...${key.slice(-5)}`;
  }

  async copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }

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
