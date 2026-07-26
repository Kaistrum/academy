import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  /** Re-runs the loader, e.g. after a mutation. */
  reload: () => void;
  setData: (value: T | null) => void;
}

/**
 * Minimal data-fetching hook: runs `loader` whenever `deps` change, ignores
 * results from a superseded run, and exposes a `reload` for mutations.
 *
 * `enabled: false` holds the request back (used while the router hydrates a
 * `[slug]` param, or until the user is known to be signed in).
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): AsyncState<T> {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    // `loader` is deliberately not a dependency: it is usually an inline
    // closure, so the caller's `deps` decide when a fetch happens, and the
    // closure captured by this run is always the current render's.
    loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err
            : new ApiError(0, "NETWORK_ERROR", "Could not reach the server"),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, error, loading, reload, setData };
}
