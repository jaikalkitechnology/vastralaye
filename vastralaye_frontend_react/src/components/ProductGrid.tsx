import { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductListItem from './ProductListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid3x3, List, Filter, SortAsc, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  sortOption?: string;
  onSortChange?: (value: string) => void;
  productsPerPage?: number;
  onProductsPerPageChange?: (value: number) => void;
  showViewToggle?: boolean;
  showSort?: boolean;
  showResultsInfo?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalProducts?: number;
  className?: string;
}

const ProductGrid = ({ 
  products, 
  title, 
  subtitle,
  loading = false, 
  viewMode = 'grid',
  onViewModeChange,
  sortOption = 'featured',
  onSortChange,
  productsPerPage = 12,
  onProductsPerPageChange,
  showViewToggle = true,
  showSort = true,
  showResultsInfo = true,
  currentPage = 1,
  totalPages = 1,
  totalProducts = 0,
  className = '' 
}: ProductGridProps) => {
  // Loading State - Grid View
  if (loading && viewMode === 'grid') {
    return (
      <div className={className}>
        {/* Header with skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex-1">
            {title && <Skeleton className="h-8 w-64 mb-2" />}
            {subtitle && <Skeleton className="h-4 w-48" />}
          </div>
          {showViewToggle && (
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-40" />
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          )}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-4 rounded-full" />
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Loading State - List View
  if (loading && viewMode === 'list') {
    return (
      <div className={className}>
        {/* Header with skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex-1">
            {title && <Skeleton className="h-8 w-64 mb-2" />}
            {subtitle && <Skeleton className="h-4 w-48" />}
          </div>
          {showViewToggle && (
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-40" />
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          )}
        </div>

        {/* List skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <Skeleton className="h-48 md:h-48 md:w-48 w-full" />
                  <div className="flex-1 p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-16 w-full" />
                      <div className="flex gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-6 w-16 rounded-full" />
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <div className="space-y-2">
                          <Skeleton className="h-7 w-32" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-28" />
                          <Skeleton className="h-9 w-32" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
          <svg 
            className="w-12 h-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Try adjusting your search or filters to find what you're looking for.
        </p>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => window.location.reload()}
        >
          Refresh Products
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          {title && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
          {showResultsInfo && totalProducts > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              Showing {products.length} of {totalProducts} products
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Sort Dropdown */}
          {showSort && onSortChange && (
            <div className="relative">
              <Select value={sortOption} onValueChange={onSortChange}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-gray-300 focus:border-[#E97A48] focus:ring-2 focus:ring-[#E97A48]/20">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                  <SelectItem value="featured" className="rounded-lg hover:bg-gray-50">
                    Featured
                  </SelectItem>
                  <SelectItem value="price-low-high" className="rounded-lg hover:bg-gray-50">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value="price-high-low" className="rounded-lg hover:bg-gray-50">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value="newest" className="rounded-lg hover:bg-gray-50">
                    Newest First
                  </SelectItem>
                  <SelectItem value="rating" className="rounded-lg hover:bg-gray-50">
                    Highest Rated
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Products Per Page */}
          {onProductsPerPageChange && (
            <div className="relative">
              <Select 
                value={productsPerPage.toString()} 
                onValueChange={(value) => onProductsPerPageChange(Number(value))}
              >
                <SelectTrigger className="w-full sm:w-[120px] rounded-xl border-gray-300">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="12" className="rounded-lg">12 per page</SelectItem>
                  <SelectItem value="24" className="rounded-lg">24 per page</SelectItem>
                  <SelectItem value="48" className="rounded-lg">48 per page</SelectItem>
                  <SelectItem value="100" className="rounded-lg">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* View Toggle */}
          {showViewToggle && onViewModeChange && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#E97A48]' : 'text-gray-600'}`}
              >
                <Grid3x3 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Grid</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={`rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm text-[#E97A48]' : 'text-gray-600'}`}
              >
                <List className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">List</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid or List based on viewMode */}
      {viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {products.map((product) => (
            <ProductListItem key={product.id} product={product} />
          ))}
        </div>
      )}

      
    </div>
  );
};

export default ProductGrid;