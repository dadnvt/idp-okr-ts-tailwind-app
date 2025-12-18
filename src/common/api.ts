/**
 * API helpers (Vite)
 *
 * Configure base URL via env:
 * - VITE_API_BASE_URL=http://localhost:3000
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  'https://4z8g473bcb.execute-api.us-east-1.amazonaws.com/prod';

export function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = buildApiUrl(path);
  try {
    const res = await fetch(url, { ...init, headers });

    // If upstream is down, proxies often return 502/503/504.
    // Emit a global signal so the app can show a maintenance screen.
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      window.dispatchEvent(
        new CustomEvent('api:unreachable', { detail: { path, url, status: res.status } })
      );
    }

    return res;
  } catch (err) {
    // Network error / DNS / connection refused (EC2 down) -> fetch throws.
    window.dispatchEvent(
      new CustomEvent('api:unreachable', { detail: { path, url, error: String(err) } })
    );
    throw err;
  }
}


