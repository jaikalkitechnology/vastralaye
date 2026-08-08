import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/api';
import { mediaUrl, getYouTubeId, youTubeThumb, youTubeEmbed } from '@/lib/media';

export interface ReelProduct {
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

const INR = (n?: number | null) =>
  n == null
    ? ''
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

/** Poster image for a reel: uploaded poster → YouTube thumb → '' (use video frame). */
const posterSrc = (r: Reel): string => {
  if (r.poster_url) return mediaUrl(r.poster_url);
  const yt = getYouTubeId(r.video_url);
  return yt ? youTubeThumb(yt) : '';
};

export interface ReelViewerCloseInfo {
  index: number;
  time: number;
}

interface ReelViewerProps {
  reels: Reel[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: (info: ReelViewerCloseInfo) => void;
  /** Seek the initially opened video to this position (uploaded videos only). */
  initialSeek?: number;
}

/**
 * Full-screen reel viewer carousel — playing reel in the center, dimmed
 * prev/next previews on the sides (desktop), slider arrows, position
 * counter, keyboard navigation. Shared by the reels row and the sticky
 * product-page reel. Registers a view for every reel shown.
 */
const ReelViewer = ({ reels, index, onIndexChange, onClose, initialSeek = 0 }: ReelViewerProps) => {
  const active = reels[index];
  const prevReel = index > 0 ? reels[index - 1] : null;
  const nextReel = index < reels.length - 1 ? reels[index + 1] : null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const initialIndexRef = useRef(index);

  /* Slide direction for the smooth transition between reels */
  const prevIndexRef = useRef(index);
  const direction = index >= prevIndexRef.current ? 1 : -1;
  useEffect(() => {
    prevIndexRef.current = index;
  }, [index]);

  const reduceMotion = useReducedMotion();
  const dist = reduceMotion ? 0 : 70;
  const slideVariants = {
    enter: (d: number) => ({ x: d * dist, opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: -d * dist, opacity: 0, scale: 0.97 }),
  };

  /* Register a view for each reel shown (skip pseudo reels with id <= 0) */
  useEffect(() => {
    const reel = reels[index];
    if (reel && reel.id > 0) {
      api.post(`/fronted/reels/${reel.id}/view`).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const go = (i: number) => {
    if (i < 0 || i >= reels.length) return;
    onIndexChange(i);
  };

  const close = () => {
    onClose({ index, time: videoRef.current?.currentTime || 0 });
  };

  /* Keyboard: arrows navigate, Esc closes */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reels.length]);

  if (!active) return null;

  const preview = (reel: Reel, targetIndex: number, side: 'left' | 'right') => (
    <button
      type="button"
      aria-label={side === 'left' ? 'Previous reel preview' : 'Next reel preview'}
      onClick={(e) => {
        e.stopPropagation();
        go(targetIndex);
      }}
      className={`hidden md:block relative w-[120px] lg:w-[150px] aspect-[9/16] rounded overflow-hidden opacity-40 hover:opacity-75 transition-opacity flex-none ${
        side === 'left' ? 'mr-4 lg:mr-6' : 'ml-4 lg:ml-6'
      }`}
    >
      {posterSrc(reel) ? (
        <img src={posterSrc(reel)} alt={reel.caption} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <video src={mediaUrl(reel.video_url)} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
      )}
    </button>
  );

  const arrow = (dir: -1 | 1, enabled: boolean) => (
    <button
      type="button"
      aria-label={dir === -1 ? 'Previous reel' : 'Next reel'}
      disabled={!enabled}
      onClick={(e) => {
        e.stopPropagation();
        go(index + dir);
      }}
      className={`flex-none w-10 h-10 ${dir === -1 ? 'mr-2 md:mr-4' : 'ml-2 md:ml-4'} rounded-full bg-ivory/90 flex items-center justify-center text-espresso hover:bg-ivory hover:scale-105 active:scale-90 transition-all duration-200 ${
        enabled ? '' : 'opacity-0 pointer-events-none'
      }`}
    >
      {dir === -1 ? <ChevronLeft className="h-5 w-5" strokeWidth={1.8} /> : <ChevronRight className="h-5 w-5" strokeWidth={1.8} />}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[100] bg-espresso/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={close}
    >
      {prevReel && preview(prevReel, index - 1, 'left')}
      {arrow(-1, !!prevReel)}

      <div
        className="relative w-full max-w-[380px] aspect-[9/16] bg-black rounded overflow-hidden flex-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Smooth directional slide between reels */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={active.id || active.video_url}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-0"
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
                ref={videoRef}
                src={mediaUrl(active.video_url)}
                poster={active.poster_url ? mediaUrl(active.poster_url) : undefined}
                className="w-full h-full object-contain"
                autoPlay
                controls
                playsInline
                onLoadedMetadata={(e) => {
                  if (initialSeek > 0 && index === initialIndexRef.current) {
                    try {
                      e.currentTarget.currentTime = initialSeek;
                    } catch {
                      /* ignore seek errors */
                    }
                  }
                }}
              />
            )}

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
          </motion.div>
        </AnimatePresence>

        {reels.length > 1 && (
          <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold text-ivory bg-espresso/60 px-2.5 py-0.5 rounded-full">
            {index + 1} / {reels.length}
          </span>
        )}

        <button
          type="button"
          aria-label="Close video"
          onClick={close}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-ivory/90 flex items-center justify-center text-espresso hover:bg-ivory"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {arrow(1, !!nextReel)}
      {nextReel && preview(nextReel, index + 1, 'right')}
    </div>
  );
};

export default ReelViewer;
