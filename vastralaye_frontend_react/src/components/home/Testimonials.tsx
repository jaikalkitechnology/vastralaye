import { useEffect, useState } from 'react';
import Ornament from '@/components/decor/Ornament';
import { Star } from 'lucide-react';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';
import Reveal from '@/components/motion/Reveal';

interface TestimonialItem {
  quote: string;
  who: string;
  rating: number;
  image?: string | null;
}

/** Customer quote cards (design.md §5.7) — admin-managed via /admin/testimonials.
 *  No invented reviews: until real ones exist the section says "coming soon". */
const Testimonials = () => {
  const [items, setItems] = useState<TestimonialItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/fronted/testimonials')
      .then((res) => {
        if (cancelled || !Array.isArray(res.data) || res.data.length === 0) return;
        setItems(
          res.data.map((t: any) => ({
            quote: t.quote,
            who: [t.customer_name, t.city].filter(Boolean).join(' · '),
            rating: Math.max(1, Math.min(5, Math.round(t.rating || 5))),
            image: t.image_url ? mediaUrl(t.image_url) : null,
          }))
        );
      })
      .catch(() => {
        /* stay in the coming-soon state */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-10">
          <span className="overline-label mb-2">Word of mouth</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso">
            Loved by Our Customers
          </h2>
          <Ornament />
        </Reveal>

        {items.length === 0 && (
          <Reveal>
            <div className="mx-auto max-w-xl rounded-sm border border-dashed border-gold/50 bg-white px-8 py-10 text-center">
              <p className="font-serif text-2xl italic text-espresso">Coming soon</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Reviews from our first customers will appear here.
              </p>
            </div>
          </Reveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {items.slice(0, 6).map((t, i) => (
            <Reveal key={t.who + t.quote.slice(0, 24)} delay={i * 0.08}>
            <figure className="bg-white border border-border rounded-sm p-7 h-full">
              <div className="flex gap-0.5 mb-3" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < t.rating ? 'text-gold fill-gold' : 'text-sand fill-sand'}`}
                  />
                ))}
              </div>
              <blockquote className="font-serif italic text-[15px] leading-relaxed text-espresso mb-4">
                “{t.quote}”
              </blockquote>
              <figcaption className="flex items-center gap-3">
                {t.image && (
                  <img
                    src={t.image}
                    alt={t.who}
                    loading="lazy"
                    className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                  />
                )}
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t.who}
                </span>
              </figcaption>
            </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
