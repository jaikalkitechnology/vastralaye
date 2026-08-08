import { BASE_IMG, BASE_URL } from '@/config';

/** Normalize a backend media path (e.g. "/static/uploads/…") to an absolute URL. */
export const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  let s = String(path).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (!s.startsWith('/')) s = `/${s}`;
  if (!s.startsWith('/static/')) s = `/static${s}`;
  return `${(BASE_IMG || BASE_URL || '').replace(/\/$/, '')}${s}`;
};
