import HeroSection from '@/components/HeroSection';
import UspStrip from '@/components/UspStrip';
import CategorySection from '@/components/CategorySection';
import FeaturedProducts from '@/components/FeaturedProducts';
import ReelsSection from '@/components/ReelsSection';

/**
 * Homepage assembled per design.md §6.1:
 * hero → USP strip → categories → product carousels → shoppable reels.
 * (Account shortcuts live in the navbar account menu, not on the home page.)
 */
const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <UspStrip />
      <CategorySection />
      <FeaturedProducts />
      <ReelsSection placement="home" />
    </div>
  );
};

export default Index;
