import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { mediaUrl, getYouTubeId, youTubeThumb } from '@/lib/media';
import { Play, X } from 'lucide-react';
import ReelViewer, { Reel } from '@/components/ReelViewer';

interface StickyReelVideoProps {
  productId?: number;
  /** Product's own video (product.video / video_url) used when no reel exists. */
  fallbackVideoUrl?: string | null;
}

/**
 * Sticky floating reel on the product page — a small 9:16 player
 * (bottom-left). Visible while browsing; hides when the shopper scrolls
 * DOWN and reappears when they scroll UP. Tapping opens the shared
 * ReelViewer carousel (prev/next previews + slider) over ALL of the
 * product's reels, continuing the video from the same position — and
 * the mini player continues where the viewer stopped after closing.
 * ✕ dismisses for this page view.
 */
const StickyReelVideo = ({ productId, fallbackVideoUrl }: StickyReelVideoProps) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [visible, setVisible] = useState(true);
  const [overReels, setOverReels] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const miniVideoRef = useRef<HTMLVideoElement>(null);
  /** Playback position carried between the mini player and the viewer. */
  const resumeAtRef = useRef(0);

  /* Load ALL of this product's reels; fall back to the product's own video. */
  useEffect(() => {
    let cancelled = false;
    const fallback = (): Reel[] =>
      fallbackVideoUrl
        ? [{ id: 0, caption: '', video_url: fallbackVideoUrl, poster_url: null, views: 0, product: null }]
        : [];
    api
      .get('/fronted/reels', { params: { placement: 'pdp', product_id: productId, limit: 20 } })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setReels(list.length > 0 ? list : fallback());
      })
      .catch(() => {
        if (!cancelled) setReels(fallback());
      });
    return () => {
      cancelled = true;
    };
  }, [productId, fallbackVideoUrl]);

  /* Direction-aware visibility: scrolling DOWN hides the reel,
     scrolling UP shows it again (always shown near the top). */
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < 8) return; // ignore jitter
      if (y < 120) setVisible(true);
      else setVisible(delta < 0);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Hide while the "Watch It Styled" reels section is on screen —
     the reels are right there, so the mini player steps aside. */
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    let attempts = 0;

    const attach = () => {
      if (cancelled) return;
      const el = document.getElementById('watch-it-styled');
      if (!el) {
        /* The section mounts only after its reels load — retry briefly. */
        if (attempts++ < 15) setTimeout(attach, 800);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => setOverReels(entries[0]?.isIntersecting ?? false),
        { threshold: 0.15 }
      );
      observer.observe(el);
    };

    attach();
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [productId]);

  const openViewer = () => {
    resumeAtRef.current = miniVideoRef.current?.currentTime || 0;
    setViewerIndex(0);
    setExpanded(true);
  };

  /* When the viewer closes on the mini's reel, continue the mini from there. */
  useEffect(() => {
    if (!expanded && miniVideoRef.current && resumeAtRef.current > 0) {
      try {
        miniVideoRef.current.currentTime = resumeAtRef.current;
        miniVideoRef.current.play().catch(() => {});
      } catch {
        /* ignore seek errors */
      }
    }
  }, [expanded]);

  const reel = reels[0];
  if (!reel || dismissed) return null;
  const ytId = getYouTubeId(reel.video_url);

  return (
    <>
      {/* Mini floating player */}
      <div
        className={`fixed bottom-[124px] md:bottom-[84px] lg:bottom-5 left-4 z-40 w-[110px] md:w-[132px] transition-all duration-300 ${
          visible && !expanded && !overReels
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="relative aspect-[9/16] rounded-md overflow-hidden border border-border shadow-xl bg-espresso">
          {ytId ? (
            <img
              src={reel.poster_url ? mediaUrl(reel.poster_url) : youTubeThumb(ytId)}
              alt={reel.caption || 'Product reel'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <video
              ref={miniVideoRef}
              src={mediaUrl(reel.video_url)}
              poster={reel.poster_url ? mediaUrl(reel.poster_url) : undefined}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
            />
          )}
          <button
            type="button"
            aria-label="Play product reel"
            onClick={openViewer}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="w-9 h-9 rounded-full bg-ivory/95 flex items-center justify-center shadow">
              <Play className="h-4 w-4 text-maroon fill-maroon ml-0.5" />
            </span>
          </button>
          {reels.length > 1 && (
            <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-semibold text-ivory bg-espresso/70 px-1.5 py-0.5 rounded-full pointer-events-none">
              {reels.length} reels
            </span>
          )}
          <button
            type="button"
            aria-label="Hide reel"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-espresso/70 text-ivory flex items-center justify-center hover:bg-espresso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] leading-tight text-ivory/90 truncate pointer-events-none">
            {reel.caption || 'Watch reel'}
          </span>
        </div>
      </div>

      {/* Expanded — shared carousel viewer with prev/next previews & slider */}
      {expanded && (
        <ReelViewer
          reels={reels}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          initialSeek={resumeAtRef.current}
          onClose={(info) => {
            if (info.index === 0) resumeAtRef.current = info.time;
            setExpanded(false);
          }}
        />
      )}
    </>
  );
};

export default StickyReelVideo;
