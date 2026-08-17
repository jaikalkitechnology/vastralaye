import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { readCache, writeCache } from '@/lib/persistentCache';

/**
 * Admin-managed content for the home sections that used to be hard-coded:
 * the two collection cards and the craft-story band (Admin › Banners).
 *
 * Semantics, per slot ("card_1" | "card_2" | "story"):
 *   absent            → the section renders its built-in content
 *   is_active: false  → the section is hidden entirely
 *   any blank field   → that field falls back to the built-in text/artwork
 *
 * Cached like the hero slides (stale-while-revalidate in localStorage), so a
 * refresh paints the admin's version immediately instead of flashing the
 * stock content first.
 */

export interface HomeSectionRow {
  slot: string;
  overline?: string | null;
  title_line_1?: string | null;
  title_line_2?: string | null;
  description?: string | null;
  cta_label?: string | null;
  cta_link?: string | null;
  stat1_value?: string | null;
  stat1_label?: string | null;
  stat2_value?: string | null;
  stat2_label?: string | null;
  stat3_value?: string | null;
  stat3_label?: string | null;
  image_url?: string | null;
  is_active: boolean;
}

export type HomeSections = Record<string, HomeSectionRow>;

const CACHE_KEY = 'home-sections';

/* Both the cards and the story band mount on the home page; share one
   request between them instead of fetching the same payload twice. */
let inflight: Promise<HomeSections> | null = null;

const fetchSections = (): Promise<HomeSections> => {
  if (!inflight) {
    inflight = Promise.resolve(api.get('/fronted/home-sections'))
      .then((res) => {
        const next = (
          res.data && typeof res.data === 'object' ? res.data : {}
        ) as HomeSections;
        writeCache(CACHE_KEY, next);
        return next;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

export const useHomeSections = (): HomeSections | null => {
  const [sections, setSections] = useState<HomeSections | null>(
    () => readCache<HomeSections>(CACHE_KEY),
  );

  useEffect(() => {
    let cancelled = false;
    fetchSections()
      .then((next) => {
        if (!cancelled) setSections(next);
      })
      .catch(() => {
        /* offline — keep whatever we had (cache or built-ins); don't cache
           a failure as if the admin had configured nothing */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return sections;
};
