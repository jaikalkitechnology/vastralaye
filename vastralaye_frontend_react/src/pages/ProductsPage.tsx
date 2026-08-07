import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import ProductGrid from "@/components/ProductGrid";
import FilterSidebar from "@/components/FilterSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, ChevronLeft, ChevronRight, Grid, List, SlidersHorizontal, X, RefreshCw, ChevronDown, ChevronUp, Package, Sparkles, Star } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/config";
import { Product } from "@/types";

interface Filters {
  category_id?: number | null;
  subcategory_id?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  in_stock?: boolean | null;
  featured?: boolean | null;
  best_seller?: boolean | null;
  new_arrival?: boolean | null;
}

const ProductsPage = () => {
  const { state, dispatch } = useStore();
  const { products } = state;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [showResultsInfo, setShowResultsInfo] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ✅ FIX: Debounce search input (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ✅ FIX: Stringify filters to avoid object reference changes
  const filtersString = JSON.stringify(filters);

  // ✅ Fetch products from backend with filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params: any = {};

        // Add search query
        if (debouncedSearch && debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        // Add sort option
        params.sort_by = sortOption;

        // Parse filters back from string
        const parsedFilters = JSON.parse(filtersString);

        // Add filters
        if (parsedFilters.category_id !== null && parsedFilters.category_id !== undefined) {
          params.category_id = parsedFilters.category_id;
        }
        if (parsedFilters.subcategory_id !== null && parsedFilters.subcategory_id !== undefined) {
          params.subcategory_id = parsedFilters.subcategory_id;
        }
        if (parsedFilters.min_price !== null && parsedFilters.min_price !== undefined) {
          params.min_price = parsedFilters.min_price;
        }
        if (parsedFilters.max_price !== null && parsedFilters.max_price !== undefined) {
          params.max_price = parsedFilters.max_price;
        }
        if (parsedFilters.in_stock !== null && parsedFilters.in_stock !== undefined) {
          params.in_stock = parsedFilters.in_stock;
        }
        if (parsedFilters.featured !== null && parsedFilters.featured !== undefined) {
          params.featured = parsedFilters.featured;
        }
        if (parsedFilters.best_seller !== null && parsedFilters.best_seller !== undefined) {
          params.best_seller = parsedFilters.best_seller;
        }
        if (parsedFilters.new_arrival !== null && parsedFilters.new_arrival !== undefined) {
          params.new_arrival = parsedFilters.new_arrival;
        }

        console.log("Fetching products with params:", params);

        const res = await axios.get(`${BASE_URL}/fronted/products/products`, {
          params,
        });

        const data: Product[] = res.data || [];
        
        // ✅ Filter out any cart-related items if they exist in the data
        const filteredData = data.filter(product => {
          // Remove products marked as "in_cart" or similar if they exist
          // This assumes your Product type might have a cart-related property
          const productAny = product as any;
          return !productAny.is_in_cart && !productAny.in_cart && !productAny.cart_item;
        });
        
        setAllProducts(filteredData);

        // Update StoreContext
        dispatch({ type: "SET_PRODUCTS", payload: filteredData });
        dispatch({ type: "SET_FILTERED_PRODUCTS", payload: filteredData });
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch products"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // ✅ FIX: Use filtersString instead of filters object to prevent infinite loops
  }, [dispatch, debouncedSearch, sortOption, filtersString]);

  // Handle pagination
  useEffect(() => {
    if (allProducts.length > 0) {
      const total = Math.ceil(allProducts.length / productsPerPage);
      setTotalPages(total);

      if (currentPage > total) {
        setCurrentPage(1);
      }

      const startIndex = (currentPage - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      const paginatedProducts = allProducts.slice(startIndex, endIndex);

      setDisplayProducts(paginatedProducts);
    } else {
      setDisplayProducts([]);
      setTotalPages(1);
    }
  }, [allProducts, currentPage, productsPerPage]);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    console.log("Filters changed:", newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const sortMapping: { [key: string]: string } = {
      featured: "featured",
      "price-low-high": "price_asc",
      "price-high-low": "price_desc",
      newest: "newest",
      rating: "rating",
    };

    setSortOption(sortMapping[value] || "featured");
    setCurrentPage(1);
  };

  const handlePerPageChange = (value: string) => {
    setProductsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Calculate active filter count
  const activeFilterCount = Object.values(filters).filter(val => 
    val !== null && val !== undefined && val !== false
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Top Gradient Bar */}
      <div className="h-2 bg-gradient-to-r from-[#E97A48] via-[#5E9F50] to-[#4F90E8]"></div>

      <div className="container px-4 md:px-6 py-8 max-w-[90%]xl mx-auto">
        {/* Hero Header - Clean Design */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                All Products
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Browse our complete catalog of premium products
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E97A48] to-[#E97A48]/80 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{allProducts.length}</div>
                <div className="text-sm text-gray-500">Available Products</div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Clean Version */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Filters Active</div>
              <div className="text-2xl font-bold text-[#E97A48]">{activeFilterCount}</div>
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
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            products={allProducts || []}
            onFilterChange={handleFilterChange}
            className="lg:w-80"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filter Bar - Clean Design */}
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-3 rounded-xl border-gray-300 focus:border-[#E97A48] focus:ring-2 focus:ring-[#E97A48]/20"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-lg ${viewMode === "grid" ? 'bg-white shadow-sm text-[#E97A48]' : 'text-gray-600'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={`rounded-lg ${viewMode === "list" ? 'bg-white shadow-sm text-[#E97A48]' : 'text-gray-600'}`}
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
                    {activeFilterCount > 0 && (
                      <span className="ml-2 bg-[#E97A48] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <Select
                      value={
                        sortOption === "price_asc"
                          ? "price-low-high"
                          : sortOption === "price_desc"
                          ? "price-high-low"
                          : sortOption === "newest"
                          ? "newest"
                          : sortOption === "rating"
                          ? "rating"
                          : "featured"
                      }
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-gray-300 focus:border-[#E97A48] focus:ring-2 focus:ring-[#E97A48]/20">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
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
                </div>
              </div>
            </div>

            {/* Results Info Bar - Optional */}
            {showResultsInfo && allProducts.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Found {allProducts.length} products
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
            {allProducts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">
                      {(currentPage - 1) * productsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-gray-900">
                      {Math.min(currentPage * productsPerPage, allProducts.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {allProducts.length}
                    </span>{" "}
                    products
                  </div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Show:</span>
                  <Select
                    value={productsPerPage.toString()}
                    onValueChange={handlePerPageChange}
                  >
                    <SelectTrigger className="w-[100px] rounded-lg border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      <SelectItem value="12" className="rounded-md">12</SelectItem>
                      <SelectItem value="24" className="rounded-md">24</SelectItem>
                      <SelectItem value="48" className="rounded-md">48</SelectItem>
                      <SelectItem value="100" className="rounded-md">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#E97A48] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 text-lg font-medium">Unable to load products</p>
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                {/* Product Grid - Clean without cart indicators */}
                <div className={viewMode === "grid" ? "" : "space-y-4"}>
                  <ProductGrid 
                    products={displayProducts} 
                    title="" 
                    viewMode={viewMode}
                    showCartIndicators={false} // Assuming ProductGrid accepts this prop
                  />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Page Info */}
                      <div className="text-sm text-gray-600">
                        Page <span className="font-bold text-gray-900">{currentPage}</span> of{" "}
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
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)
                            .map((page) => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                onClick={() => handlePageClick(page)}
                                className={`w-10 h-10 rounded-xl border-gray-300 ${
                                  currentPage === page 
                                    ? 'bg-gradient-to-r from-[#E97A48] to-[#E97A48]/90 text-white border-[#E97A48]'
                                    : ''
                                }`}
                              >
                                {page}
                              </Button>
                            ))}
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
                            <SelectItem value="12" className="rounded-md">12</SelectItem>
                            <SelectItem value="24" className="rounded-md">24</SelectItem>
                            <SelectItem value="48" className="rounded-md">48</SelectItem>
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
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="default"
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-[#E97A48] to-[#E97A48]/90 hover:from-[#d86a38] hover:to-[#d86a38] rounded-xl px-8"
                  >
                    Clear All Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="rounded-xl border-gray-300"
                  >
                    Clear Search
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;