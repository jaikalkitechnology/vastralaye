import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { readCache, writeCache } from '@/lib/persistentCache';

/** Store WhatsApp number used until the admin sets one (digits only, with country code). */
export const FALLBACK_WHATSAPP = '917066181207';

export interface SiteSettings {
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  whatsapp_number?: string;
  call_number?: string;
  /** "true" / "false" — controls the floating contact hub. */
  float_enabled?: string;
  /** "true" / "false" — the announcement strip above the header. */
  topbar_enabled?: string;
  /** What that strip says. */
  topbar_text?: string;
  /** Per-item visibility from Admin › Store Settings — "true" hides that
      link/icon in the footer and the floating contact hub. */
  whatsapp_hidden?: string;
  call_hidden?: string;
  instagram_hidden?: string;
  facebook_hidden?: string;
  twitter_hidden?: string;
  youtube_hidden?: string;
  /** Checkout payment options from Admin › Payments — "true" hides that
      method in the cart checkout. Both hidden ⇒ flags are ignored. */
  cod_disabled?: string;
  online_payment_disabled?: string;
}

/** "true" hides — any other value (or no row yet) keeps the item visible. */
export const isHidden = (flag?: string) => flag === 'true';

const SETTINGS_CACHE = 'site-settings';

/* Module-level cache so Footer / WhatsAppFloat / NavBar share one request,
   seeded from localStorage so a refresh paints the admin's copy immediately
   instead of the built-in default. See src/lib/persistentCache.ts. */
let cached: SiteSettings | null = readCache<SiteSettings>(SETTINGS_CACHE);
let inflight: Promise<SiteSettings> | null = null;

const fetchSettings = (): Promise<SiteSettings> => {
  // A cached copy is a head start, not the answer — always revalidate once.
  if (!inflight) {
    inflight = (async () => {
      let next: SiteSettings = {};
      try {
        const res = await api.get('/fronted/settings');
        next = res.data && typeof res.data === 'object' ? (res.data as SiteSettings) : {};
      } catch {
        // Offline: keep showing the last known settings rather than snapping
        // back to defaults, and don't cache the failure.
        return cached ?? {};
      }
      cached = next;
      writeCache(SETTINGS_CACHE, next);
      return next;
    })();
  }
  return inflight;
};

/** Site-wide settings from the admin panel; empty object until loaded / on failure. */
export const useSiteSettings = (): SiteSettings => {
  const [settings, setSettings] = useState<SiteSettings>(cached || {});

  useEffect(() => {
    let mounted = true;
    fetchSettings().then((s) => {
      if (mounted) setSettings(s);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return settings;
};
