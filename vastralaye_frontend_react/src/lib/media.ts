import { BASE_IMG, BASE_URL } from '@/config';

/** Extract the 11-char YouTube video id from watch/shorts/embed/youtu.be URLs. */
export const getYouTubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
};

/** Thumbnail for a YouTube video id. */
export const youTubeThumb = (id: string): string =>
  `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

/** Privacy-enhanced autoplaying embed URL for a YouTube video id. */
export const youTubeEmbed = (id: string): string =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;

/** Normalize a backend media path (e.g. "/static/uploads/…") to an absolute URL. */
export const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  let s = String(path).trim();
  if (!s) return '';
  // Already a full URL (a Google profile picture, say), or a local preview
  // from URL.createObjectURL / a data URI — all must pass through untouched.
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  if (!s.startsWith('/')) s = `/${s}`;
  if (!s.startsWith('/static/')) s = `/static${s}`;
  return `${(BASE_IMG || BASE_URL || '').replace(/\/$/, '')}${s}`;
};
