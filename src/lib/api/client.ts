/**
 * Thin fetch wrapper around the Kaistrum Academy API.
 *
 * - Base URL comes from `NEXT_PUBLIC_API_URL` (see `.env.local`).
 * - The short-lived access token lives in memory and in localStorage so a
 *   refresh of the page keeps the session.
 * - A 401 triggers exactly one refresh attempt (shared between concurrent
 *   callers) before the original request is replayed.
 * - Errors are normalised onto `ApiError`, which carries the server's
 *   `code`, per-field messages and the 402 `checkout` hand-off.
 */
import type { CheckoutHandoff, Session } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api/v1";

const ACCESS_KEY = "ka_access_token";
const REFRESH_KEY = "ka_refresh_token";

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  checkout?: CheckoutHandoff;

  constructor(
    status: number,
    code: string,
    message: string,
    extra?: { fields?: Record<string, string>; checkout?: CheckoutHandoff },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = extra?.fields;
    this.checkout = extra?.checkout;
  }

  /** True for the "you need to sign in" family. */
  get isAuth() {
    return this.status === 401;
  }
}

// ---- token store -----------------------------------------------------------

let accessToken: string | null = null;
let refreshToken: string | null = null;
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  try {
    accessToken = localStorage.getItem(ACCESS_KEY);
    refreshToken = localStorage.getItem(REFRESH_KEY);
  } catch {
    /* storage may be unavailable (private mode) */
  }
  hydrated = true;
}

export function getAccessToken(): string | null {
  hydrate();
  return accessToken;
}

export function hasStoredSession(): boolean {
  hydrate();
  return Boolean(accessToken || refreshToken);
}

export function setTokens(tokens: { accessToken: string; refreshToken?: string | null }) {
  hydrate();
  accessToken = tokens.accessToken;
  if (tokens.refreshToken !== undefined) refreshToken = tokens.refreshToken;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {
    /* ignore */
  }
}

export function clearTokens() {
  hydrate();
  accessToken = null;
  refreshToken = null;
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

/** Called by the auth context when a refresh fails, so the UI can sign out. */
let onSessionLost: (() => void) | null = null;
export function setSessionLostHandler(fn: (() => void) | null) {
  onSessionLost = fn;
}

// ---- request ---------------------------------------------------------------

export type QueryValue = string | number | boolean | null | undefined;

export function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Skip the automatic refresh-and-retry (used by the auth calls themselves). */
  noRetry?: boolean;
  signal?: AbortSignal;
}

async function toApiError(res: Response): Promise<ApiError> {
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON error body */
  }
  const error = (payload as { error?: Record<string, unknown> } | null)?.error;
  return new ApiError(
    res.status,
    (error?.code as string) ?? "HTTP_ERROR",
    (error?.message as string) ?? res.statusText ?? "Request failed",
    {
      fields: error?.fields as Record<string, string> | undefined,
      checkout: error?.checkout as CheckoutHandoff | undefined,
    },
  );
}

let refreshInFlight: Promise<boolean> | null = null;

/** Rotates the refresh token. Returns false when the session is gone for good. */
export async function refreshSession(): Promise<boolean> {
  hydrate();
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // The cookie is the primary channel; the stored copy covers browsers
        // that drop it (third-party cookie blocking, different site in prod).
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });
      if (!res.ok) return false;
      const { data } = (await res.json()) as { data: Session };
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    } catch {
      return false;
    } finally {
      // Cleared on the next tick so concurrent callers all see this result.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_BASE}${path}${buildQuery(options.query)}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

/** Performs a request and returns the parsed JSON envelope. */
export async function requestRaw<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, options);

  if (res.status === 401 && !options.noRetry && hasStoredSession()) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await rawRequest(path, options);
    } else {
      clearTokens();
      onSessionLost?.();
    }
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** `{ data }` endpoints — returns the unwrapped payload. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const json = await requestRaw<{ data: T }>(path, options);
  return json.data;
}

/** Fetches a binary response (certificate downloads) as a Blob. */
export async function requestBlob(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  let res = await rawRequest(path, options);
  if (res.status === 401 && hasStoredSession() && (await refreshSession())) {
    res = await rawRequest(path, options);
  }
  if (!res.ok) throw await toApiError(res);
  return res.blob();
}
