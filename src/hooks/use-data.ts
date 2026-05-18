import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActionResult } from '@/actions/helpers';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useData<T>(
  fetcher: () => Promise<ActionResult<T>>,
  deps: unknown[] = [],
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const mountedRef = useRef(true);

  const refetch = useCallback(() => {
    setTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled && mountedRef.current) {
          if (result.error) {
            setError(result.error);
          } else {
            setData(result.data);
          }
        }
      })
      .catch((e) => {
        if (!cancelled && mountedRef.current) {
          setError(e?.message || 'An error occurred');
        }
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, JSON.stringify(deps)]);

  return { data, loading, error, refetch };
}
