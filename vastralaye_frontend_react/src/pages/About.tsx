import {
  Shield,
  Users,
  Truck,
  Award,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
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

import { Link } from "lucide-react";

const About = () => {
  const stats = [
    {
      icon: Users,
      value: "10,000+",
      label: "Happy Customers",
      bg: "from-blue-500 to-blue-600",
    },
    {
      icon: Award,
      value: "5+",
      label: "Years Experience",
      bg: "from-purple-500 to-purple-600",
    },
    {
      icon: Truck,
      value: "100%",
      label: "Delivery Success",
      bg: "from-green-500 to-green-600",
    },
    {
      icon: Star,
      value: "4.9/5",
      label: "Customer Rating",
      bg: "from-orange-500 to-orange-600",
    },
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Security",
      description:
        "Advanced encryption and secure payment gateways protect every transaction you make with us.",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Zap,
      title: "Fast Delivery",
      description:
        "Lightning-fast delivery network ensures your products arrive right on time, every time.",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Heart,
      title: "Quality Assurance",
      description:
        "Every product undergoes rigorous quality checks before it's delivered to your doorstep.",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Users,
      title: "Customer First",
      description:
        "Your satisfaction drives everything we do. Our support team is always ready to help.",
      gradient: "from-green-500 to-emerald-500",
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
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Package,
      title: "Smart Packaging",
      description:
        "Products are packed securely and eco-consciously, ensuring they arrive in perfect condition.",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description:
        "MizorpayMart's dedicated support team resolves queries faster than industry standards.",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: Store,
      title: "Seller Marketplace",
      description:
        "Empower local sellers to list and sell their products on MizorpayMart and reach millions.",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-28 text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/25 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Globe className="w-4 h-4" />
            Trusted across India
          </div>

          {/* Company Name */}
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-3 drop-shadow-sm">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              MIZORPAY
            </span>{" "}
            SOLUTION
          </h1>
          <p className="text-blue-200 text-lg md:text-xl font-medium mb-2">
            (OPC) PRIVATE LIMITED
          </p>

          {/* MizorpayMart brand pill */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-5 py-2 rounded-full mt-2 mb-6">
            <ShoppingBag className="w-5 h-5 text-yellow-300" />
            <span className="font-bold text-base">
              Proudly presents{" "}
              <span className="text-yellow-300 font-extrabold">
                MizorpayMart
              </span>
            </span>
          </div>

          <p className="text-lg md:text-xl max-w-2xl mx-auto text-blue-100 leading-relaxed mb-10">
            Your all-in-one online shopping destination  built on quality,
            reliability, and genuine care for every customer.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Shop on MizorpayMart <ChevronRight className="w-4 h-4" />
            </a>        
          </div>
        </div>
      </section>

      {/* ───────────── STATS RIBBON ───────────── */}
      <section className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, value, label, bg }) => (
            <div
              key={label}
              className={`bg-gradient-to-br ${bg} text-white rounded-2xl p-6 text-center shadow-xl hover:scale-105 transition-transform duration-200`}
            >
              <Icon className="w-8 h-8 mx-auto mb-3 opacity-90" />
              <p className="text-2xl font-extrabold">{value}</p>
              <p className="text-sm opacity-85 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── MIZORPAYMART SPOTLIGHT ───────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 font-semibold text-sm px-4 py-1.5 rounded-full mb-4">
              <ShoppingBag className="w-4 h-4" />
              Our Flagship Platform
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mt-2 mb-4">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                MizorpayMart
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              MizorpayMart is the e-commerce storefront of MIZORPAY SOLUTION
              (OPC) PRIVATE LIMITED  a one-stop mart for millions of shoppers
              across India.
            </p>
          </div>

          {/* banner card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 text-white p-10 md:p-16 mb-14 shadow-2xl">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-300/20 rounded-full blur-2xl" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-indigo-200 font-semibold uppercase tracking-widest text-sm mb-3">
                  MizorpayMart  Shop Smart
                </p>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
                  Everything You Need,{" "}
                  <span className="text-yellow-300">Delivered Fast</span>
                </h3>
                <p className="text-blue-100 mb-8 leading-relaxed">
                  Browse thousands of curated products across categories 
                  Electronics, Fashion, Home & Kitchen, Beauty, Sports, and
                  much more. MizorpayMart makes online shopping effortless.
                </p>
                <a
                  href="/products"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Explore MizorpayMart <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              {/* category pills */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-end">
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
                    className="bg-white/15 backdrop-blur border border-white/25 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/30 transition-colors cursor-pointer"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* mart features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {martFeatures.map(
              ({ icon: Icon, title, description, color, bg }) => (
                <div
                  key={title}
                  className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div
                    className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ───────────── OUR STORY ───────────── */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* text */}
          <div>
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
              Our Story
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-6 leading-tight">
              From a Small Startup to a{" "}
              <span className="text-blue-600">Trusted Platform</span>
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                MIZORPAY SOLUTION (OPC) PRIVATE LIMITED was established with a
                vision to revolutionize the way people shop online. Founded in
                Faridabad, Haryana, we have grown from a small startup to a
                trusted e-commerce platform serving customers across India
                through our flagship store {" "}
                <strong className="text-blue-600">MizorpayMart</strong>.
              </p>
              <p>
                "MIZORPAY" combines{" "}
                <strong className="text-gray-800">"Mizo"</strong>  representing
                our roots and spirit of innovation  with{" "}
                <strong className="text-gray-800">"Pay"</strong>, signifying
                seamless payment solutions. As an OPC Private Limited entity,
                we blend startup agility with corporate stability.
              </p>
              <p>
                Today, through{" "}
                <strong className="text-blue-600">MizorpayMart</strong>, we
                serve thousands of customers with the same passion that drove
                our founding, and our commitment to excellence has never
                wavered.
              </p>
            </div>

            <ul className="mt-8 grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-gray-700 text-sm"
                >
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* cards */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl rotate-3" />
            <div className="relative bg-white rounded-3xl shadow-2xl p-10 space-y-5">
              {[
                {
                  icon: Globe,
                  bg: "bg-blue-600",
                  title: "Pan-India Reach",
                  sub: "Delivering to 500+ cities via MizorpayMart",
                },
                {
                  icon: Shield,
                  bg: "bg-green-600",
                  title: "Secure Payments",
                  sub: "256-bit SSL encryption on every order",
                },
                {
                  icon: Award,
                  bg: "bg-purple-600",
                  title: "MCA Registered",
                  sub: "OPC Private Limited entity",
                },
                {
                  icon: ShoppingBag,
                  bg: "bg-orange-500",
                  title: "MizorpayMart",
                  sub: "1,00,000+ products & growing",
                },
              ].map(({ icon: Icon, bg, title, sub }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors"
                >
                  <div
                    className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── MISSION & VISION ───────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
              What Drives Us
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2">
              Mission & Vision
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* mission */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-10 shadow-xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-blue-100 leading-relaxed">
                  To provide customers with high-quality products at competitive
                  prices through{" "}
                  <strong className="text-white">MizorpayMart</strong>, while
                  delivering exceptional service that exceeds expectations 
                  making online purchasing convenient, secure, and genuinely
                  enjoyable.
                </p>
              </div>
            </div>
            {/* vision */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-10 shadow-xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-purple-100 leading-relaxed">
                  To make{" "}
                  <strong className="text-white">MizorpayMart</strong> India's
                  most loved e-commerce platform by 2030  celebrated for
                  innovation, a customer-centric approach, and sustainable
                  practices that empower both buyers and sellers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── CORE VALUES ───────────── */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
              What We Stand For
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2">
              Our Core Values
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map(({ icon: Icon, title, description, gradient }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                <div
                  className={`bg-gradient-to-br ${gradient} p-6 flex items-center justify-center`}
                >
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="relative overflow-hidden py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <ShoppingBag className="w-4 h-4 text-yellow-300" />
            <span>
              Shop now on{" "}
              <span className="text-yellow-300 font-bold">MizorpayMart</span>
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to Experience the{" "}
            <span className="text-yellow-300">MizorpayMart</span> Difference?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-10 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 text-base"
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