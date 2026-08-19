import { Link } from 'react-router-dom';
import Reveal from '@/components/motion/Reveal';
import { mediaUrl } from '@/lib/media';
import { useHomeSections } from '@/hooks/use-home-sections';

/**
 * Brand story band on blush (design.md §5.7).
 *
 * Everything here — heading, paragraph, the three counters, button and the
 * arch image — is editable from Admin › Banners (Home sections). Blank
 * fields fall back to the built-ins; switching the section off hides it.
 */
const defaultStats = [
  { value: '900+', label: 'Styles' },
  { value: '7-Day', label: 'Easy returns' },
  { value: '50k+', label: 'Happy customers' },
];

const BrandStory = () => {
  const sections = useHomeSections();
  const row = sections?.['story'];

  if (row?.is_active === false) return null;

  const overline = row?.overline || 'Our promise';
  const titleLine1 = row?.title_line_1 || 'Made to Be';
  const titleLine2 = row?.title_line_2 || 'Lived In';
  const paragraph =
    row?.description ||
    'Every Vastraliya piece is picked for how it feels on a real day — quality fabrics, honest stitching and cuts that flatter. Each one is checked before it ships, so what reaches you is exactly what you chose.';
  const ctaLabel = row?.cta_label || 'Read our story';
  const ctaLink = row?.cta_link || '/about';
  const image = row?.image_url ? mediaUrl(row.image_url) : '/collections/wardrobe-rail.svg';

  const stats = defaultStats.map((s, i) => {
    const value = row?.[`stat${i + 1}_value` as keyof typeof row] as string | undefined;
    const label = row?.[`stat${i + 1}_label` as keyof typeof row] as string | undefined;
    return { value: value || s.value, label: label || s.label };
  });

  return (
    <section className="bg-blush">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16 py-14 md:py-20">
          {/* Arch image */}
          <Reveal className="flex justify-center">
            <div className="relative w-[260px] sm:w-[320px] lg:w-[380px]">
              <div className="relative aspect-[4/4.6] overflow-hidden rounded-t-[999px] bg-gradient-to-b from-sand via-sand to-blush">
                <img
                  src={image}
                  alt="A wardrobe rail of Vastraliya styles"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </Reveal>

          {/* Copy */}
          <Reveal delay={0.12} className="text-center lg:text-left">
            <span className="overline-label mb-3">{overline}</span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso leading-tight mb-4">
              {titleLine1}
              {titleLine2 && (
                <>
                  <br className="hidden md:block" /> {titleLine2}
                </>
              )}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-3">
              {paragraph}
            </p>
            <div className="flex justify-center lg:justify-start gap-10 md:gap-12 my-7">
              {stats.map((s) => (
                <div key={s.label}>
                  <span className="block font-serif text-2xl md:text-3xl font-medium text-maroon">
                    {s.value}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to={ctaLink}
              className="inline-block border border-espresso text-espresso text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
            >
              {ctaLabel}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
