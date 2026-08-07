import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '@/components/HeroSection';
import CategorySection from '@/components/CategorySection';
import FeaturedProducts from '@/components/FeaturedProducts';
import PromoSection from '@/components/PromoSection';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent } from '@/components/ui/card';
import { User, ShoppingBag, Settings } from 'lucide-react';

const Index = () => {
  const { state } = useStore();
  const { isLoggedIn, user } = state;

  // Check if the logged-in user is a regular user (not admin)
  const isRegularUser = isLoggedIn && user && user.role === 'user';

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Only show account section for regular users, not admins */}
      {isRegularUser && (
        <div className="container mx-auto my-8 px-4">
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">My Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link 
                  to="/account/profile" 
                  className="flex flex-col items-center bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User className="h-8 w-8 mb-3 text-navy" />
                  <h3 className="font-medium">My Profile</h3>
                  <p className="text-sm text-gray-500 text-center mt-2">Manage your personal information</p>
                </Link>
                <Link 
                  to="/account/orders" 
                  className="flex flex-col items-center bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ShoppingBag className="h-8 w-8 mb-3 text-navy" />
                  <h3 className="font-medium">My Orders</h3>
                  <p className="text-sm text-gray-500 text-center mt-2">Track your order history</p>
                </Link>
                <Link 
                  to="/account/settings" 
                  className="flex flex-col items-center bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings className="h-8 w-8 mb-3 text-navy" />
                  <h3 className="font-medium">Account Settings</h3>
                  <p className="text-sm text-gray-500 text-center mt-2">Manage your account preferences</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <CategorySection />
      <FeaturedProducts />
      {/* <PromoSection /> */}
    </div>
  );
};

export default Index;