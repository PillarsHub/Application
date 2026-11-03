import { useEffect, useState } from 'react';
import BaseUrl from '../../../hooks/baseUrl';
import { GetToken } from '../../../features/authentication/hooks/useToken.jsx';

export default function useEnvironmentStats() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let worker;
    setState({ loading: true, data: null, error: null });

    const fail = () => {
      setState({ loading: false, data: null, error: 'Unable to load usage statistics.' });
      worker?.terminate();
    };

    try {
      // Fetch and parse the raw response in the worker as well as aggregating it.
      // Only the small summaries needed by the page cross back to the UI thread.
      worker = new Worker(new URL('./environmentStats.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.error) {
          fail();
        } else {
          setState({ loading: false, data: data.stats, error: null });
          worker.terminate();
        }
      };
      worker.onerror = fail;
      worker.onmessageerror = fail;
      worker.postMessage({ baseUrl: BaseUrl, token: GetToken()?.token, now: Date.now() });
    } catch {
      fail();
    }

    // Leaving the page also stops a pending fetch or aggregation.
    return () => worker?.terminate();
  }, [attempt]);

  return { ...state, refetch: () => setAttempt(value => value + 1) };
}
