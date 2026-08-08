import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { mediaUrl, getYouTubeId, youTubeThumb, youTubeEmbed } from '@/lib/media';
import { Play, X } from 'lucide-react';

interface StickyReelVideoProps {
  productId?: number;
  /** Product's own video (product.video / video_url) used when no reel exists. */
  fallbackVideoUrl?: string | null;
}

/** Page scroll depth after which the mini player appears. */
const SHOW_AFTER_PX = 480;

/**
 * Sticky floating reel on the product page — a small 9:16 player
 * (bottom-left) that appears when the shopper scrolls down past the
 * gallery and slides away when they scroll back up. Tap to expand into
 * the full player; ✕ dismisses it for this page view.
 */
const StickyReelVideo = ({ productId, fallbackVideoUrl }: StickyReelVideoProps) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  /* Pick the product's first reel; fall back to the product's own video. */
  useEffect(() => {
    let cancelled = false;
    api
      .get('/fronted/reels', { params: { placement: 'pdp', product_id: productId, limit: 1 } })
      .then((res) => {
        if (cancelled) return;
        const reel = Array.isArray(res.data) ? res.data[0] : null;
        if (reel) {
          setVideoUrl(reel.video_url || '');
          setPosterUrl(reel.poster_url || '');
          setCaption(reel.caption || '');
        } else if (fallbackVideoUrl) {
          setVideoUrl(fallbackVideoUrl);
        }
      })
      .catch(() => {
        if (!cancelled && fallbackVideoUrl) setVideoUrl(fallbackVideoUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, fallbackVideoUrl]);

  /* Show when scrolled down past the gallery; hide when scrolled back up. */
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!videoUrl || dismissed) return null;
  const ytId = getYouTubeId(videoUrl);

  return (
    <>
      {/* Mini floating player */}
      <div
        className={`fixed bottom-5 left-4 z-40 w-[110px] md:w-[132px] transition-all duration-300 ${
          visible && !expanded
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="relative aspect-[9/16] rounded-md overflow-hidden border border-border shadow-xl bg-espresso">
          {ytId ? (
            <img
              src={posterUrl ? mediaUrl(posterUrl) : youTubeThumb(ytId)}
              alt={caption || 'Product reel'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <video
              src={mediaUrl(videoUrl)}
              poster={posterUrl ? mediaUrl(posterUrl) : undefined}
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
            onClick={() => setExpanded(true)}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="w-9 h-9 rounded-full bg-ivory/95 flex items-center justify-center shadow">
              <Play className="h-4 w-4 text-maroon fill-maroon ml-0.5" />
            </span>
          </button>
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
            {caption || 'Watch reel'}
          </span>
        </div>
      </div>

      {/* Expanded player */}
      {expanded && (
        <div
          className="fixed inset-0 z-[100] bg-espresso/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative w-full max-w-[380px] aspect-[9/16] bg-black rounded overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {ytId ? (
              <iframe
                src={youTubeEmbed(ytId)}
                title={caption || 'Product reel'}
                className="w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={mediaUrl(videoUrl)}
                className="w-full h-full object-contain"
                autoPlay
                controls
                playsInline
              />
            )}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setExpanded(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-ivory/90 flex items-center justify-center text-espresso hover:bg-ivory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StickyReelVideo;
