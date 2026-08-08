import { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductListItem from './ProductListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Grid3x3, List } from 'lucide-react';
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

/** Roomy listing grid — 2 cols mobile / 3–4 desktop (design.md §5.10). */
const gridClasses =
  'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10';

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
        {/* Header skeleton */}
        {(title || subtitle) && (
          <div className="mb-8 space-y-2">
            {title && <Skeleton className="h-8 w-64 bg-sand" />}
            {subtitle && <Skeleton className="h-4 w-48 bg-sand" />}
          </div>
        )}

        {/* Grid skeleton — 3:4 image + text lines */}
        <div className={gridClasses}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[3/4] w-full rounded-sm bg-sand" />
              <Skeleton className="h-4 w-3/4 mt-3 bg-sand" />
              <Skeleton className="h-4 w-1/3 mt-2 bg-sand" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Loading State - List View
  if (loading && viewMode === 'list') {
    return (
      <div className={className}>
        {/* Header skeleton */}
        {(title || subtitle) && (
          <div className="mb-8 space-y-2">
            {title && <Skeleton className="h-8 w-64 bg-sand" />}
            {subtitle && <Skeleton className="h-4 w-48 bg-sand" />}
          </div>
        )}

        {/* List skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex gap-5 border-b border-border pb-6">
              <Skeleton className="w-28 sm:w-36 aspect-[3/4] rounded-sm bg-sand flex-shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <Skeleton className="h-5 w-2/3 bg-sand" />
                <Skeleton className="h-4 w-1/3 bg-sand" />
                <Skeleton className="h-4 w-full bg-sand" />
                <Skeleton className="h-4 w-1/4 bg-sand" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-20 ${className}`}>
        <p className="overline-label mb-3">Nothing here yet</p>
        <h3 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-3">
          No products found
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
          Try adjusting your search or filters to find what you're looking for.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center border border-espresso text-espresso
                     text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5
                     rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
        >
          Refresh Products
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header Section */}
      {(title || subtitle || (showResultsInfo && totalProducts > 0) || (showSort && onSortChange) || onProductsPerPageChange || (showViewToggle && onViewModeChange)) && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {showResultsInfo && totalProducts > 0 && (
              <div className="mt-1 text-sm text-muted-foreground">
                Showing {products.length} of {totalProducts} products
                {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Sort Dropdown — minimal, borderless until open */}
            {showSort && onSortChange && (
              <Select value={sortOption} onValueChange={onSortChange}>
                <SelectTrigger
                  className="h-auto w-auto gap-2 border-0 bg-transparent px-0 py-1
                             text-[13px] uppercase tracking-[0.06em] text-muted-foreground
                             hover:text-espresso focus:ring-0 focus:ring-offset-0 rounded-none"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border bg-white shadow-md">
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Products Per Page */}
            {onProductsPerPageChange && (
              <Select
                value={productsPerPage.toString()}
                onValueChange={(value) => onProductsPerPageChange(Number(value))}
              >
                <SelectTrigger
                  className="h-auto w-auto gap-2 border-0 bg-transparent px-0 py-1
                             text-[13px] uppercase tracking-[0.06em] text-muted-foreground
                             hover:text-espresso focus:ring-0 focus:ring-offset-0 rounded-none"
                >
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border bg-white shadow-md">
                  <SelectItem value="12">12 per page</SelectItem>
                  <SelectItem value="24">24 per page</SelectItem>
                  <SelectItem value="48">48 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* View Toggle */}
            {showViewToggle && onViewModeChange && (
              <div className="flex items-center border border-border rounded-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => onViewModeChange('grid')}
                  aria-label="Grid view"
                  className={`inline-flex items-center justify-center w-9 h-9 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-espresso text-ivory'
                      : 'bg-white text-muted-foreground hover:text-espresso'
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('list')}
                  aria-label="List view"
                  className={`inline-flex items-center justify-center w-9 h-9 border-l border-border transition-colors ${
                    viewMode === 'list'
                      ? 'bg-espresso text-ivory'
                      : 'bg-white text-muted-foreground hover:text-espresso'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Grid or List based on viewMode */}
      {viewMode === 'grid' ? (
        // Grid View
        <div className={gridClasses}>
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
