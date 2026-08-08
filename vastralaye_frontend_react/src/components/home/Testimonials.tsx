import { useEffect, useState } from 'react';
import Ornament from '@/components/decor/Ornament';
import { Star } from 'lucide-react';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';

interface TestimonialItem {
  quote: string;
  who: string;
  rating: number;
  image?: string | null;
}

/** Static fallback shown until admin adds testimonials at /admin/testimonials. */
const fallbackTestimonials: TestimonialItem[] = [
  {
    quote:
      'The chanderi suit set is even prettier in person — the fabric feels like a hug. Got endless compliments at my cousin’s mehendi.',
    who: 'Ananya S. · Jaipur',
    rating: 5,
  },
  {
    quote:
      'Ordered a Banarasi for my mother’s 60th. The weave, the fall, the packaging — everything felt thoughtful and premium.',
    who: 'Ritika M. · Bengaluru',
    rating: 5,
  },
  {
    quote:
      'Fast delivery, easy exchange when I got the size wrong, and the kurta itself is my new everyday favourite.',
    who: 'Farhan K. · Delhi',
    rating: 5,
  },
];

/** Customer quote cards (design.md §5.7) — admin-managed via /admin/testimonials. */
const Testimonials = () => {
  const [items, setItems] = useState<TestimonialItem[]>(fallbackTestimonials);

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
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="overline-label mb-2">Word of mouth</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso">
            Loved by Our Customers
          </h2>
          <Ornament />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {items.slice(0, 6).map((t) => (
            <figure key={t.who + t.quote.slice(0, 24)} className="bg-white border border-border rounded-sm p-7">
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
