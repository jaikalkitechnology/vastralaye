import { Link } from 'react-router-dom';
import Reveal from '@/components/motion/Reveal';
import { mediaUrl } from '@/lib/media';
import { useHomeSections } from '@/hooks/use-home-sections';

/**
 * Editorial 2-up collection banners (design.md §5.6) — image cards with
 * an espresso scrim, gold overline, serif title and outline CTA.
 *
 * Text, links and images are editable from Admin › Banners (Home sections).
 * Anything the admin leaves blank falls back to the built-ins below, and a
 * card switched off there disappears.
 */
const defaults = [
  {
    slot: 'card_1',
    overline: 'Occasion wear',
    title: 'The Festive Edit',
    cta: 'Shop the Edit',
    to: '/products',
    image: '/collections/festive-edit.svg',
    // Shown behind the image, and alone if the file ever fails to load —
    // never the browser's broken-image icon.
    fallback: 'bg-gradient-to-br from-espresso via-maroon to-maroon',
  },
  {
    slot: 'card_2',
    overline: 'Daily comfort',
    title: 'Everyday Essentials',
    cta: 'Shop Essentials',
    to: '/products',
    image: '/collections/everyday-essentials.svg',
    fallback: 'bg-gradient-to-br from-blush via-sand to-ivory',
  },
];

const PromoSection = () => {
  const sections = useHomeSections();

  const cards = defaults
    .map((d) => {
      const row = sections?.[d.slot];
      if (row?.is_active === false) return null;
      return {
        ...d,
        overline: row?.overline || d.overline,
        title: row?.title_line_1 || d.title,
        cta: row?.cta_label || d.cta,
        to: row?.cta_link || d.to,
        image: row?.image_url ? mediaUrl(row.image_url) : d.image,
      };
    })
    .filter(Boolean) as typeof defaults;

  if (cards.length === 0) return null;

  return (
    <section className="py-6 md:py-10">
      <div className="container mx-auto px-4">
        <div className={`grid grid-cols-1 ${cards.length > 1 ? 'md:grid-cols-2' : ''} gap-5 md:gap-6`}>
          {cards.map((b, i) => (
            <Reveal key={b.slot} delay={i * 0.12}>
            <Link
              to={b.to}
              className={`group relative block overflow-hidden rounded-sm aspect-[16/11] ${b.fallback}`}
            >
              <img
                src={b.image}
                alt={b.title}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span
                className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/15 to-transparent"
                aria-hidden="true"
              />
              <span className="absolute left-6 md:left-10 bottom-6 md:bottom-9 text-ivory">
                <span className="block text-[11px] md:text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-1.5">
                  {b.overline}
                </span>
                <span className="block font-serif text-2xl md:text-3xl font-medium mb-4">{b.title}</span>
                <span className="inline-block border border-ivory text-ivory text-[11px] font-semibold uppercase tracking-[0.16em] px-6 py-2.5 rounded-sm group-hover:bg-ivory group-hover:text-espresso transition-colors">
                  {b.cta}
                </span>
              </span>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
