import { status } from './ui';

type Operation = 'extension_check' | 'access' | 'network_read' | 'account_read' | 'disconnect';
type Outcome = 'ok' | 'sdk_error' | 'invalid_result' | 'unavailable' | 'slow';
type Result = { error?: unknown; isConnected?: boolean; address?: string; network?: string; networkPassphrase?: string };

function diagnostic(operation: Operation, outcome: Outcome) {
  // Never pass SDK values, exceptions, or additional metadata to the console.
  if (import.meta.env.DEV) console.debug(operation, outcome);
}

export async function walletOperation<T extends Result>(operation: Operation, request: () => Promise<T>): Promise<T> {
  const timer = window.setTimeout(() => {
    status(operation === 'access' ? 'slowApproval' : 'slowRead');
    diagnostic(operation, 'slow');
  }, 10_000);
  try {
    const result = await request();
    let outcome: Outcome = 'ok';
    if (result.error) outcome = 'sdk_error';
    else if (operation === 'extension_check' && !result.isConnected) outcome = 'unavailable';
    else if ((operation === 'access' || operation === 'account_read') && !result.address?.trim()) outcome = 'invalid_result';
    else if (operation === 'network_read' && (!result.network?.trim() || !result.networkPassphrase?.trim())) outcome = 'invalid_result';
    diagnostic(operation, outcome);
    return result;
  } catch (error) {
    diagnostic(operation, 'sdk_error');
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}
