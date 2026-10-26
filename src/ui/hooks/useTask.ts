import { useState } from 'react';
import { errorMessage } from '../utils';
export function useTask() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function run(task: () => Promise<void>, after?: () => void) {
    if (busy) return; setBusy(true); setError('');
    try { await task(); after?.(); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  return { busy, error, setError, run };
}
