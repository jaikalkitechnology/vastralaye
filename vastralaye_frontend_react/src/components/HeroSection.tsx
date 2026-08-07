import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Star, 
  Shield, 
  Truck, 
  Crown,
  Sparkles,
  ChevronDown
} from 'lucide-react';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Luxury Redefined",
      subtitle: "Premium Collection",
      description: "Experience elegance with our curated selection of timeless pieces",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2940&auto=format&fit=crop",
      gradient: "from-rose-500/20 via-purple-500/20 to-indigo-500/20"
    },
    {
      id: 2,
      title: "Modern Elegance",
      subtitle: "New Arrivals",
      description: "Discover the perfect blend of contemporary style and comfort",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2940&auto=format&fit=crop",
      gradient: "from-amber-500/20 via-orange-500/20 to-red-500/20"
    },
    {
      id: 3,
      title: "Exclusive Designs",
      subtitle: "Limited Edition",
      description: "Handpicked collections that define sophistication",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2940&auto=format&fit=crop",
      gradient: "from-teal-500/20 via-emerald-500/20 to-green-500/20"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const features = [
   { icon: Truck, text: "Express Shipping", subtext: "Quick & reliable delivery" },
    { icon: Shield, text: "Secure Payment", subtext: "100% Protected" },
    { icon: Star, text: "Premium Quality", subtext: "Guaranteed" },
    { icon: Crown, text: "VIP Rewards", subtext: "Exclusive deals" }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${slides[currentSlide].image}')` }}
          />
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].gradient}`} />
          
          {/* Dark Overlay for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
          
          {/* Animated Mesh Gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-transparent to-blue-900/30 animate-pulse" 
               style={{ animationDuration: '8s' }} />
        </motion.div>
      </AnimatePresence>

      {/* Floating Particles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-6 lg:px-12 h-screen flex flex-col justify-center">
        <div className="max-w-4xl">
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 
                       bg-white/10 backdrop-blur-xl border border-white/20 
                       rounded-full shadow-2xl"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white tracking-wide">
              {slides[currentSlide].subtitle}
            </span>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          </motion.div>

          {/* Main Heading */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
            >
              <span className="block text-white drop-shadow-2xl">
                {slides[currentSlide].title.split(' ')[0]}
              </span>
              <span className="block bg-gradient-to-r from-white via-gray-200 to-white/80 
                             bg-clip-text text-transparent animate-gradient">
                {slides[currentSlide].title.split(' ').slice(1).join(' ')}
              </span>
            </motion.h1>
          </AnimatePresence>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl lg:text-2xl text-gray-200 mb-10 max-w-2xl 
                       font-light leading-relaxed drop-shadow-lg"
            >
              {slides[currentSlide].description}
            </motion.p>
          </AnimatePresence>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-10 py-5 bg-white text-black font-bold text-lg 
                         rounded-full overflow-hidden shadow-2xl transition-all duration-300
                         hover:shadow-white/50"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Shop Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </Link>

            <Link to="/categories">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white/10 backdrop-blur-xl border-2 border-white/30 
                         text-white font-bold text-lg rounded-full 
                         hover:bg-white/20 hover:border-white/50 
                         transition-all duration-300 shadow-2xl"
              >
                Explore Collections
              </motion.button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-xl 
                         border border-white/10 rounded-2xl hover:bg-white/10 
                         transition-all duration-300 group cursor-pointer"
              >
                <div className="p-2.5 bg-gradient-to-br from-white/20 to-white/5 
                              rounded-xl group-hover:from-white/30 group-hover:to-white/10 
                              transition-all duration-300">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{feature.text}</p>
                  <p className="text-gray-400 text-xs">{feature.subtext}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Slide Indicators */}
        {/* <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === currentSlide 
                  ? 'w-12 bg-white' 
                  : 'w-8 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div> */}
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br 
                    from-purple-500/30 to-pink-500/30 rounded-full blur-3xl 
                    opacity-50 animate-pulse pointer-events-none" 
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br 
                    from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl 
                    opacity-50 animate-pulse pointer-events-none" 
           style={{ animationDuration: '6s' }} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
    </div>
  );
};

export default HeroSection;
