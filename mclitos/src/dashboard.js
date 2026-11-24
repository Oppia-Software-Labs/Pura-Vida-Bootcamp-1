export function createDashboard(client, render) {
  const initial = () => ({ phase: 'idle', address: '', balances: [], error: '' });
  let state = initial();
  let version = 0;
  const publish = patch => { state = { ...state, ...patch }; render(state); };
  const busy = () => ['connecting', 'loading'].includes(state.phase);

  async function readBalances(address, request) {
    publish({ phase: 'loading', address, balances: [], error: '' });
    const balances = await client.loadBalances(address);
    if (request === version) publish({ phase: 'ready', balances });
  }
  function report(error, request) {
    if (request === version) publish({
      phase: 'error', balances: [],
      error: error instanceof Error ? error.message : 'Ocurrió un error. Volvé a intentar.',
    });
  }

  const dashboard = {
    getState: () => ({ ...state, balances: state.balances.map(balance => ({ ...balance })) }),
    async connect() {
      if (busy()) return;
      const request = ++version;
      publish({ ...initial(), phase: 'connecting' });
      try {
        const address = await client.connect();
        if (request !== version) return;
        await readBalances(address, request);
      } catch (error) { report(error, request); }
    },
    async refresh() {
      if (!state.address || busy()) return;
      const request = ++version;
      try { await readBalances(state.address, request); }
      catch (error) { report(error, request); }
    },
    disconnect() {
      version++;
      publish(initial());
    },
  };
  render(state);
  return dashboard;
}
