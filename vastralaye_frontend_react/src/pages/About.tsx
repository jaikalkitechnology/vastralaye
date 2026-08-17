import {
  Shield,
  Users,
  Truck,
  Award,
  Star,
  ChevronRight,
  Globe,
  Heart,
  Zap,
  ShoppingBag,
  Package,
  Headphones,
  ArrowRight,
  Store,
} from "lucide-react";

const About = () => {
  const stats = [
    {
      icon: Users,
      value: "10,000+",
      label: "Happy Customers",
    },
    {
      icon: Award,
      value: "5+",
      label: "Years Experience",
    },
    {
      icon: Truck,
      value: "100%",
      label: "Delivery Success",
    },
    {
      icon: Star,
      value: "4.9/5",
      label: "Customer Rating",
    },
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Security",
      description:
        "Advanced encryption and secure payment gateways protect every transaction you make with us.",
    },
    {
      icon: Zap,
      title: "Fast Delivery",
      description:
        "A dependable delivery network ensures your order arrives right on time, every time.",
    },
    {
      icon: Heart,
      title: "Quality Assurance",
      description:
        "Every piece is checked by hand — stitching, fabric and finish — before it leaves for your doorstep.",
    },
    {
      icon: Users,
      title: "Customer First",
      description:
        "Your satisfaction drives everything we do. Our support team is always ready to help.",
    },
  ];

  const brandFeatures = [
    {
      icon: ShoppingBag,
      title: "Curated Collections",
      description:
        "Sarees, suit sets, kurtas, dresses, denim and more — every style hand-picked to earn its place.",
    },
    {
      icon: Package,
      title: "Careful Packaging",
      description:
        "Garments are folded, wrapped and boxed with care, so they arrive crisp and ready to wear.",
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description:
        "Real people who know the catalogue — sizing, fabric care or order help, answered fast.",
    },
    {
      icon: Store,
      title: "Artisan Partnerships",
      description:
        "We work directly with weavers, block printers and dyers, so craft heritage stays alive and makers earn fairly.",
    },
  ];

  return (
    <div className="min-h-screen bg-ivory font-sans">
      {/* ───────────── HERO ───────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="overline-label mb-3">Trusted across India</span>

          {/* Company Name */}
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso leading-tight mb-2">
            <span className="text-maroon">VASTRALIYA</span> FASHION
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-6">
            PRIVATE LIMITED
          </p>

          {/* Brand pill */}
          <div className="inline-flex items-center gap-2 bg-white border border-border px-5 py-2 rounded-full mb-6">
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span className="text-sm text-espresso">
              Home of{" "}
              <span className="text-maroon font-semibold">Vastraliya</span>
            </span>
          </div>

          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-8">
            Ethnic and everyday fashion, made with care — built on quality,
            reliability, and genuine respect for the hands that make every piece.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-maroon text-ivory font-medium px-8 py-3 rounded-full hover:bg-terracotta transition-colors"
            >
              Shop Vastraliya <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ───────────── STATS ───────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="bg-white border border-border rounded-lg p-5 text-center"
            >
              <Icon className="w-6 h-6 mx-auto mb-2 text-gold" />
              <p className="font-serif text-2xl font-medium text-espresso">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── VASTRALIYA SPOTLIGHT ───────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-3xl mx-auto">
          {/* header */}
          <div className="text-center mb-8">
            <span className="overline-label mb-2">Our Storefront</span>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-3">
              Welcome to <span className="text-maroon">Vastraliya</span>
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Vastraliya is the online store of Vastraliya Fashion Private
              Limited — a wardrobe of ethnic and everyday styles for shoppers
              across India.
            </p>
          </div>

          {/* banner card */}
          <div className="bg-blush rounded-lg p-8 md:p-10 mb-8">
            <span className="overline-label mb-3">Vastraliya — Dress Beautifully</span>
            <h3 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-4 leading-tight">
              Everything You Love,{" "}
              <span className="text-maroon">Woven with Care</span>
            </h3>
            <p className="text-[15px] leading-relaxed text-muted-foreground mb-6">
              Browse curated styles across occasions — festive silks, everyday
              suit sets, dresses, denim and the pieces in between. Vastraliya
              makes dressing well effortless.
            </p>
            <a
              href="/products"
              className="inline-flex items-center gap-2 bg-maroon text-ivory font-medium px-8 py-3 rounded-full hover:bg-terracotta transition-colors mb-6"
            >
              Explore Vastraliya <ArrowRight className="w-4 h-4" />
            </a>
            {/* category pills */}
            <div className="flex flex-wrap gap-2">
              {[
                "🥻 Sarees",
                "👗 Suit Sets",
                "✨ Lehengas",
                "🧥 Kurtas",
                "👖 Jeans & Trousers",
                "💃 Dresses",
                "🧣 Dupattas",
                "🌸 Palazzos",
                "💍 Accessories",
              ].map((cat) => (
                <span
                  key={cat}
                  className="bg-white border border-border text-espresso text-sm px-4 py-1.5 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* brand features grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {brandFeatures.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white border border-border rounded-lg p-6"
              >
                <div className="w-11 h-11 bg-blush rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-maroon" />
                </div>
                <h4 className="font-medium text-espresso mb-2">{title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── OUR STORY ───────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-3xl mx-auto">
          {/* text */}
          <div className="text-center mb-8">
            <span className="overline-label mb-2">Our Story</span>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso leading-tight">
              A Name That Means{" "}
              <span className="text-maroon">a Home for Garments</span>
            </h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              Vastraliya Fashion Private Limited was established with a simple
              belief: the clothes India celebrates in deserve the same care
              online that they receive on the loom. Founded in Faridabad,
              Haryana, we have grown from a small startup into a trusted
              fashion destination serving customers across India through our
              store,{" "}
              <strong className="text-maroon font-semibold">Vastraliya</strong>.
            </p>
            <p>
              "Vastraliya" joins{" "}
              <strong className="text-espresso font-semibold">"Vastra"</strong> — the
              Sanskrit word for garment — with{" "}
              <strong className="text-espresso font-semibold">"ālaya"</strong>, meaning
              home. A home for garments: festive silks beside everyday
              cottons-to-denim, each chosen like it's going to someone we know.
            </p>
            <p>
              Today,{" "}
              <strong className="text-maroon font-semibold">Vastraliya</strong>{" "}
              serves thousands of customers with the same passion that drove
              our founding, and our commitment to the craft — and the people
              behind it — has never wavered.
            </p>
          </div>

          {/* cards */}
          <div className="mt-8 bg-white border border-border rounded-lg p-6 space-y-3">
            {[
              {
                icon: Globe,
                title: "Pan-India Reach",
                sub: "Delivering to 500+ cities across India",
              },
              {
                icon: Shield,
                title: "Secure Payments",
                sub: "256-bit SSL encryption on every order",
              },
              {
                icon: Award,
                title: "MCA Registered",
                sub: "Vastraliya Fashion Private Limited",
              },
              {
                icon: ShoppingBag,
                title: "Vastraliya",
                sub: "900+ styles & growing",
              },
            ].map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="flex items-center gap-4 p-4 bg-ivory rounded-lg"
              >
                <div className="w-11 h-11 bg-blush rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-maroon" />
                </div>
                <div>
                  <p className="font-medium text-espresso">{title}</p>
                  <p className="text-sm text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── MISSION & VISION ───────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="overline-label mb-2">What Drives Us</span>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso">
              Mission & Vision
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* mission */}
            <div className="bg-white border border-border rounded-lg p-8">
              <div className="w-12 h-12 bg-blush rounded-lg flex items-center justify-center mb-5">
                <Heart className="w-6 h-6 text-maroon" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso mb-3">Our Mission</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                To bring beautifully made ethnic and everyday fashion to every
                wardrobe through{" "}
                <strong className="text-maroon font-semibold">Vastraliya</strong> — at
                honest prices, with service that makes shopping convenient,
                secure, and genuinely enjoyable.
              </p>
            </div>
            {/* vision */}
            <div className="bg-white border border-border rounded-lg p-8">
              <div className="w-12 h-12 bg-blush rounded-lg flex items-center justify-center mb-5">
                <Globe className="w-6 h-6 text-maroon" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso mb-3">Our Vision</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                To make{" "}
                <strong className="text-maroon font-semibold">Vastraliya</strong> India's
                most loved fashion destination by 2030 — celebrated for
                craft, a customer-first approach, and practices that empower
                both shoppers and makers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── CORE VALUES ───────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="overline-label mb-2">What We Stand For</span>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso">
              Our Core Values
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white border border-border rounded-lg p-6"
              >
                <div className="w-11 h-11 bg-blush rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-maroon" />
                </div>
                <h3 className="font-medium text-espresso mb-2">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-3xl mx-auto bg-blush rounded-lg p-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-border px-4 py-1.5 rounded-full text-sm mb-6">
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span className="text-espresso">
              Shop now on{" "}
              <span className="text-maroon font-semibold">Vastraliya</span>
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-6">
            Ready to Experience the{" "}
            <span className="text-maroon">Vastraliya</span> Difference?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-maroon text-ivory font-medium px-10 py-3.5 rounded-full hover:bg-terracotta transition-colors"
            >
              Start Shopping <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
