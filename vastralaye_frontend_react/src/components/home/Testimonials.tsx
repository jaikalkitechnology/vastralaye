import Ornament from '@/components/decor/Ornament';
import { Star } from 'lucide-react';

/** Customer quote cards (design.md §5.7) — static seed content for now. */
const testimonials = [
  {
    quote:
      'The chanderi suit set is even prettier in person — the fabric feels like a hug. Got endless compliments at my cousin’s mehendi.',
    who: 'Ananya S. · Jaipur',
  },
  {
    quote:
      'Ordered a Banarasi for my mother’s 60th. The weave, the fall, the packaging — everything felt thoughtful and premium.',
    who: 'Ritika M. · Bengaluru',
  },
  {
    quote:
      'Fast delivery, easy exchange when I got the size wrong, and the kurta itself is my new everyday favourite.',
    who: 'Farhan K. · Delhi',
  },
];

const Testimonials = () => (
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
        {testimonials.map((t) => (
          <figure key={t.who} className="bg-white border border-border rounded-sm p-7">
            <div className="flex gap-0.5 mb-3" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 text-gold fill-gold" />
              ))}
            </div>
            <blockquote className="font-serif italic text-[15px] leading-relaxed text-espresso mb-4">
              “{t.quote}”
            </blockquote>
            <figcaption className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.who}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
