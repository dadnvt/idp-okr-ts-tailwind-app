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

  return fetch(buildApiUrl(path), { ...init, headers });
}


