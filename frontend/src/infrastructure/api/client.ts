/**
 * Infrastructure: base API client (fetch wrapper).
 * Single place for base URL and shared request behavior.
 */

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";

export function getApiBase(): string {
  return API_BASE;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
