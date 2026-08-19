import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductGrid from './ProductGrid';
import { BASE_URL } from '../config';
import { ShoppingBag, ArrowRight, Grid3x3, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/motion/Reveal';

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
    <section className="py-14 md:py-20">
      <div className="container px-4 mx-auto">
        {/* Header (editorial, design.md §5.5) */}
        <Reveal className="text-center mb-10">
          <span className="overline-label mb-2">Curated For You</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso">
            Premium Collection
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-xl mx-auto">
            Handpicked styles for every occasion — fresh arrivals, loved bestsellers and
            the pieces in between.
          </p>
        </Reveal>

        <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="mb-8">
          {/* Toolbar: hairline tabs left, flat view toggle right */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-4 border-b border-border mb-8">
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="h-auto p-0 bg-transparent rounded-none gap-6 sm:gap-8 justify-start">
                {[
                  { value: 'all', label: 'All Products' },
                  { value: 'new', label: 'New Arrivals' },
                  { value: 'bestseller', label: 'Bestsellers' },
                ].map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="rounded-none bg-transparent px-1 pt-0 pb-3 -mb-px border-b-2 border-transparent text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap transition-colors hover:text-espresso data-[state=active]:border-gold data-[state=active]:text-espresso data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="inline-flex self-start sm:self-auto mb-3 rounded-sm border border-border bg-white overflow-hidden">
              <button
                type="button"
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-espresso text-ivory'
                    : 'text-muted-foreground hover:text-espresso'
                }`}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] border-l border-border transition-colors ${
                  viewMode === 'list'
                    ? 'bg-espresso text-ivory'
                    : 'text-muted-foreground hover:text-espresso'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
            </div>
          </div>


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

        {/* View all — hairline editorial button */}
        <div className="text-center mt-10 md:mt-12">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2.5 rounded-sm border border-espresso px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-espresso transition-colors hover:bg-espresso hover:text-ivory"
          >
            View All Products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Empty State */}
        {!loading && getCurrentProducts().length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 bg-blush rounded-full flex items-center justify-center">
              <ShoppingBag className="w-9 h-9 text-maroon" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-espresso mb-2">No Products Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-7">
              We couldn't find any products in this category. Try switching to a different tab.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setTab('all')}
                className="rounded-sm border border-border bg-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-espresso transition-colors hover:border-maroon hover:text-maroon"
              >
                View All Products
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-sm bg-maroon px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-terracotta"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading the collection…</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;