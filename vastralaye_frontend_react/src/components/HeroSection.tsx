import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Light editorial hero (design.md §5.2) — warm ivory/blush canvas,
 * serif headline left, arch-framed campaign image right, slow
 * crossfade + Ken Burns on the active slide.
 */
const slides = [
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
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blush via-ivory to-sand">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16 py-12 md:py-20 lg:py-24 min-h-[60vh]">
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
              <span className="overline-label mb-4">{slide.overline}</span>
              <h1 className="font-serif text-4xl md:text-5xl xl:text-6xl font-medium leading-[1.12] text-espresso mb-5">
                {slide.titleA}
                <br />
                <em className="italic text-maroon">{slide.titleB}</em>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto lg:mx-0 mb-8">
                {slide.description}
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link
                  to={slide.ctaPrimary.to}
                  className="inline-block bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em] px-9 py-4 rounded-sm hover:bg-terracotta transition-colors"
                >
                  {slide.ctaPrimary.label}
                </Link>
                <Link
                  to={slide.ctaSecondary.to}
                  className="inline-block border border-espresso text-espresso text-xs font-semibold uppercase tracking-[0.16em] px-9 py-4 rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
                >
                  {slide.ctaSecondary.label}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arch visual */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-[240px] sm:w-[300px] lg:w-[380px]">
              <div className="absolute -inset-4 border border-gold rounded-t-[999px] rounded-b-none pointer-events-none" aria-hidden="true" />
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] bg-sand">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`img-${slide.id}`}
                    src={slide.image}
                    alt={`${slide.titleA} ${slide.titleB}`}
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
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-[2.5px] rounded-full transition-all duration-300 ${
              i === current ? 'w-7 bg-gold' : 'w-4 bg-espresso/25 hover:bg-espresso/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
