import { useEffect, useState } from 'react';
import { api } from '@/api/api';

/** Store WhatsApp number used until the admin sets one (digits only, with country code). */
export const FALLBACK_WHATSAPP = '918527596413';

export interface SiteSettings {
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  whatsapp_number?: string;
  call_number?: string;
  /** "true" / "false" — controls the floating contact hub. */
  float_enabled?: string;
}

/* Module-level cache so Footer / WhatsAppFloat / InstagramGrid share one request. */
let cached: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;

const fetchSettings = (): Promise<SiteSettings> => {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await api.get('/fronted/settings');
        cached = res.data && typeof res.data === 'object' ? (res.data as SiteSettings) : {};
      } catch {
        cached = {};
      }
      return cached;
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
