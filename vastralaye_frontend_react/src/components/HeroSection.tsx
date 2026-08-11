import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';
import {
  fetchPageBanners,
  isLightColor,
  overlayDefaults,
  overlayGradient,
  type PageBannerData,
} from '@/components/PageBanner';

/**
 * Light editorial hero (design.md §5.2) — warm ivory/blush canvas,
 * serif headline left, arch-framed campaign image right, slow
 * crossfade + Ken Burns on the active slide.
 *
 * Slides come from the admin Banner Control page (GET /fronted/banners);
 * the static set below is the fallback when none are configured.
 */
interface HeroSlide {
  id: number;
  overline: string;
  titleA: string;
  titleB: string;
  description: string;
  image: string;
  ctaPrimary: { label: string; to: string };
  ctaSecondary: { label: string; to: string } | null;
}

const fallbackSlides: HeroSlide[] = [
  {
    id: 1,
    overline: "The Festive Edit '26",
    titleA: 'Woven for the',
    titleB: 'Festive Season',
    description:
      'Handcrafted sarees, suit sets and more — made with love by artisans across India, for every celebration.',
    image: '/banner-1.jpeg',
    ctaPrimary: { label: 'Shop Now', to: '/products' },
    ctaSecondary: { label: 'New Arrivals', to: '/new-arrivals' },
  },
  {
    id: 2,
    overline: 'Everyday Comfort',
    titleA: 'Cottons for',
    titleB: 'Every Single Day',
    description:
      'Breathable weaves and easy silhouettes, crafted to be lived in from morning chai to last light.',
    image: '/jbanner.jpg',
    ctaPrimary: { label: 'Shop Cottons', to: '/products' },
    ctaSecondary: { label: 'Bestsellers', to: '/best-sellers' },
  },
  {
    id: 3,
    overline: 'From the Loom',
    titleA: 'Heritage Craft,',
    titleB: 'Modern Drape',
    description:
      'Block prints of Jaipur, weaves of Banaras — heritage techniques reimagined for today.',
    image: '/cloth-bg.jpg',
    ctaPrimary: { label: 'Explore Collections', to: '/categories' },
    ctaSecondary: { label: 'Our Story', to: '/about' },
  },
];

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [current, setCurrent] = useState(0);
  /* Background image + wash, from Admin → Banner Control → Homepage hero. */
  const [background, setBackground] = useState<PageBannerData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPageBanners().then((map) => {
      if (!cancelled) setBackground(map.home_hero ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Admin-managed banners; fall back to the static slides when none exist. */
  useEffect(() => {
    let cancelled = false;
    api
      .get('/fronted/banners')
      .then((res) => {
        if (cancelled || !Array.isArray(res.data) || res.data.length === 0) return;
        const mapped: HeroSlide[] = res.data.map((b: any) => ({
          id: b.id,
          overline: b.overline || '',
          titleA: b.title_line_1 || '',
          titleB: b.title_line_2 || '',
          description: b.description || '',
          image: mediaUrl(b.image_url),
          ctaPrimary: {
            label: b.cta_primary_label || 'Shop Now',
            to: b.cta_primary_link || '/products',
          },
          ctaSecondary: b.cta_secondary_label
            ? { label: b.cta_secondary_label, to: b.cta_secondary_link || '/products' }
            : null,
        }));
        setSlides(mapped);
        setCurrent(0);
      })
      .catch(() => {
        /* keep fallback slides */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[Math.min(current, slides.length - 1)];

  const bgImage = background?.image_url ? mediaUrl(background.image_url) : null;
  const fallback = overlayDefaults('home_hero');
  const overlayColor = background?.overlay_color || fallback.color;
  const overlayOpacity =
    typeof background?.overlay_opacity === 'number'
      ? background.overlay_opacity
      : fallback.opacity;

  /* Copy flips to ivory over a dark wash so it can never disappear. */
  const onLight = isLightColor(overlayColor);
  const headingClass = onLight ? 'text-espresso' : 'text-ivory';
  const accentClass = onLight ? 'text-maroon' : 'text-gold';
  const bodyClass = onLight ? 'text-muted-foreground' : 'text-ivory/80';
  const outlineBtnClass = onLight
    ? 'border-espresso text-espresso hover:bg-espresso hover:text-ivory'
    : 'border-ivory text-ivory hover:bg-ivory hover:text-espresso';
  const dotIdleClass = onLight
    ? 'bg-espresso/25 hover:bg-espresso/40'
    : 'bg-ivory/30 hover:bg-ivory/55';

  return (
    <section
      className={`relative overflow-hidden ${
        bgImage ? '' : 'bg-gradient-to-r from-blush via-ivory to-sand'
      }`}
      style={bgImage ? { backgroundColor: overlayColor } : undefined}
    >
      {/* Admin-managed background image + wash */}
      {bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundImage: overlayGradient(overlayColor, overlayOpacity) }}
          />
        </>
      )}

      <div className="relative container mx-auto px-4">
        <div
          className={`grid grid-cols-1 items-center gap-10 lg:gap-16 py-12 md:py-20 lg:py-24 min-h-[60vh] ${
            slide.image ? 'lg:grid-cols-2' : ''
          }`}
        >
          {/* Copy */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${slide.id}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="order-2 lg:order-1 text-center lg:text-left"
            >
              {slide.overline && <span className="overline-label mb-4">{slide.overline}</span>}
              {(slide.titleA || slide.titleB) && (
                <h1
                  className={`font-serif text-4xl md:text-5xl xl:text-6xl font-medium leading-[1.12] mb-5 ${headingClass}`}
                >
                  {slide.titleA}
                  {slide.titleB && (
                    <>
                      {slide.titleA && <br />}
                      <em className={`italic ${accentClass}`}>{slide.titleB}</em>
                    </>
                  )}
                </h1>
              )}
              {slide.description && (
                <p className={`text-base md:text-lg max-w-xl mx-auto lg:mx-0 mb-8 ${bodyClass}`}>
                  {slide.description}
                </p>
              )}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link
                  to={slide.ctaPrimary.to}
                  className="inline-block bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em] px-9 py-4 rounded-sm hover:bg-terracotta transition-colors"
                >
                  {slide.ctaPrimary.label}
                </Link>
                {slide.ctaSecondary && (
                  <Link
                    to={slide.ctaSecondary.to}
                    className={`inline-block border text-xs font-semibold uppercase tracking-[0.16em] px-9 py-4 rounded-sm transition-colors ${outlineBtnClass}`}
                  >
                    {slide.ctaSecondary.label}
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arch visual — omitted when the slide carries no image */}
          {slide.image && (
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-[240px] sm:w-[300px] lg:w-[380px]">
              <div className="absolute -inset-4 border border-gold rounded-t-[999px] rounded-b-none pointer-events-none" aria-hidden="true" />
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] bg-sand">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`img-${slide.id}`}
                    src={slide.image}
                    alt={[slide.titleA, slide.titleB].filter(Boolean).join(' ')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 w-full h-full object-cover animate-kenburns"
                  />
                </AnimatePresence>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-[2.5px] rounded-full transition-all duration-300 ${
              i === current ? 'w-7 bg-gold' : `w-4 ${dotIdleClass}`
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
