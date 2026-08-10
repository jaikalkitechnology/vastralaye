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

interface PageBannerProps {
  /** Serif headline, e.g. "All Products". */
  title: string;
  /** Muted line under the title (counts, tagline…). */
  subtitle?: string;
  /** Current-page label for the breadcrumb, e.g. "Shop". */
  crumb: string;
}

const PageBanner = ({ title, subtitle, crumb }: PageBannerProps) => {
  const [image, setImage] = useState<string | null>(cachedImage);

  useEffect(() => {
    let cancelled = false;
    fetchBannerImage().then((img) => {
      if (!cancelled) setImage(img);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-espresso border-b-[3px] border-gold">
      {image ? (
        <>
          <img
            src={image}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-espresso/95 via-espresso/75 to-espresso/35"
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
          {title}
        </h1>
        {subtitle && <p className="text-sm text-ivory/70 mt-2 max-w-xl">{subtitle}</p>}

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
