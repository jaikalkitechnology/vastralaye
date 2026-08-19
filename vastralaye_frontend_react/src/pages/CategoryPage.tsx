import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductGrid from '@/components/ProductGrid';
import FilterSidebar from '@/components/FilterSidebar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, Grid, List, Home, ChevronRight, X, ChevronLeft, RefreshCw } from 'lucide-react';
import { listProducts, listCategories, listSubcategories } from '@/api/apihelper';
import { Product, Category } from '@/types';
import PageBanner, { type PageBannerKey } from '@/components/PageBanner';

// Type Definitions
type SortOption = 'featured' | 'newest' | 'price-low-high' | 'price-high-low' | 'rating';
type ViewMode = 'grid' | 'list';

// Constants
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

// Error boundary component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="container mx-auto px-4 py-10">
    <div className="max-w-md mx-auto text-center border border-border rounded-sm bg-white p-8">
      <h3 className="font-serif text-xl font-medium text-espresso mb-2">
        Unable to Load Categories
      </h3>
      <p className="text-sm text-muted-foreground mb-5">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 border border-espresso text-espresso
                   text-xs font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-sm
                   hover:bg-espresso hover:text-ivory transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try Again
      </button>
    </div>
  </div>
);

// Loading component
const LoadingState = ({ message = "Loading..." }: { message?: string }) => (
  <div className="container mx-auto px-4 py-10">
    <div className="flex justify-center items-center min-h-96">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-2 border-sand border-t-gold rounded-full animate-spin" />
        <p className="mt-5 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  </div>
);

// Breadcrumb component
const Breadcrumb = ({ items }: { items: Array<{ label: string; href: string; icon?: any }> }) => (
  <nav className="pt-6" aria-label="Breadcrumb">
    <ol className="flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] text-muted-foreground flex-wrap">
      {items.map((item, index) => (
        <li key={item.href} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">/</span>}
          <Link
            to={item.href}
            className={`hover:text-maroon transition-colors capitalize ${
              index === items.length - 1 ? 'text-espresso font-medium' : ''
            }`}
            aria-current={index === items.length - 1 ? 'page' : undefined}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ol>
  </nav>
);

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentSubCategory, setCurrentSubCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showResultsInfo, setShowResultsInfo] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);

  // API Functions with proper error handling
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData, subcategoriesData] = await Promise.all([
        listCategories(),
        listSubcategories(),
      ]);

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setSubcategories(Array.isArray(subcategoriesData) ? subcategoriesData : []);
    } catch (err) {
      console.error('Error loading initial data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      setCategories([]);
      setSubcategories([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductsData = useCallback(async (categoryId?: string, subcategoryId?: string, search?: string) => {
    try {
      setProductsLoading(true);
      setError(null);

      const productsData = await listProducts();

      if (!Array.isArray(productsData)) {
        console.error('Products data is not an array:', productsData);
        setProducts([]);
        setFilteredProducts([]);
        return [];
      }

      let filteredData = productsData;

      if (subcategoryId) {
        filteredData = filteredData.filter(product => product.subcategory === subcategoryId);
      } else if (categoryId) {
        filteredData = filteredData.filter(product => product.category_id === (categoryId as unknown as number));
      }

      if (search?.trim()) {
        const query = search.toLowerCase().trim();
        filteredData = filteredData.filter(product =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          (Array.isArray(product.tags) && product.tags.some(tag => tag.toLowerCase().includes(query))) ||
          product.brand?.toLowerCase().includes(query)
        );
      }

      setProducts(filteredData);
      setFilteredProducts(filteredData);
      return filteredData;
    } catch (err) {
      console.error('Error loading products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
      setProducts([]);
      setFilteredProducts([]);
      throw err;
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Initial Data Loading
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Find Current Category/Subcategory
  useEffect(() => {
    if (!slug || categories.length === 0 || subcategories.length === 0) return;

    const foundCategory = categories.find(cat => cat.slug === slug);
    if (foundCategory) {
      setCurrentCategory(foundCategory);
      setCurrentSubCategory(null);
      setSearchQuery('');
      setLocalSearchQuery('');
      setCurrentPage(1);
      return;
    }

    const foundSubCategory = subcategories.find(sub => sub.slug === slug);
    if (foundSubCategory) {
      setCurrentSubCategory(foundSubCategory);
      const parentCategory = categories.find(cat => cat.id === foundSubCategory.category_id);
      setCurrentCategory(parentCategory || null);
      setSearchQuery('');
      setLocalSearchQuery('');
      setCurrentPage(1);
      return;
    }

    setCurrentCategory(null);
    setCurrentSubCategory(null);
  }, [slug, categories, subcategories]);

  // Fetch Products when category/subcategory or search changes
  useEffect(() => {
    if (!currentCategory && !currentSubCategory) {
      setProducts([]);
      setFilteredProducts([]);
      return;
    }

    fetchProductsData(currentCategory?.id, currentSubCategory?.id, searchQuery);
  }, [currentCategory, currentSubCategory, searchQuery, fetchProductsData]);

  // Memoized Computed Values
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Home', href: '/', icon: Home },
    ];

    if (currentCategory) {
      items.push({
        label: currentCategory.name,
        href: `/category/${currentCategory.slug}`,
        icon: null,
      });
    }

    if (currentSubCategory) {
      items.push({
        label: currentSubCategory.name,
        href: `/category/${currentSubCategory.slug}`,
        icon: null,
      });
    }

    return items;
  }, [currentCategory, currentSubCategory]);

  const sortedAndFilteredProducts = useMemo(() => {
    if (!Array.isArray(filteredProducts)) {
      console.warn('filteredProducts is not an array:', filteredProducts);
      return [];
    }

    let result = [...filteredProducts];

    switch (sortOption) {
      case 'price-low-high':
        result.sort((a, b) => {
          const priceA = a.discountPrice ?? a.price;
          const priceB = b.discountPrice ?? b.price;
          return priceA - priceB;
        });
        break;
      case 'price-high-low':
        result.sort((a, b) => {
          const priceA = a.discountPrice ?? a.price;
          const priceB = b.discountPrice ?? b.price;
          return priceB - priceA;
        });
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'featured':
      default:
        break;
    }

    return result;
  }, [filteredProducts, sortOption]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(sortedAndFilteredProducts.length / productsPerPage);
  }, [sortedAndFilteredProducts.length, productsPerPage]);

  const displayProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return sortedAndFilteredProducts.slice(startIndex, endIndex);
  }, [sortedAndFilteredProducts, currentPage, productsPerPage]);

  // Event Handlers
  const handleFilterChange = useCallback((filtered: Product[] | any) => {
    if (Array.isArray(filtered)) {
      setFilteredProducts(filtered);
      setCurrentPage(1);
    } else {
      console.error('FilterSidebar returned non-array value:', filtered);
      setFilteredProducts([]);
    }
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearchQuery);
    setCurrentPage(1);
  }, [localSearchQuery]);

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortOption(value);
    setCurrentPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handlePerPageChange = useCallback((value: string) => {
    setProductsPerPage(Number(value));
    setCurrentPage(1);
  }, []);

  const handlePageClick = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages]);

  const handleRetry = useCallback(async () => {
    try {
      await fetchInitialData();
      if (currentCategory || currentSubCategory) {
        await fetchProductsData(currentCategory?.id, currentSubCategory?.id, searchQuery);
      }
    } catch (err) {
      console.error('Retry failed:', err);
    }
  }, [fetchInitialData, fetchProductsData, currentCategory, currentSubCategory, searchQuery]);

  // Loading and Error States
  if (loading) {
    return <LoadingState message="Loading categories..." />;
  }

  if (error && !currentCategory && !currentSubCategory) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  const pageName = currentSubCategory?.name || currentCategory?.name || 'Products';
  /* Admin-managed banner slot for this category (Admin › Banners → Category
     banners); a subcategory page uses its parent category's banner. */
  const bannerSlot = currentCategory
    ? (`category_${currentCategory.id}` as PageBannerKey)
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin-controlled banner, same system as the catalogue pages */}
      <PageBanner
        title={pageName}
        subtitle={`${sortedAndFilteredProducts.length} products`}
        crumb={pageName}
        page={bannerSlot}
      />

      <div className="container mx-auto px-4 pb-16 lg:pb-20">
        {/* Breadcrumb — keeps the deeper category → subcategory chain */}
        {currentSubCategory && <Breadcrumb items={breadcrumbItems} />}

        {/* Page head */}
        <div className="pt-4 pb-6">
          {currentCategory?.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {currentCategory.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {sortedAndFilteredProducts.length} products
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-5 bg-white border border-border border-l-2 border-l-sale rounded-sm">
            <h3 className="font-serif text-lg font-medium text-espresso mb-1">
              Unable to Load Products
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 border border-espresso text-espresso
                         text-xs font-semibold uppercase tracking-[0.14em] px-5 py-2.5
                         rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Filter Sidebar */}
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            products={products}
            onFilterChange={handleFilterChange}
            className="lg:w-64 lg:flex-shrink-0"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-11 rounded-sm border-border bg-white text-sm
                           placeholder:text-muted-foreground focus-visible:ring-1
                           focus-visible:ring-maroon focus-visible:ring-offset-0"
              />
              {localSearchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-espresso transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            {/* Toolbar — count left, sort right; compact Filter/Sort bar on mobile */}
            <div className="flex items-center justify-between gap-3 border-y border-border py-2.5 mb-8">
              {/* Mobile: filter trigger */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden inline-flex items-center gap-2 text-[12px] font-semibold
                           uppercase tracking-[0.14em] text-espresso hover:text-maroon transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>

              {/* Desktop: result count */}
              {showResultsInfo && (
                <p className="hidden lg:block text-sm text-muted-foreground">
                  {sortedAndFilteredProducts.length > 0 ? (
                    <>
                      Showing{' '}
                      <span className="text-espresso font-medium">
                        {(currentPage - 1) * productsPerPage + 1}–
                        {Math.min(currentPage * productsPerPage, sortedAndFilteredProducts.length)}
                      </span>{' '}
                      of <span className="text-espresso font-medium">{sortedAndFilteredProducts.length}</span> products
                    </>
                  ) : (
                    <>0 products</>
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="ml-3 text-[12px] underline underline-offset-4 hover:text-espresso transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </p>
              )}

              <div className="flex items-center gap-4">
                {/* Per page */}
                <Select value={productsPerPage.toString()} onValueChange={handlePerPageChange}>
                  <SelectTrigger
                    className="hidden md:flex h-auto w-auto gap-1.5 border-0 bg-transparent px-0 py-1
                               text-[13px] uppercase tracking-[0.06em] text-muted-foreground
                               hover:text-espresso focus:ring-0 focus:ring-offset-0 rounded-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm border-border bg-white shadow-md">
                    <SelectItem value="12">Show 12</SelectItem>
                    <SelectItem value="24">Show 24</SelectItem>
                    <SelectItem value="48">Show 48</SelectItem>
                    <SelectItem value="100">Show 100</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Dropdown — minimal, borderless until open */}
                <Select value={sortOption} onValueChange={handleSortChange}>
                  <SelectTrigger
                    className="h-auto w-auto gap-1.5 border-0 bg-transparent px-0 py-1
                               text-[13px] uppercase tracking-[0.06em] text-muted-foreground
                               hover:text-espresso focus:ring-0 focus:ring-offset-0 rounded-none"
                  >
                    <span className="hidden sm:inline">Sort by:&nbsp;</span>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent align="end" className="rounded-sm border-border bg-white shadow-md">
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center border border-border rounded-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('grid')}
                    aria-label="Grid view"
                    className={`inline-flex items-center justify-center w-8 h-8 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-espresso text-ivory'
                        : 'bg-white text-muted-foreground hover:text-espresso'
                    }`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('list')}
                    aria-label="List view"
                    className={`inline-flex items-center justify-center w-8 h-8 border-l border-border transition-colors ${
                      viewMode === 'list'
                        ? 'bg-espresso text-ivory'
                        : 'bg-white text-muted-foreground hover:text-espresso'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {productsLoading ? (
              <div className="text-center py-20">
                <div className="inline-block w-10 h-10 border-2 border-sand border-t-gold rounded-full animate-spin" />
                <p className="mt-5 text-sm text-muted-foreground">Loading products…</p>
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                {/* Product Grid */}
                <ProductGrid
                  products={displayProducts}
                  viewMode={viewMode}
                  className="animate-in fade-in-50 duration-300"
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-14 pt-8 border-t border-border">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Page Info */}
                      <div className="text-sm text-muted-foreground">
                        Page <span className="text-espresso font-medium">{currentPage}</span> of{' '}
                        <span className="text-espresso font-medium">{totalPages}</span>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                          type="button"
                          onClick={handlePrevious}
                          disabled={currentPage === 1}
                          className="inline-flex items-center gap-1 border border-espresso text-espresso
                                     text-[11px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5
                                     rounded-sm hover:bg-espresso hover:text-ivory transition-colors
                                     disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Prev
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                            (page) => (
                              <button
                                key={page}
                                type="button"
                                onClick={() => handlePageClick(page)}
                                className={`w-9 h-9 text-sm rounded-sm border transition-colors ${
                                  currentPage === page
                                    ? 'bg-maroon text-ivory border-maroon'
                                    : 'bg-white text-espresso border-border hover:border-espresso'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          )}
                        </div>

                        {/* Next Button */}
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={currentPage === totalPages}
                          className="inline-flex items-center gap-1 border border-espresso text-espresso
                                     text-[11px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5
                                     rounded-sm hover:bg-espresso hover:text-ivory transition-colors
                                     disabled:opacity-40 disabled:pointer-events-none"
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Results Per Page */}
                      <Select
                        value={productsPerPage.toString()}
                        onValueChange={handlePerPageChange}
                      >
                        <SelectTrigger
                          className="h-auto w-auto gap-1.5 border-0 bg-transparent px-0 py-1
                                     text-[13px] uppercase tracking-[0.06em] text-muted-foreground
                                     hover:text-espresso focus:ring-0 focus:ring-offset-0 rounded-none"
                        >
                          <span>Per page:&nbsp;</span>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end" className="rounded-sm border-border bg-white shadow-md">
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="24">24</SelectItem>
                          <SelectItem value="48">48</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No Results State */
              <div className="text-center py-20">
                <p className="overline-label mb-3">Nothing here yet</p>
                <h3 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-3">
                  No products found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                  {searchQuery
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "No products available in this category."}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em]
                               px-8 py-3.5 rounded-sm hover:bg-terracotta transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
