import { useAsync } from "@/hooks/useAsync";
import { tracks as tracksApi, type Track } from "@/lib/api";

/**
 * Tracks change rarely and are needed by the header, the footer, the filters
 * and the home page, so the request is memoised for the browser session.
 */
let cached: Promise<Track[]> | null = null;

export function loadTracks(): Promise<Track[]> {
  if (!cached) {
    cached = tracksApi.list().catch((err) => {
      cached = null; // let the next caller retry
      throw err;
    });
  }
  return cached;
}

/** Drops the cache after an admin edits a track. */
export function invalidateTracks() {
  cached = null;
}

export function useTracks() {
  const { data, loading, error } = useAsync(() => loadTracks(), []);
  return { tracks: data ?? [], loading, error };
}
