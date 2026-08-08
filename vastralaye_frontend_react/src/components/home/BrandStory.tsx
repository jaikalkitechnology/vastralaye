import { Link } from 'react-router-dom';

/** Craft storytelling band on blush (design.md §5.7). */
const stats = [
  { value: '40+', label: 'Craft forms' },
  { value: '900+', label: 'Styles' },
  { value: '50k+', label: 'Happy customers' },
];

const BrandStory = () => (
  <section className="bg-blush">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16 py-14 md:py-20">
        {/* Arch image */}
        <div className="flex justify-center">
          <div className="relative w-[260px] sm:w-[320px] lg:w-[380px]">
            <div className="relative aspect-[4/4.6] overflow-hidden rounded-t-[999px] bg-sand">
              <img
                src="/cloth-bg.jpg"
                alt="Handcrafted fabrics at the loom"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="text-center lg:text-left">
          <span className="overline-label mb-3">Our craft</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso leading-tight mb-4">
            From Loom to Wardrobe,
            <br className="hidden md:block" /> with Love
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-3">
            Every Vastralaye piece begins in the hands of an artisan — block printers of Jaipur,
            weavers of Banaras, dyers of Kutch. We work directly with craft clusters so heritage
            stays alive and makers earn fairly.
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
            to="/about"
            className="inline-block border border-espresso text-espresso text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
          >
            Read our story
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default BrandStory;
