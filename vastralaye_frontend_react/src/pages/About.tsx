import { Link } from 'react-router-dom';
import { Shield, Zap, Heart, Users } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import { mediaUrl } from '@/lib/media';
import { useHomeSections } from '@/hooks/use-home-sections';

/**
 * About — editorial brand page for Vastraliya Fashion Private Limited.
 * Same visual language as the storefront: ivory/blush/espresso bands,
 * serif display headings, gold zari details, and the wardrobe artwork from
 * the home story band.
 */

const stats = [
  { value: '10,000+', label: 'Happy customers' },
  { value: '5+', label: 'Years of style' },
  { value: '100%', label: 'Delivery success' },
  { value: '4.9/5', label: 'Customer rating' },
];

const wardrobe = [
  'Jeans & Trousers', 'Dresses', 'Dupattas', 'Palazzos', 'Accessories',
];

const pillars = [
  {
    icon: Heart,
    title: 'Quality, checked by hand',
    text: 'Stitching, fabric and finish inspected on every piece before it leaves for your doorstep.',
  },
  {
    icon: Users,
    title: 'Fabrics that last',
    text: 'Materials picked for feel and wear — soft on day one, still right after many washes.',
  },
  {
    icon: Zap,
    title: 'Fast, careful delivery',
    text: 'Orders folded, wrapped and boxed with care, then moved on a network that arrives on time.',
  },
  {
    icon: Shield,
    title: 'Secure by default',
    text: '256-bit SSL encryption and trusted payment gateways protect every order you place.',
  },
];

/** A small row of zari diamonds — the brand's running ornament. */
const Zari = ({ className = '' }: { className?: string }) => (
  <span className={`inline-flex items-center gap-3 ${className}`} aria-hidden="true">
    <span className="h-px w-10 bg-gold/50" />
    <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
    <span className="h-2 w-2 rotate-45 border border-gold" />
    <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
    <span className="h-px w-10 bg-gold/50" />
  </span>
);

const About = () => {
  // The arch image is uploadable from Admin › Banners → Home sections
  // ("About page — arch image"); empty falls back to the wardrobe artwork.
  const sections = useHomeSections();
  const archImage = sections?.about_arch?.image_url
    ? mediaUrl(sections.about_arch.image_url)
    : '/collections/wardrobe-rail.svg';

  return (
  <div className="min-h-screen bg-ivory font-sans">

    {/* ───────────── HERO — editorial split with the wardrobe arch ───────────── */}
    <section className="container mx-auto px-4 pt-12 md:pt-20 pb-14 md:pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-16">
        <Reveal>
          <span className="overline-label mb-4">Vastraliya Fashion Private Limited</span>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-espresso leading-[1.12]">
            A Home for
            <span className="block italic text-maroon">Garments</span>
          </h1>
          <p className="mt-5 text-[15px] md:text-base leading-relaxed text-muted-foreground max-w-lg">
            Ethnic and everyday fashion, made with care — festive silks beside
            easy denim, each piece chosen like it's going to someone we know.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm hover:bg-terracotta transition-colors"
            >
              Shop the Collection
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center justify-center border border-espresso text-espresso text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="flex justify-center lg:justify-end">
          <div className="relative w-[260px] sm:w-[320px] lg:w-[380px]">
            {/* offset gold ring behind the arch */}
            <div
              className="absolute -top-3 -right-3 w-full h-full rounded-t-[999px] border border-gold/45"
              aria-hidden="true"
            />
            <div className="relative aspect-[4/4.6] overflow-hidden rounded-t-[999px] bg-gradient-to-b from-sand via-sand to-blush">
              <img
                src={archImage}
                alt="The Vastraliya wardrobe"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>

    {/* ───────────── TRUST STRIP — espresso band ───────────── */}
    <section className="bg-espresso">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`text-center ${i > 0 ? 'md:border-l md:border-ivory/10' : ''}`}
            >
              <p className="font-serif text-3xl md:text-4xl font-medium text-gold">{s.value}</p>
              <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.22em] text-ivory/60">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ───────────── STORY — narrow editorial column ───────────── */}
    <section className="container mx-auto px-4 py-14 md:py-20">
      <div className="max-w-2xl mx-auto text-center">
        <Reveal>
          <span className="overline-label mb-3">Our Story</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso leading-tight">
            From Vasai,
            <span className="italic text-maroon"> for every celebration</span>
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground text-left md:text-center">
            Vastraliya Fashion Private Limited was founded on a simple belief:
            dressing well should be effortless — quality fabrics, honest prices
            and pieces that earn their place. From Vasai, Maharashtra, we&rsquo;ve grown into
            a trusted fashion destination serving customers across the country —
            with the same passion that drove our first order.
          </p>
        </Reveal>

        {/* Pull-quote: the name */}
        <Reveal delay={0.1}>
          <figure className="mt-10 bg-blush rounded-sm px-8 py-9 md:px-12">
            <Zari className="mb-5" />
            <blockquote className="font-serif text-xl md:text-2xl text-espresso leading-relaxed">
              <span className="text-maroon font-medium">"Vastra"</span> — the Sanskrit
              word for garment. <span className="text-maroon font-medium">"Ālaya"</span> —
              a home. <span className="italic">Vastraliya: a home for garments.</span>
            </blockquote>
            <figcaption className="mt-4 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              The name, explained
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>

    {/* ───────────── THE WARDROBE — blush band with pills + pillars ───────────── */}
    <section className="bg-blush">
      <div className="container mx-auto px-4 py-14 md:py-20">
        <Reveal className="text-center">
          <span className="overline-label mb-3">The Wardrobe</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso leading-tight">
            Curated, <span className="italic text-maroon">not crowded</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-xl mx-auto">
            900+ styles and growing — every one hand-picked to earn its place.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
            {wardrobe.map((w) => (
              <Link
                key={w}
                to="/categories"
                className="inline-flex items-center gap-2 bg-ivory border border-sand text-espresso text-[13px] px-5 py-2 rounded-full hover:border-gold transition-colors"
              >
                <span className="h-1 w-1 rotate-45 bg-gold" aria-hidden="true" />
                {w}
              </Link>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {pillars.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="h-full bg-ivory border border-sand rounded-sm p-6">
                <Icon className="h-5 w-5 text-terracotta" strokeWidth={1.5} />
                <h3 className="mt-4 font-medium text-espresso text-[15px]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* ───────────── MISSION & VISION — espresso band ───────────── */}
    <section className="bg-espresso">
      <div className="container mx-auto px-4 py-14 md:py-20">
        <Reveal className="text-center mb-12">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-gold mb-3">
            What Drives Us
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-ivory leading-tight">
            Mission <span className="italic text-gold">&</span> Vision
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 max-w-5xl mx-auto">
          <Reveal className="lg:pr-14">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-gold mb-4">
              Our Mission
            </span>
            <h3 className="font-serif text-2xl md:text-[28px] font-medium text-ivory leading-snug">
              Beautifully made fashion, in every wardrobe
            </h3>
            <p className="mt-4 text-[14.5px] leading-relaxed text-ivory/65">
              To bring ethnic and everyday styles to every wardrobe at honest
              prices — with service that makes shopping convenient, secure and
              genuinely enjoyable.
            </p>
          </Reveal>
          <Reveal
            delay={0.1}
            className="lg:pl-14 lg:border-l lg:border-ivory/12"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-gold mb-4">
              Our Vision
            </span>
            <h3 className="font-serif text-2xl md:text-[28px] font-medium text-ivory leading-snug">
              India's most loved fashion destination
            </h3>
            <p className="mt-4 text-[14.5px] leading-relaxed text-ivory/65">
              By 2030 — celebrated for quality, a customer-first approach, and
              practices that empower both shoppers and makers.
            </p>
          </Reveal>
        </div>
      </div>
    </section>

    {/* ───────────── CTA — blush, with the zari hem ───────────── */}
    <section className="container mx-auto px-4 py-14 md:py-20">
      <Reveal>
        <div className="max-w-3xl mx-auto text-center bg-blush rounded-sm px-8 py-12 md:py-14">
          <Zari className="mb-6" />
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso leading-tight">
            Dress <span className="italic text-maroon">beautifully</span>
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground">
            The wardrobe is waiting — festive, everyday, and everything between.
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex items-center justify-center bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em] px-10 py-4 rounded-sm hover:bg-terracotta transition-colors"
          >
            Start Shopping
          </Link>
          <p className="mt-8 text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground/80">
            Vastraliya Fashion Private Limited · CIN U47711MR2026PTC478420 · Vasai, Maharashtra
          </p>
        </div>
      </Reveal>
    </section>
  </div>
  );
};

export default About;
