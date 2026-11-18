export class TransactionsService {
  constructor() {
    this.horizonUrl = 'https://horizon-testnet.stellar.org';
  }

  async getRecentPayments(publicKey, limit = 10) {
    if (!publicKey) return [];

    try {
      const url = `${this.horizonUrl}/accounts/${publicKey}/payments?limit=${limit}&order=desc`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      return (data._embedded?.records || []).map((item) => {
        const isIncoming = item.to === publicKey;
        const isCreateAccount = item.type === 'create_account';
        const amount = isCreateAccount ? item.starting_balance : item.amount;

        return {
          id: item.id,
          txHash: item.transaction_hash,
          createdAt: item.created_at,
          type: item.type,
          isIncoming,
          amount: parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          from: item.from || item.funder,
          to: item.to || item.account
        };
      });
    } catch {
      return [];
    }
  }

  formatDate(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  renderTransactions(container, transactions) {
    if (!container) return;

    if (!transactions || transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-activity-state">Sin transacciones</div>
      `;
      return;
    }

    container.innerHTML = transactions
      .map((tx) => {
        const label = tx.type === 'create_account' ? 'Cuenta creada' : tx.isIncoming ? 'Pago recibido' : 'Pago enviado';
        const sign = tx.isIncoming ? '+' : '-';
        const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${tx.txHash}`;

        return `
          <div class="activity-row">
            <span class="col-left op-name">
              <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" class="op-link">${label}</a>
            </span>
            <span class="col-center op-date">${this.formatDate(tx.createdAt)}</span>
            <span class="col-right op-amount ${tx.isIncoming ? 'income' : ''}">${sign}${tx.amount} XLM</span>
          </div>
        `;
      })
      .join('');
  }
}

export const transactionsService = new TransactionsService();
