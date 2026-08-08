import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/api';
import { BASE_IMG } from '@/config';
import { getYouTubeId, youTubeThumb } from '@/lib/media';
import ReelViewer, { Reel } from './ReelViewer';

export type { Reel };

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
  /** DOM id for the section (lets other components observe its visibility). */
  id?: string;
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
  id,
}: ReelsSectionProps) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  /* Slider state — arrows appear only when the row overflows */
  const rowRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [reels, updateArrows]);

  const slide = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get('/fronted/reels', { params: { placement, product_id: productId, limit: 20 } })
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

  const showReel = (index: number) => {
    if (index < 0 || index >= reels.length) return;
    setActiveIndex(index);
  };

  if (reels.length === 0) return null;

  return (
    <section id={id} className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="overline-label mb-2">{overline}</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso">{title}</h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Styling reels from our studio and our community — tap to shop the look.
          </p>
        </div>

        <div className="relative">
          {/* Slider arrows — shown only when there are more videos than fit */}
          {canLeft && (
            <button
              type="button"
              aria-label="Previous reels"
              onClick={() => slide(-1)}
              className="hidden md:flex absolute -left-3 top-[36%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-border shadow-md items-center justify-center text-espresso hover:text-maroon hover:border-maroon transition-colors"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
            </button>
          )}
          {canRight && (
            <button
              type="button"
              aria-label="More reels"
              onClick={() => slide(1)}
              className="hidden md:flex absolute -right-3 top-[36%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-border shadow-md items-center justify-center text-espresso hover:text-maroon hover:border-maroon transition-colors"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.8} />
            </button>
          )}

          <div
            ref={rowRef}
            onScroll={updateArrows}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
          {reels.map((reel, i) => (
            <div
              key={reel.id}
              className="min-w-[56%] xs:min-w-[46%] sm:min-w-[36%] md:min-w-[calc((100%-2rem)/3)] lg:min-w-[calc((100%-4rem)/5)] snap-start"
            >
              <button
                type="button"
                onClick={() => showReel(i)}
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
      </div>

      {/* Full-screen reel viewer (shared carousel component) */}
      {activeIndex !== null && (
        <ReelViewer
          reels={reels}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </section>
  );
};

export default ReelsSection;
