/**
 * Where the API lives.
 *
 * `npm run dev` talks to the backend on this machine; `npm run build` talks to
 * the deployed one. One origin either way — it used to be two, because
 * `apihelper.tsx` swapped to a relative `/api` in dev and went through the Vite
 * proxy to a different host than `api.ts` used. Sign-up, login and
 * forgot-password live in `apihelper`, so in dev they posted to a server the
 * rest of the page never spoke to and returned 502.
 *
 * Override either default with VITE_API_ORIGIN:
 *
 *     VITE_API_ORIGIN=https://api.mizorpaymart.com npm run dev   # dev vs live API
 *     VITE_API_ORIGIN=http://192.168.1.20:8000 npm run dev       # phone on the LAN
 */

/** The backend's own default — see vastralaye_backend/run.py. */
const LOCAL_ORIGIN = 'http://127.0.0.1:8000';

/** The deployed API, used by production builds. */
const DEPLOYED_ORIGIN = 'https://api.mizorpaymart.com';

/** Scheme + host, no trailing slash and no path. */
export const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  (import.meta.env.DEV ? LOCAL_ORIGIN : DEPLOYED_ORIGIN)
).replace(/\/+$/, '');

/** Every endpoint hangs off this. */
export const BASE_URL = `${API_ORIGIN}/api/v1`;

/** Uploads and other static files are served from the API host's root. */
export const BASE_IMG = API_ORIGIN;
