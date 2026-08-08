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
  CheckCircle,
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
        "Lightning-fast delivery network ensures your products arrive right on time, every time.",
    },
    {
      icon: Heart,
      title: "Quality Assurance",
      description:
        "Every product undergoes rigorous quality checks before it's delivered to your doorstep.",
    },
    {
      icon: Users,
      title: "Customer First",
      description:
        "Your satisfaction drives everything we do. Our support team is always ready to help.",
    },
  ];

  const features = [

  ];

  const martFeatures = [
    {
      icon: ShoppingBag,
      title: "Huge Product Range",
      description:
        "From electronics to fashion, groceries to home décor  MizorpayMart has everything under one roof.",
    },
    {
      icon: Package,
      title: "Smart Packaging",
      description:
        "Products are packed securely and eco-consciously, ensuring they arrive in perfect condition.",
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description:
        "MizorpayMart's dedicated support team resolves queries faster than industry standards.",
    },
    {
      icon: Store,
      title: "Seller Marketplace",
      description:
        "Empower local sellers to list and sell their products on MizorpayMart and reach millions.",
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
            <span className="text-maroon">MIZORPAY</span> SOLUTION
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-6">
            (OPC) PRIVATE LIMITED
          </p>

          {/* MizorpayMart brand pill */}
          <div className="inline-flex items-center gap-2 bg-white border border-border px-5 py-2 rounded-full mb-6">
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span className="text-sm text-espresso">
              Proudly presents{" "}
              <span className="text-maroon font-semibold">MizorpayMart</span>
            </span>
          </div>

          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-8">
            Your all-in-one online shopping destination  built on quality,
            reliability, and genuine care for every customer.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-maroon text-ivory font-medium px-8 py-3 rounded-full hover:bg-terracotta transition-colors"
            >
              Shop on MizorpayMart <ChevronRight className="w-4 h-4" />
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

      {/* ───────────── MIZORPAYMART SPOTLIGHT ───────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-3xl mx-auto">
          {/* header */}
          <div className="text-center mb-8">
            <span className="overline-label mb-2">Our Flagship Platform</span>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-3">
              Welcome to <span className="text-maroon">MizorpayMart</span>
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              MizorpayMart is the e-commerce storefront of MIZORPAY SOLUTION
              (OPC) PRIVATE LIMITED  a one-stop mart for millions of shoppers
              across India.
            </p>
          </div>

          {/* banner card */}
          <div className="bg-blush rounded-lg p-8 md:p-10 mb-8">
            <span className="overline-label mb-3">MizorpayMart  Shop Smart</span>
            <h3 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-4 leading-tight">
              Everything You Need,{" "}
              <span className="text-maroon">Delivered Fast</span>
            </h3>
            <p className="text-[15px] leading-relaxed text-muted-foreground mb-6">
              Browse thousands of curated products across categories
              Electronics, Fashion, Home & Kitchen, Beauty, Sports, and
              much more. MizorpayMart makes online shopping effortless.
            </p>
            <a
              href="/products"
              className="inline-flex items-center gap-2 bg-maroon text-ivory font-medium px-8 py-3 rounded-full hover:bg-terracotta transition-colors mb-6"
            >
              Explore MizorpayMart <ArrowRight className="w-4 h-4" />
            </a>
            {/* category pills */}
            <div className="flex flex-wrap gap-2">
              {[
                "📱 Electronics",
                "👗 Fashion",
                "🏠 Home & Kitchen",
                "💄 Beauty",
                "⚽ Sports",
                "📚 Books",
                "🛒 Groceries",
                "🧸 Toys",
                "🔧 Tools",
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

          {/* mart features grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {martFeatures.map(({ icon: Icon, title, description }) => (
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
              From a Small Startup to a{" "}
              <span className="text-maroon">Trusted Platform</span>
            </h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              MIZORPAY SOLUTION (OPC) PRIVATE LIMITED was established with a
              vision to revolutionize the way people shop online. Founded in
              Faridabad, Haryana, we have grown from a small startup to a
              trusted e-commerce platform serving customers across India
              through our flagship store {" "}
              <strong className="text-maroon font-semibold">MizorpayMart</strong>.
            </p>
            <p>
              "MIZORPAY" combines{" "}
              <strong className="text-espresso font-semibold">"Mizo"</strong>  representing
              our roots and spirit of innovation  with{" "}
              <strong className="text-espresso font-semibold">"Pay"</strong>, signifying
              seamless payment solutions. As an OPC Private Limited entity,
              we blend startup agility with corporate stability.
            </p>
            <p>
              Today, through{" "}
              <strong className="text-maroon font-semibold">MizorpayMart</strong>, we
              serve thousands of customers with the same passion that drove
              our founding, and our commitment to excellence has never
              wavered.
            </p>
          </div>

          <ul className="mt-8 grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-muted-foreground text-sm"
              >
                <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* cards */}
          <div className="mt-8 bg-white border border-border rounded-lg p-6 space-y-3">
            {[
              {
                icon: Globe,
                title: "Pan-India Reach",
                sub: "Delivering to 500+ cities via MizorpayMart",
              },
              {
                icon: Shield,
                title: "Secure Payments",
                sub: "256-bit SSL encryption on every order",
              },
              {
                icon: Award,
                title: "MCA Registered",
                sub: "OPC Private Limited entity",
              },
              {
                icon: ShoppingBag,
                title: "MizorpayMart",
                sub: "1,00,000+ products & growing",
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
                To provide customers with high-quality products at competitive
                prices through{" "}
                <strong className="text-maroon font-semibold">MizorpayMart</strong>, while
                delivering exceptional service that exceeds expectations
                making online purchasing convenient, secure, and genuinely
                enjoyable.
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
                <strong className="text-maroon font-semibold">MizorpayMart</strong> India's
                most loved e-commerce platform by 2030  celebrated for
                innovation, a customer-centric approach, and sustainable
                practices that empower both buyers and sellers.
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
              <span className="text-maroon font-semibold">MizorpayMart</span>
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-6">
            Ready to Experience the{" "}
            <span className="text-maroon">MizorpayMart</span> Difference?
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
