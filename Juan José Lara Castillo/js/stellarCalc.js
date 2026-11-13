/**
 * Stellar Ecosystem Calculations
 * StellarCalc - Juan José Lara Castillo
 * 
 * Consulted and designed following Stellar Protocol documentation:
 * - Base Reserve: https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#minimum-account-balance
 * - Stroops: 1 XLM = 10^7 Stroops (0.0000001 XLM per Stroop)
 * - Horizon Fee Stats: https://developers.stellar.org/docs/data/horizon/api-reference/aggregations/fee-stats
 */
class StellarCalculator {
  constructor() {
    this.BASE_RESERVE = 0.5; // Standard Stellar Protocol Base Reserve (0.5 XLM)
    this.STROOPS_PER_XLM = 10000000; // 10 million stroops per lumen
    this.HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';
  }

  /**
   * Calculates the minimum base reserve required for a Stellar account.
   * Formula: (2 + num_subentries) * BaseReserve
   * 
   * @param {Object} subentries
   * @param {number} subentries.trustlines
   * @param {number} subentries.signers
   * @param {number} subentries.offers
   * @param {number} subentries.dataEntries
   * @returns {Object} detailed calculation breakdown
   */
  calculateAccountReserve({ trustlines = 0, signers = 0, offers = 0, dataEntries = 0 } = {}) {
    const t = Math.max(0, parseInt(trustlines, 10) || 0);
    const s = Math.max(0, parseInt(signers, 10) || 0);
    const o = Math.max(0, parseInt(offers, 10) || 0);
    const d = Math.max(0, parseInt(dataEntries, 10) || 0);

    const totalSubentries = t + s + o + d;
    const baseMultiplier = 2; // Every account inherently has 2 base units (account entry)
    const totalEntries = baseMultiplier + totalSubentries;
    const reserveXlm = totalEntries * this.BASE_RESERVE;
    const reserveStroops = Math.round(reserveXlm * this.STROOPS_PER_XLM);

    return {
      baseReservePerEntry: this.BASE_RESERVE,
      baseAccountEntries: baseMultiplier,
      subentries: {
        trustlines: t,
        signers: s,
        offers: o,
        dataEntries: d,
        total: totalSubentries
      },
      totalEntries: totalEntries,
      reserveXlm: reserveXlm.toFixed(7),
      reserveStroops: reserveStroops,
      explanation: `2 entradas base de cuenta + ${totalSubentries} subentries = ${totalEntries} entradas × 0.5 XLM = ${reserveXlm.toFixed(7)} XLM.`
    };
  }

  /**
   * Converts XLM amount to Stroops
   * @param {number|string} xlm
   * @returns {number}
   */
  xlmToStroops(xlm) {
    const val = parseFloat(xlm);
    if (isNaN(val) || val < 0) return 0;
    return Math.round(val * this.STROOPS_PER_XLM);
  }

  /**
   * Converts Stroops to XLM
   * @param {number|string} stroops
   * @returns {string}
   */
  stroopsToXlm(stroops) {
    const val = parseInt(stroops, 10);
    if (isNaN(val) || val < 0) return '0.0000000';
    return (val / this.STROOPS_PER_XLM).toFixed(7);
  }

  /**
   * Calculates transaction fees based on operation count and rate in stroops
   * @param {number} operations
   * @param {number} rateInStroops
   * @returns {Object}
   */
  calculateTransactionFee(operations = 1, rateInStroops = 100) {
    const ops = Math.max(1, parseInt(operations, 10) || 1);
    const rate = Math.max(100, parseInt(rateInStroops, 10) || 100);
    const totalStroops = ops * rate;
    const totalXlm = (totalStroops / this.STROOPS_PER_XLM).toFixed(7);

    return {
      operations: ops,
      rateInStroops: rate,
      totalStroops: totalStroops,
      totalXlm: totalXlm,
      transactionsPerXlm: Math.floor(this.STROOPS_PER_XLM / totalStroops)
    };
  }

  /**
   * Fetches real-time fee statistics from the Stellar Testnet Horizon API
   */
  async fetchLiveFeeStats() {
    try {
      const response = await fetch(`${this.HORIZON_TESTNET}/fee_stats`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`Horizon HTTP ${response.status}`);
      }
      const data = await response.json();
      return {
        success: true,
        lastLedger: data.last_ledger,
        minAcceptedFee: parseInt(data.fee_charged.min, 10) || 100,
        modeAcceptedFee: parseInt(data.fee_charged.mode, 10) || 100,
        p50Fee: parseInt(data.fee_charged.p50, 10) || 100,
        p95Fee: parseInt(data.fee_charged.p95, 10) || 100,
        ledgerCapacityUsage: data.ledger_capacity_usage
      };
    } catch (err) {
      console.warn('Could not fetch live fee stats from Horizon:', err);
      return {
        success: false,
        error: err.message,
        minAcceptedFee: 100,
        modeAcceptedFee: 100
      };
    }
  }
}

// Global instance
window.StellarCalculator = StellarCalculator;
