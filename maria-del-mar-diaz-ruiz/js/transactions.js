/**
 * Modulo de Consulta y Renderizado de Transacciones en Horizon Testnet
 * Desarrollado por Maria del Mar Diaz Ruiz
 */

export class TransactionsService {
  constructor() {
    this.horizonUrl = 'https://horizon-testnet.stellar.org';
  }

  /**
   * Obtiene los pagos y operaciones recientes de una cuenta
   */
  async getRecentPayments(publicKey, limit = 10) {
    if (!publicKey) return [];

    try {
      const url = `${this.horizonUrl}/accounts/${publicKey}/payments?limit=${limit}&order=desc`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`Error ${res.status} al consultar pagos`);
      }

      const data = await res.json();
      return (data._embedded?.records || []).map((item) => {
        const isIncoming = item.to === publicKey;
        const isCreateAccount = item.type === 'create_account';
        const amount = isCreateAccount ? item.starting_balance : item.amount;
        const asset = isCreateAccount ? 'XLM' : item.asset_type === 'native' ? 'XLM' : item.asset_code || 'TOKEN';

        return {
          id: item.id,
          txHash: item.transaction_hash,
          createdAt: item.created_at,
          type: item.type,
          isIncoming,
          amount: parseFloat(amount || 0).toFixed(2),
          asset,
          from: item.from || item.funder,
          to: item.to || item.account
        };
      });
    } catch (err) {
      console.warn('No se pudieron obtener pagos recientes:', err);
      return [];
    }
  }

  /**
   * Formatea una fecha ISO a hora local legible
   */
  formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('es-CR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Renderiza el listado de transacciones en el contenedor HTML
   */
  renderTransactions(container, transactions, currentPublicKey) {
    if (!container) return;

    if (!transactions || transactions.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-dim);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
          <p>No se encontraron pagos registrados para esta cuenta en Testnet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = transactions
      .map((tx) => {
        const directionClass = tx.isIncoming ? 'in' : 'out';
        const sign = tx.isIncoming ? '+' : '-';
        const icon = tx.isIncoming ? '📥' : '📤';
        const label = tx.isIncoming ? 'Recibido' : 'Enviado';
        const counterparty = tx.isIncoming ? tx.from : tx.to;
        const shortCounterparty = counterparty ? `${counterparty.slice(0, 4)}...${counterparty.slice(-4)}` : 'N/A';
        const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${tx.txHash}`;

        return `
          <div class="tx-item">
            <div class="tx-left">
              <div class="tx-icon ${directionClass}">${icon}</div>
              <div class="tx-details">
                <h4>${label} ${tx.asset}</h4>
                <span>${this.formatDate(tx.createdAt)} · ${shortCounterparty}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="tx-amount ${tx.isIncoming ? 'positive' : 'negative'}">
                ${sign}${tx.amount} ${tx.asset}
              </div>
              <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; color: var(--primary); text-decoration: none;">
                Ver en Explorer ↗
              </a>
            </div>
          </div>
        `;
      })
      .join('');
  }
}

export const transactionsService = new TransactionsService();
