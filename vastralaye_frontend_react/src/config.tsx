/**
 * Where the API lives.
 *
 * One origin for the whole app, dev and production alike. It used to be two:
 * `api.ts` always called the absolute URL below, while `apihelper.tsx` swapped
 * to a relative `/api` in dev and went through the Vite proxy — which pointed
 * at a different host entirely. Sign-up, login and forgot-password lived in
 * `apihelper`, so in dev they were posting to a server the rest of the page
 * never spoke to, and 502'd when it didn't answer.
 *
 * Override with VITE_API_ORIGIN to point a dev build at a local backend:
 *
 *     VITE_API_ORIGIN=http://127.0.0.1:8000 npm run dev
 */

const DEFAULT_ORIGIN = 'https://api.mizorpaymart.com';

/** Scheme + host, no trailing slash and no path. */
export const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN || DEFAULT_ORIGIN
).replace(/\/+$/, '');

/** Every endpoint hangs off this. */
export const BASE_URL = `${API_ORIGIN}/api/v1`;

/** Uploads and other static files are served from the API host's root. */
export const BASE_IMG = API_ORIGIN;
