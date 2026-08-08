import HeroSection from '@/components/HeroSection';
import UspStrip from '@/components/UspStrip';
import CategorySection from '@/components/CategorySection';
import FeaturedProducts from '@/components/FeaturedProducts';
import PromoSection from '@/components/PromoSection';
import ReelsSection from '@/components/ReelsSection';
import BrandStory from '@/components/home/BrandStory';
import Testimonials from '@/components/home/Testimonials';
import InstagramGrid from '@/components/home/InstagramGrid';
import NewsletterBand from '@/components/home/NewsletterBand';

/**
 * Homepage assembled per design.md §6.1:
 * hero → USP strip → categories → product carousels → editorial banners
 * → shoppable reels → brand story → testimonials → Instagram → newsletter.
 */
const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <UspStrip />
      <CategorySection />
      <FeaturedProducts />
      <PromoSection />
      <ReelsSection placement="home" />
      <BrandStory />
      <div className="scallop-divider" aria-hidden="true" />
      <Testimonials />
      <InstagramGrid />
      <NewsletterBand />
    </div>
  );
};

export default Index;
