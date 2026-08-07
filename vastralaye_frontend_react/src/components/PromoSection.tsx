import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tag, ArrowRight } from 'lucide-react';

const PromoSection = () => {
  const handleCopyCode = () => {
    navigator.clipboard.writeText('WELCOME10');
  };

  return (
    <div className="py-12 bg-gradient-to-r from-navy via-blue-900 to-navy text-white">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Special Summer Offer</h2>
            <p className="text-lg md:text-xl mb-6 text-white/90">
              Get up to 30% off on selected items. Limited time offer with free shipping.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-terracotta hover:bg-terracotta/90 text-white"
            >
              <Link to="/products" className="flex items-center gap-2">
                Shop Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl inline-block border border-white/20">
              <div className="text-5xl md:text-6xl font-bold mb-2 text-terracotta">30%</div>
              <div className="text-xl font-semibold mb-4">DISCOUNT</div>
              
              <div className="space-y-4">
                <p className="text-sm text-white/80">Use this promo code:</p>
                <div 
                  onClick={handleCopyCode}
                  className="cursor-pointer bg-white text-navy font-bold text-xl px-6 py-3 rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2"
                >
                  <Tag className="h-5 w-5" />
                  WELCOME10
                </div>
                <p className="text-xs text-white/60">Click to copy code</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoSection;