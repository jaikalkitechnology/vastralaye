import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';
import { PAISLEY_TILE } from '@/components/decor/patterns';

/**
 * Full-width page banner for catalogue pages (All Products, All
 * Categories…). The background image comes from Admin → Banner Control
 * (first active hero banner, GET /fronted/banners) under an espresso
 * gradient so the title stays readable; when no banner is configured it
 * falls back to the espresso + gold paisley treatment. Closed by the
 * site's 3px gold rule, like the hero and account band.
 */

/* First-banner image, fetched once per session and shared across pages. */
let cachedImage: string | null = null;
let fetched = false;
let inflight: Promise<string | null> | null = null;

const fetchBannerImage = (): Promise<string | null> => {
  if (fetched) return Promise.resolve(cachedImage);
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await api.get('/fronted/banners');
        const first = Array.isArray(res.data)
          ? res.data.find((b: any) => b && b.image_url)
          : null;
        cachedImage = first ? mediaUrl(first.image_url) : null;
      } catch {
        cachedImage = null;
      }
      fetched = true;
      return cachedImage;
    })();
  }
  return inflight;
};

/* Per-page banners (Admin → Banner Control → Page Banners): one image +
 * title + subtitle per catalogue page. Fetched once and shared. */
export type PageBannerKey =
  | 'products'
  | 'categories'
  | 'new_arrivals'
  | 'best_sellers'
  /** Background behind the homepage hero slides. */
  | 'home_hero';

export interface PageBannerData {
  page: string;
  image_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
  /** Artwork that carries its own headline — show it edge-to-edge, no wash. */
  full_bleed?: boolean;
  /** Wash over the image / band colour, "#RRGGBB". */
  overlay_color?: string | null;
  /** Wash strength, 0–100. */
  overlay_opacity?: number | null;
}

/* Espresso @ 95 — the look before the overlay became admin-controlled. */
export const DEFAULT_OVERLAY_COLOR = '#2B1B12';
export const DEFAULT_OVERLAY_OPACITY = 95;

/* The homepage hero prints espresso copy, so its wash defaults to ivory. */
export const HOME_HERO_OVERLAY_COLOR = '#FAF6F0';
export const HOME_HERO_OVERLAY_OPACITY = 90;

/** Per-slot overlay defaults, mirroring the backend. */
export const overlayDefaults = (page?: string) =>
  page === 'home_hero'
    ? { color: HOME_HERO_OVERLAY_COLOR, opacity: HOME_HERO_OVERLAY_OPACITY }
    : { color: DEFAULT_OVERLAY_COLOR, opacity: DEFAULT_OVERLAY_OPACITY };

/**
 * Rec. 709 luminance test — decides whether copy over this wash should be
 * espresso or ivory, so a dark overlay can't hide dark text.
 */
export const isLightColor = (hex: string): boolean => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return true;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140;
};

/** "#RRGGBB" + 0–1 alpha → "rgba(r, g, b, a)". */
export const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  const int = m ? parseInt(m[1], 16) : parseInt(DEFAULT_OVERLAY_COLOR.slice(1), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${a.toFixed(3)})`;
};

/**
 * Left-to-right wash at the admin's colour and strength. Keeps the original
 * 95 / 75 / 35 fall-off, so strength 95 reproduces the old espresso gradient
 * exactly and lower values thin the whole ramp evenly.
 */
export const overlayGradient = (color: string, strength: number): string => {
  const peak = Math.max(0, Math.min(100, strength)) / 100;
  return `linear-gradient(to right, ${hexToRgba(color, peak)} 0%, ${hexToRgba(
    color,
    peak * 0.79
  )} 50%, ${hexToRgba(color, peak * 0.37)} 100%)`;
};

let cachedPageBanners: Record<string, PageBannerData> | null = null;
let pageBannersInflight: Promise<Record<string, PageBannerData>> | null = null;

export const fetchPageBanners = (): Promise<Record<string, PageBannerData>> => {
  if (cachedPageBanners) return Promise.resolve(cachedPageBanners);
  if (!pageBannersInflight) {
    pageBannersInflight = (async () => {
      let map: Record<string, PageBannerData> = {};
      try {
        const res = await api.get('/fronted/page-banners');
        if (Array.isArray(res.data)) {
          map = Object.fromEntries(
            res.data.filter((b: any) => b && b.page).map((b: any) => [b.page, b])
          );
        }
      } catch {
        /* banners are optional */
      }
      cachedPageBanners = map;
      return map;
    })();
  }
  return pageBannersInflight;
};

interface PageBannerProps {
  /** Serif headline, e.g. "All Products". */
  title: string;
  /** Muted line under the title (counts, tagline…). */
  subtitle?: string;
  /** Current-page label for the breadcrumb, e.g. "Shop". */
  crumb: string;
  /** Admin page-banner slot; its image/title/subtitle override the props. */
  page?: PageBannerKey;
}

const PageBanner = ({ title, subtitle, crumb, page }: PageBannerProps) => {
  const [image, setImage] = useState<string | null>(cachedImage);
  const [pageData, setPageData] = useState<PageBannerData | null>(
    page && cachedPageBanners ? cachedPageBanners[page] ?? null : null
  );

  useEffect(() => {
    let cancelled = false;
    fetchBannerImage().then((img) => {
      if (!cancelled) setImage(img);
    });
    if (page) {
      fetchPageBanners().then((map) => {
        if (!cancelled) setPageData(map[page] ?? null);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [page]);

  /* Page banner wins; hero-banner image, then paisley, as fallbacks. */
  const pageImage = pageData?.image_url ? mediaUrl(pageData.image_url) : null;
  const shownImage = pageImage || image;
  const shownTitle = pageData?.title || title;
  const shownSubtitle = pageData?.subtitle || subtitle;

  /* Admin-set wash; also the band colour behind/without an image. */
  const overlayColor = pageData?.overlay_color || DEFAULT_OVERLAY_COLOR;
  const overlayOpacity =
    typeof pageData?.overlay_opacity === 'number'
      ? pageData.overlay_opacity
      : DEFAULT_OVERLAY_OPACITY;

  /* Uploaded artwork that already contains its own headline and background:
     show it as-is under a slim breadcrumb strip. Only ever applies to the
     page's own upload — never to the shared hero-banner fallback. */
  if (pageData?.full_bleed && pageImage) {
    return (
      <section className="border-b-[3px] border-gold">
        <div style={{ backgroundColor: overlayColor }}>
          <div className="container mx-auto px-4 py-2.5">
            <nav
              aria-label="Breadcrumb"
              className="text-[11px] uppercase tracking-[0.16em] text-ivory/55"
            >
              <Link to="/" className="hover:text-gold transition-colors">
                Home
              </Link>
              <span className="mx-2">·</span>
              <span className="text-gold font-medium">{crumb}</span>
            </nav>
          </div>
        </div>
        <h1 className="sr-only">{shownTitle}</h1>
        {/* Wide banner artwork shrinks below legibility on a phone, so crop to
            the middle there and only go full-height from md up. */}
        <img
          src={pageImage}
          alt=""
          aria-hidden
          className="block w-full h-[150px] object-cover object-center md:h-auto bg-ivory"
        />
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden border-b-[3px] border-gold"
      style={{ backgroundColor: overlayColor }}
    >
      {shownImage ? (
        <>
          <img
            src={shownImage}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundImage: overlayGradient(overlayColor, overlayOpacity) }}
          />
        </>
      ) : (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: PAISLEY_TILE, backgroundSize: '160px 160px' }}
        />
      )}

      <div className="container relative mx-auto px-4 py-10 md:py-14">
        <nav
          aria-label="Breadcrumb"
          className="text-[11px] uppercase tracking-[0.16em] text-ivory/55"
        >
          <Link to="/" className="hover:text-gold transition-colors">
            Home
          </Link>
          <span className="mx-2">·</span>
          <span className="text-gold font-medium">{crumb}</span>
        </nav>

        <h1 className="font-serif text-3xl md:text-4xl font-medium text-ivory mt-2.5">
          {shownTitle}
        </h1>
        {shownSubtitle && <p className="text-sm text-ivory/70 mt-2 max-w-xl">{shownSubtitle}</p>}

        {/* Gold ornament */}
        <span aria-hidden className="mt-5 flex items-center gap-2.5">
          <span className="h-px w-11 bg-gold/60" />
          <span className="h-[7px] w-[7px] rotate-45 border border-gold" />
          <span className="h-px w-11 bg-gold/60" />
        </span>
      </div>
    </section>
  );
};

export default PageBanner;
