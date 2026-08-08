import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

/**
 * Back-to-top button (design.md §5.14) — square espresso chip with a
 * gold chevron, bottom-right. Slides in after 300px of scroll; hover
 * deepens to maroon and nudges the chevron up (no looping animation).
 * Sits above the mobile sticky add-to-cart bar on product pages.
 */
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`group fixed bottom-20 md:bottom-6 right-4 md:right-5 z-40 w-11 h-11 rounded-sm bg-espresso border border-gold shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-maroon hover:scale-105 active:scale-90
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"}`}
    >
      <ChevronUp
        className="h-5 w-5 text-gold transition-transform duration-200 group-hover:-translate-y-0.5"
        strokeWidth={1.8}
      />
    </button>
  );
};

export default ScrollToTopButton;
