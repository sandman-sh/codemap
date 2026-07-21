/**
 * Returns the base URL for API requests.
 *
 * In local development, Vite proxies `/api` to the Express server so the
 * base is just an empty string (same-origin relative path).
 *
 * In production (e.g. Vercel frontend + Railway backend), set the
 * VITE_API_URL environment variable to the full backend URL
 * (e.g. "https://codemapai-api.up.railway.app").
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || "";
}
