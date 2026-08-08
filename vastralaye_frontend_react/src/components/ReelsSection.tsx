import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, X, ArrowRight } from 'lucide-react';
import { api } from '@/api/api';
import { BASE_IMG } from '@/config';
import { getYouTubeId, youTubeThumb, youTubeEmbed } from '@/lib/media';

interface ReelProduct {
  id: number;
  name: string;
  price: number;
  discount_price?: number | null;
  image?: string | null;
}

export interface Reel {
  id: number;
  caption: string;
  video_url: string;
  poster_url?: string | null;
  views: number;
  product?: ReelProduct | null;
}

const mediaUrl = (path?: string | null) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  let s = path.startsWith('/') ? path : `/${path}`;
  if (!s.startsWith('/static/')) s = `/static${s}`;
  return `${(BASE_IMG || '').replace(/\/$/, '')}${s}`;
};

const INR = (n?: number | null) =>
  n == null
    ? ''
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatViews = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`;

interface ReelsSectionProps {
  placement?: 'home' | 'pdp';
  productId?: number;
  title?: string;
  overline?: string;
}

/**
 * Shoppable video reels (design.md §5.7 "ReelsSection") — 9:16 video
 * cards with a play overlay and an attached product strip. Renders
 * nothing when the API has no published reels for the placement.
 */
const ReelsSection = ({
  placement = 'home',
  productId,
  title = 'Vastralaye in Motion',
  overline = 'Watch & Shop',
}: ReelsSectionProps) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [active, setActive] = useState<Reel | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/fronted/reels', { params: { placement, product_id: productId } })
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) setReels(res.data);
      })
      .catch(() => {
        /* reels are optional — hide the section on failure */
      });
    return () => {
      cancelled = true;
    };
  }, [placement, productId]);

  const openReel = (reel: Reel) => {
    setActive(reel);
    api.post(`/fronted/reels/${reel.id}/view`).catch(() => {});
  };

  if (reels.length === 0) return null;

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="overline-label mb-2">{overline}</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso">{title}</h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Styling reels from our studio and our community — tap to shop the look.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible snap-x">
          {reels.slice(0, 5).map((reel) => (
            <div key={reel.id} className="min-w-[56%] xs:min-w-[46%] sm:min-w-[36%] md:min-w-0 snap-start">
              <button
                type="button"
                onClick={() => openReel(reel)}
                className="group relative block w-full aspect-[9/16] overflow-hidden rounded-t bg-sand text-left"
              >
                {reel.poster_url ? (
                  <img
                    src={mediaUrl(reel.poster_url)}
                    alt={reel.caption}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : getYouTubeId(reel.video_url) ? (
                  <img
                    src={youTubeThumb(getYouTubeId(reel.video_url) as string)}
                    alt={reel.caption}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={mediaUrl(reel.video_url)}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-espresso/40 via-transparent to-transparent" />
                <span className="absolute top-2.5 left-2.5 bg-espresso/60 text-ivory text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full">
                  Reel
                </span>
                <span className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-ivory/95 shadow-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-maroon fill-maroon ml-0.5" />
                </span>
                <span className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-ivory text-xs">
                  <Eye className="h-3.5 w-3.5" /> {formatViews(reel.views)}
                </span>
              </button>

              {reel.product && (
                <Link
                  to={`/product/${reel.product.id}`}
                  className="flex items-center gap-2.5 bg-white border border-border border-t-0 rounded-b px-3 py-2.5 hover:bg-ivory transition-colors"
                >
                  {reel.product.image && (
                    <img
                      src={mediaUrl(reel.product.image)}
                      alt={reel.product.name}
                      className="w-8 h-10 object-cover rounded-[3px] shrink-0"
                      loading="lazy"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block text-xs text-espresso truncate">{reel.product.name}</span>
                    <span className="block text-xs font-semibold text-espresso">
                      {INR(reel.product.discount_price || reel.product.price)}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-terracotta ml-auto shrink-0" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Video lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[100] bg-espresso/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-[380px] aspect-[9/16] bg-black rounded overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {getYouTubeId(active.video_url) ? (
              <iframe
                src={youTubeEmbed(getYouTubeId(active.video_url) as string)}
                title={active.caption}
                className="w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={mediaUrl(active.video_url)}
                poster={active.poster_url ? mediaUrl(active.poster_url) : undefined}
                className="w-full h-full object-contain"
                autoPlay
                controls
                playsInline
              />
            )}
            <button
              type="button"
              aria-label="Close video"
              onClick={() => setActive(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-ivory/90 flex items-center justify-center text-espresso hover:bg-ivory"
            >
              <X className="h-5 w-5" />
            </button>
            {active.product && (
              <Link
                to={`/product/${active.product.id}`}
                className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 bg-ivory/95 rounded px-3 py-2.5"
              >
                {active.product.image && (
                  <img
                    src={mediaUrl(active.product.image)}
                    alt={active.product.name}
                    className="w-8 h-10 object-cover rounded-[3px]"
                  />
                )}
                <span className="min-w-0">
                  <span className="block text-xs text-espresso truncate">{active.product.name}</span>
                  <span className="block text-sm font-semibold text-espresso">
                    {INR(active.product.discount_price || active.product.price)}
                  </span>
                </span>
                <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.12em] text-maroon shrink-0">
                  Shop →
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ReelsSection;
