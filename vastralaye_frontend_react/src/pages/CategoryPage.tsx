import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductGrid from '@/components/ProductGrid';
import FilterSidebar from '@/components/FilterSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, Grid, List, Loader, Home, ChevronRight, X, ChevronLeft, RefreshCw, SlidersHorizontal, Package, Sparkles, Layers } from 'lucide-react';
import { listProducts, listCategories, listSubcategories } from '@/api/apihelper';
import { Product, Category } from '@/types';

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
  <div className="container px-4 md:px-6 py-8">
    <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-white border-l-4 border-red-500 rounded-xl shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <X className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Unable to Load Categories</h3>
          <p className="text-gray-600 mb-3">{error}</p>
          <Button
            variant="outline"
            onClick={onRetry}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// Loading component
const LoadingState = ({ message = "Loading..." }: { message?: string }) => (
  <div className="container px-4 md:px-6 py-8">
    <div className="flex justify-center items-center min-h-96">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#E97A48] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
        <p className="text-sm text-gray-500 mt-2">Please wait</p>
      </div>
    </div>
  </div>
);

// Breadcrumb component
const Breadcrumb = ({ items }: { items: Array<{ label: string; href: string; icon?: any }> }) => (
  <nav className="mb-6" aria-label="Breadcrumb">
    <ol className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
      {items.map((item, index) => (
        <li key={item.href} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.icon && <item.icon className="h-4 w-4" />}
          <Link
            to={item.href}
            className={`hover:text-[#E97A48] transition-colors capitalize ${
              index === items.length - 1 ? 'text-gray-900 font-medium' : ''
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
        filteredData = filteredData.filter(product => product.category_id === categoryId);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Top Gradient Bar */}
      <div className="h-2 bg-gradient-to-r from-[#E97A48] via-[#5E9F50] to-[#4F90E8]"></div>

      <div className="container px-4 md:px-6 py-8 max-w-[90%]xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 capitalize">
                {currentSubCategory?.name || currentCategory?.name || 'Products'}
              </h1>
              {currentCategory?.description && (
                <p className="text-lg text-gray-600 max-w-2xl">
                  {currentCategory.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E97A48] to-[#E97A48]/80 rounded-xl flex items-center justify-center shadow-md">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {sortedAndFilteredProducts.length}
                </div>
                <div className="text-sm text-gray-500">Products</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Total Products</div>
              <div className="text-2xl font-bold text-[#E97A48]">
                {sortedAndFilteredProducts.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Current Page</div>
              <div className="text-2xl font-bold text-[#5E9F50]">{currentPage}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Per Page</div>
              <div className="text-2xl font-bold text-[#4F90E8]">{productsPerPage}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Total Pages</div>
              <div className="text-2xl font-bold text-gray-900">{totalPages}</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-white border-l-4 border-red-500 rounded-xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Unable to Load Products</h3>
                <p className="text-gray-600 mb-3">{error}</p>
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            products={products}
            onFilterChange={handleFilterChange}
            className="lg:w-80"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filter Bar */}
<div className="relative bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 rounded-2xl border border-gray-200 shadow-lg p-4 mb-6">

              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Section */}
                <div className="flex-1">
                  <form onSubmit={handleSearch} className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input
                      type="search"
                      placeholder="Search products..."
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      className="pl-12 pr-10 py-3 rounded-xl border-gray-300 focus:border-[#E97A48] focus:ring-2 focus:ring-[#E97A48]/20"
                    />
                    {localSearchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </form>
                </div>

                {/* Controls Section */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    <Button
                      type="button"
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('grid')}
                      className={`rounded-lg ${
                        viewMode === 'grid'
                          ? 'bg-white shadow-sm text-[#E97A48]'
                          : 'text-gray-600'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('list')}
                      className={`rounded-lg ${
                        viewMode === 'list'
                          ? 'bg-white shadow-sm text-[#E97A48]'
                          : 'text-gray-600'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Filter Toggle for Mobile */}
                  <Button
                    variant="outline"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="lg:hidden rounded-xl border-gray-300 hover:border-[#E97A48] hover:text-[#E97A48]"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>

                  {/* Sort Dropdown */}
                  <Select value={sortOption} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-gray-300 focus:border-[#E97A48] focus:ring-2 focus:ring-[#E97A48]/20">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Sort by" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="rounded-lg hover:bg-gray-50"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results Info Bar */}
            {showResultsInfo && sortedAndFilteredProducts.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Found {sortedAndFilteredProducts.length} products
                      </h3>
                      <p className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages} • Showing {displayProducts.length} items
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResultsInfo(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Controls Bar */}
            {sortedAndFilteredProducts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    Showing{' '}
                    <span className="font-semibold text-gray-900">
                      {(currentPage - 1) * productsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-gray-900">
                      {Math.min(currentPage * productsPerPage, sortedAndFilteredProducts.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-gray-900">
                      {sortedAndFilteredProducts.length}
                    </span>{' '}
                    products
                  </div>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      onClick={handleClearSearch}
                      className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear search
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Show:</span>
                  <Select value={productsPerPage.toString()} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[100px] rounded-lg border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      <SelectItem value="12" className="rounded-md">
                        12
                      </SelectItem>
                      <SelectItem value="24" className="rounded-md">
                        24
                      </SelectItem>
                      <SelectItem value="48" className="rounded-md">
                        48
                      </SelectItem>
                      <SelectItem value="100" className="rounded-md">
                        100
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Loading State */}
            {productsLoading ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#E97A48] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait</p>
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                {/* Product Grid */}
                <div className={viewMode === 'grid' ? '' : 'space-y-4'}>
                  <ProductGrid
                    products={displayProducts}
                    viewMode={viewMode}
                    className="animate-in fade-in-50 duration-300"
                  />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Page Info */}
                      <div className="text-sm text-gray-600">
                        Page <span className="font-bold text-gray-900">{currentPage}</span> of{' '}
                        <span className="font-bold text-gray-900">{totalPages}</span>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-3">
                        {/* Previous Button */}
                        <Button
                          variant="outline"
                          onClick={handlePrevious}
                          disabled={currentPage === 1}
                          className="rounded-xl border-gray-300 hover:border-[#E97A48] hover:text-[#E97A48] disabled:opacity-50 disabled:cursor-not-allowed px-6"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                            (page) => (
                              <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'outline'}
                                onClick={() => handlePageClick(page)}
                                className={`w-10 h-10 rounded-xl border-gray-300 ${
                                  currentPage === page
                                    ? 'bg-gradient-to-r from-[#E97A48] to-[#E97A48]/90 text-white border-[#E97A48]'
                                    : ''
                                }`}
                              >
                                {page}
                              </Button>
                            )
                          )}
                        </div>

                        {/* Next Button */}
                        <Button
                          variant="outline"
                          onClick={handleNext}
                          disabled={currentPage === totalPages}
                          className="rounded-xl border-gray-300 hover:border-[#E97A48] hover:text-[#E97A48] disabled:opacity-50 disabled:cursor-not-allowed px-6"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>

                      {/* Results Per Page */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Per page:</span>
                        <Select
                          value={productsPerPage.toString()}
                          onValueChange={handlePerPageChange}
                        >
                          <SelectTrigger className="w-[80px] rounded-lg border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-gray-200">
                            <SelectItem value="12" className="rounded-md">
                              12
                            </SelectItem>
                            <SelectItem value="24" className="rounded-md">
                              24
                            </SelectItem>
                            <SelectItem value="48" className="rounded-md">
                              48
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No Results State */
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  {searchQuery
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "No products available in this category."}
                </p>
                {searchQuery && (
                  <Button
                    variant="default"
                    onClick={handleClearSearch}
                    className="bg-gradient-to-r from-[#E97A48] to-[#E97A48]/90 hover:from-[#d86a38] hover:to-[#d86a38] rounded-xl px-8"
                  >
                    Clear Search
                  </Button>
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