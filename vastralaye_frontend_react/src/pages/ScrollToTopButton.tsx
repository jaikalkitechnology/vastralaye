import { useState, useEffect } from "react";
import { ArrowUp, ChevronUp } from "lucide-react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ 
      top: 0, 
      behavior: "smooth" 
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`group fixed bottom-6 right-6 bg-gradient-to-br from-[#E97A48] to-[#5E9F50] text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 border border-white/20
        ${isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      aria-label="Scroll to top"
    >
      <div className="relative">
        <ArrowUp size={20} className="group-hover:animate-bounce" />
        
        {/* Ripple effect */}
        <span className="absolute inset-0 rounded-full bg-white/10 group-hover:animate-ping opacity-0 group-hover:opacity-100"></span>
      </div>
    </button>
  );
};

export default ScrollToTopButton;