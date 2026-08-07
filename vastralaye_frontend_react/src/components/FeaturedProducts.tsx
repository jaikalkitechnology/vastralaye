import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ProductGrid from './ProductGrid';
import { BASE_URL } from '../config';
import { 
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  ShoppingBag,
  Package,
  ArrowRight,
  Grid3x3,
  List
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PaginationState {
  currentPage: number;
  hasMore: boolean;
  limit: number;
}

const FeaturedProducts = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination states for each tab
  const [allPagination, setAllPagination] = useState<PaginationState>({
    currentPage: 1,
    hasMore: true,
    limit: 20
  });

  const [newArrivalsPagination, setNewArrivalsPagination] = useState<PaginationState>({
    currentPage: 1,
    hasMore: true,
    limit: 20
  });

  const [bestSellersPagination, setBestSellersPagination] = useState<PaginationState>({
    currentPage: 1,
    hasMore: true,
    limit: 20
  });

  // Fetch all products
  const fetchAllProducts = async (page: number = 1) => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `${BASE_URL}/admin/products?page=${page}&limit=${allPagination.limit}`
      );
      const data = await response.json();
      
      if (data.products && data.total !== undefined) {
        const products = data.products || [];
        setAllProducts(products);
        
        const totalPages = Math.ceil(data.total / allPagination.limit);
        setAllPagination({
          currentPage: page,
          hasMore: page < totalPages,
          limit: allPagination.limit
        });
      } else {
        const products = Array.isArray(data) ? data : [];
        setAllProducts(products);
        
        const hasMore = products.length === allPagination.limit;
        setAllPagination({
          currentPage: page,
          hasMore: hasMore,
          limit: allPagination.limit
        });
      }
    } catch (error) {
      console.error('Error fetching all products:', error);
      setAllPagination(prev => ({ ...prev, hasMore: false }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch new arrivals
  const fetchNewArrivals = async (page: number = 1) => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `${BASE_URL}/admin/product/new-arrivals?page=${page}&limit=${newArrivalsPagination.limit}`
      );
      const data = await response.json();
      
      if (data.products && data.total !== undefined) {
        const products = data.products || [];
        setNewArrivals(products);
        
        const totalPages = Math.ceil(data.total / newArrivalsPagination.limit);
        setNewArrivalsPagination({
          currentPage: page,
          hasMore: page < totalPages,
          limit: newArrivalsPagination.limit
        });
      } else {
        const products = Array.isArray(data) ? data : [];
        setNewArrivals(products);
        
        const hasMore = products.length === newArrivalsPagination.limit;
        setNewArrivalsPagination({
          currentPage: page,
          hasMore: hasMore,
          limit: newArrivalsPagination.limit
        });
      }
    } catch (error) {
      console.error('Error fetching new arrival products:', error);
      setNewArrivalsPagination(prev => ({ ...prev, hasMore: false }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch best sellers
  const fetchBestSellers = async (page: number = 1) => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `${BASE_URL}/admin/products/best-sellers?page=${page}&limit=${bestSellersPagination.limit}`
      );
      const data = await response.json();
      
      if (data.products && data.total !== undefined) {
        const products = data.products || [];
        setBestSellers(products);
        
        const totalPages = Math.ceil(data.total / bestSellersPagination.limit);
        setBestSellersPagination({
          currentPage: page,
          hasMore: page < totalPages,
          limit: bestSellersPagination.limit
        });
      } else {
        const products = Array.isArray(data) ? data : [];
        setBestSellers(products);
        
        const hasMore = products.length === bestSellersPagination.limit;
        setBestSellersPagination({
          currentPage: page,
          hasMore: hasMore,
          limit: bestSellersPagination.limit
        });
      }
    } catch (error) {
      console.error('Error fetching best seller products:', error);
      setBestSellersPagination(prev => ({ ...prev, hasMore: false }));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllProducts(1);
  }, []);

  // Lazy load other tabs
  useEffect(() => {
    if (tab === 'new' && newArrivals.length === 0) {
      fetchNewArrivals(1);
    }
    if (tab === 'bestseller' && bestSellers.length === 0) {
      fetchBestSellers(1);
    }
  }, [tab]);

  // Get current products
  const getCurrentProducts = (): Product[] => {
    switch (tab) {
      case 'all': return allProducts;
      case 'new': return newArrivals;
      case 'bestseller': return bestSellers;
      default: return allProducts;
    }
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white px-5 py-2.5 rounded-full text-sm font-bold mb-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Award className="w-4 h-4" fill="white" />
            Premium Collection
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
            Discover Our <span className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] bg-clip-text text-transparent">Featured</span> Products
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
            Explore our handpicked selection of premium products across different categories
          </p>
        </div>

      

        {/* Tabs Component - Fixed: TabsList is now properly inside Tabs */}
       <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="mb-8">
<div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
  {/* Tabs - Scrollable on mobile, full width */}
  <div className="w-full lg:w-auto overflow-x-auto scrollbar-hide">
    <TabsList className="bg-white border border-gray-200 shadow-sm rounded-xl p-1 inline-flex w-full lg:w-auto">
      <TabsTrigger 
        value="all"
        className="flex-1 lg:flex-initial rounded-lg px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#559F4B] data-[state=active]:to-[#E1783E] data-[state=active]:text-white font-medium transition-all duration-300 text-xs sm:text-sm lg:text-base"
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <Package className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="whitespace-nowrap hidden xs:inline">All Products</span>
          <span className="whitespace-nowrap xs:hidden">All</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger 
        value="new"
        className="flex-1 lg:flex-initial rounded-lg px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#559F4B] data-[state=active]:to-[#E1783E] data-[state=active]:text-white font-medium transition-all duration-300 text-xs sm:text-sm lg:text-base"
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="whitespace-nowrap hidden xs:inline">New Arrivals</span>
          <span className="whitespace-nowrap xs:hidden">New</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger 
        value="bestseller"
        className="flex-1 lg:flex-initial rounded-lg px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#559F4B] data-[state=active]:to-[#E1783E] data-[state=active]:text-white font-medium transition-all duration-300 text-xs sm:text-sm lg:text-base"
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="whitespace-nowrap hidden xs:inline">Best Sellers</span>
          <span className="whitespace-nowrap xs:hidden">Best</span>
        </div>
      </TabsTrigger>
    </TabsList>
  </div>

  {/* View Mode Toggle - Full width on mobile, auto on desktop */}
  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full lg:w-auto">
    <Button
      type="button"
      variant={viewMode === 'grid' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setViewMode('grid')}
      className={`flex-1 lg:flex-initial rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 transition-all ${
        viewMode === 'grid' 
          ? 'bg-white shadow-sm text-[#559F4B]' 
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Grid3x3 className="h-4 w-4" />
      <span className="ml-2 text-sm font-medium">Grid</span>
    </Button>
    <Button
      type="button"
      variant={viewMode === 'list' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setViewMode('list')}
      className={`flex-1 lg:flex-initial rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 transition-all ${
        viewMode === 'list' 
          ? 'bg-white shadow-sm text-[#559F4B]' 
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <List className="h-4 w-4" />
      <span className="ml-2 text-sm font-medium">List</span>
    </Button>
  </div>
</div>

{/* Add this CSS to hide scrollbar while keeping scroll functionality */}
<style jsx>{`
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>


  {/* Tab Content */}
  <TabsContent value="all">
    <ProductGrid 
      products={allProducts} 
      title="" 
      loading={loading} 
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      className="px-0"
      showViewToggle={false}
    />
  </TabsContent>

  <TabsContent value="new">
    <ProductGrid 
      products={newArrivals} 
      title="" 
      loading={loading} 
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      className="px-0"
      showViewToggle={false}
    />
  </TabsContent>

  <TabsContent value="bestseller">
    <ProductGrid 
      products={bestSellers} 
      title="" 
      loading={loading} 
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      className="px-0"
      showViewToggle={false}
    />
  </TabsContent>
</Tabs>

        {/* View All Products Button - Centered */}
        <div className="text-center mt-10 md:mt-14">
          <Link to="/products">
            <Button 
              className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#E1783E] hover:to-[#559F4B] text-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 rounded-xl px-8 py-6 text-lg font-bold group"
              size="lg"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75"></div>
                  <ShoppingBag className="w-6 h-6 relative z-10" />
                </div>
                <span>View All Products</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </Button>
          </Link>
          
          <p className="text-gray-600 mt-4 text-sm md:text-base">
            Explore our complete collection of premium products
          </p>
        </div>

        {/* Empty State */}
        {!loading && getCurrentProducts().length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#559F4B]/10 to-[#E1783E]/10 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Products Found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              We couldn't find any products in this category. Try switching to a different tab.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => setTab('all')}
                className="border-[#559F4B] text-[#559F4B] hover:bg-[#559F4B]/10"
              >
                View All Products
              </Button>
              <Button 
                variant="default"
                className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#E1783E] hover:to-[#559F4B] text-white"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#559F4B]/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#559F4B] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <div className="text-[#559F4B] font-bold text-lg">Loading Products</div>
                <p className="text-gray-600 text-sm">Fetching our premium collection...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;