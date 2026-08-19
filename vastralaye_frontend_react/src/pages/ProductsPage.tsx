import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import ProductGrid from "@/components/ProductGrid";
import FilterSidebar from "@/components/FilterSidebar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, ChevronLeft, ChevronRight, Grid, List, X, RefreshCw } from "lucide-react";
import PageBanner from "@/components/PageBanner";
import axios from "axios";
import { BASE_URL, BOOT_TIMEOUT_MS } from "@/config";
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

/** Neutral filter state — mirrors FilterSidebar's defaults (key order matters for
 *  the JSON.stringify fetch guard, so keep it identical to the sidebar's). */
const DEFAULT_FILTERS: Filters = {
  category_id:    null,
  subcategory_id: null,
  min_price:      0,
  max_price:      5000,
  in_stock:       null,
  featured:       null,
  best_seller:    null,
  new_arrival:    null,
};

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
          // The visitor is staring at the grid spinner while this runs — if
          // the server hangs, fail fast into the error state instead.
          timeout: BOOT_TIMEOUT_MS,
        });

        const data: Product[] = (res.data as Product[]) || [];

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
    setFilters({ ...DEFAULT_FILTERS });
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Remove a single active filter chip (also syncs the sidebar via its `value` prop)
  const removeChip = (key: string) => {
    if (key === "search") {
      setSearchQuery("");
      setDebouncedSearch("");
      setCurrentPage(1);
      return;
    }
    setFilters((prev) => {
      if (key === "priceRange") {
        return { ...prev, min_price: 0, max_price: 5000 };
      }
      return { ...prev, [key]: null } as Filters;
    });
    setCurrentPage(1);
  };

  // Resolve display names for category/subcategory chips from loaded products
  const resolveCategoryName = (id: number): string => {
    for (const p of allProducts) {
      const pa = p as any;
      const pid =
        pa.category_id ??
        pa.categoryId ??
        (typeof pa.category === "object" ? pa.category?.id : pa.category);
      if (pid !== null && pid !== undefined && String(pid) === String(id)) {
        const name =
          pa.category_name ??
          pa.categoryName ??
          (typeof pa.category === "object" ? pa.category?.name : undefined);
        if (name) return String(name);
      }
    }
    return "Category";
  };

  const resolveSubcategoryName = (id: number): string => {
    for (const p of allProducts) {
      const pa = p as any;
      const pid =
        pa.subcategory_id ??
        pa.sub_category_id ??
        pa.subcategoryId ??
        (typeof pa.subcategory === "object" ? pa.subcategory?.id : pa.subcategory) ??
        (typeof pa.sub_category === "object" ? pa.sub_category?.id : undefined);
      if (pid !== null && pid !== undefined && String(pid) === String(id)) {
        const name =
          pa.subcategory_name ??
          pa.sub_category_name ??
          (typeof pa.subcategory === "object" ? pa.subcategory?.name : undefined) ??
          (typeof pa.sub_category === "object" ? pa.sub_category?.name : undefined);
        if (name) return String(name);
      }
    }
    return "Collection";
  };

  // Active filter chips (search + every non-default filter)
  const minPriceActive = filters.min_price ?? 0;
  const maxPriceActive = filters.max_price ?? 5000;
  const priceActive = minPriceActive > 0 || maxPriceActive < 5000;
  const priceLabel =
    minPriceActive > 0 && maxPriceActive < 5000
      ? `₹${minPriceActive}–₹${maxPriceActive}`
      : maxPriceActive < 5000
      ? `Under ₹${maxPriceActive}`
      : `₹${minPriceActive}+`;

  const activeChips: { key: string; label: string }[] = [];
  if (debouncedSearch.trim()) {
    activeChips.push({ key: "search", label: `“${debouncedSearch.trim()}”` });
  }
  if (filters.category_id !== null && filters.category_id !== undefined) {
    activeChips.push({ key: "category_id", label: resolveCategoryName(filters.category_id) });
  }
  if (filters.subcategory_id !== null && filters.subcategory_id !== undefined) {
    activeChips.push({ key: "subcategory_id", label: resolveSubcategoryName(filters.subcategory_id) });
  }
  if (priceActive) activeChips.push({ key: "priceRange", label: priceLabel });
  if (filters.in_stock)    activeChips.push({ key: "in_stock",    label: "In stock" });
  if (filters.featured)    activeChips.push({ key: "featured",    label: "Featured" });
  if (filters.best_seller) activeChips.push({ key: "best_seller", label: "Bestsellers" });
  if (filters.new_arrival) activeChips.push({ key: "new_arrival", label: "New arrivals" });

  // Mobile Filter-trigger badge counts filter chips (search shows as its own chip)
  const activeFilterCount = activeChips.filter((c) => c.key !== "search").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin-driven banner (Admin → Banner Control) */}
      <PageBanner
        title="All Products"
        subtitle={`Browse our complete catalogue · ${allProducts.length} products`}
        crumb="Shop"
        page="products"
      />

      <div className="container mx-auto px-4 pt-8 pb-16 lg:pb-20">

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-5 bg-white border border-border border-l-2 border-l-sale rounded-sm">
            <h3 className="font-serif text-lg font-medium text-espresso mb-1">
              Unable to Load Products
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 border border-espresso text-espresso
                           text-xs font-semibold uppercase tracking-[0.14em] px-5 py-2.5
                           rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs uppercase tracking-[0.14em] text-muted-foreground
                           underline underline-offset-4 hover:text-espresso transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Filter Sidebar */}
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            products={allProducts || []}
            onFilterChange={handleFilterChange}
            value={filters}
            className="lg:w-64 lg:flex-shrink-0"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search — mobile only (desktop search lives in the toolbar) */}
            <form onSubmit={handleSearch} className="relative mb-4 md:hidden">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-11 rounded-sm border-border bg-white text-sm
                           placeholder:text-muted-foreground focus-visible:ring-1
                           focus-visible:ring-maroon focus-visible:ring-offset-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-espresso transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            {/* Toolbar — count left, sort/controls right; compact Filter/Sort bar on mobile */}
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
                {activeFilterCount > 0 && (
                  <span className="bg-maroon text-ivory text-[10px] leading-none rounded-full
                                   min-w-[16px] h-4 px-1 inline-flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Desktop: result count */}
              {showResultsInfo && (
                <p className="hidden lg:block text-sm text-muted-foreground truncate">
                  {allProducts.length > 0 ? (
                    <>
                      Showing{" "}
                      <span className="text-espresso font-medium">
                        {(currentPage - 1) * productsPerPage + 1}–
                        {Math.min(currentPage * productsPerPage, allProducts.length)}
                      </span>{" "}
                      of <span className="text-espresso font-medium">{allProducts.length}</span> products
                    </>
                  ) : (
                    <>0 products</>
                  )}
                </p>
              )}

              <div className="flex items-center gap-4 shrink-0">
                {/* Search — compact, in-toolbar (≥md) */}
                <form
                  onSubmit={handleSearch}
                  className="hidden md:flex h-10 w-[240px] lg:w-[280px] items-center rounded-sm
                             border border-border bg-white px-3 transition-colors
                             focus-within:border-maroon"
                >
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-full w-full rounded-none border-0 bg-transparent px-2 py-0
                               text-[13px] shadow-none placeholder:text-muted-foreground
                               focus-visible:ring-0 focus-visible:ring-offset-0 md:text-[13px]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="shrink-0 text-muted-foreground hover:text-espresso transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </form>

                {/* Per page */}
                <Select
                  value={productsPerPage.toString()}
                  onValueChange={handlePerPageChange}
                >
                  <SelectTrigger
                    className="hidden xl:flex h-auto w-auto gap-1.5 border-0 bg-transparent px-0 py-1
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
                  <SelectTrigger
                    className="h-auto w-auto gap-1.5 border-0 bg-transparent px-0 py-1
                               text-[13px] uppercase tracking-[0.06em] text-muted-foreground
                               hover:text-espresso focus:ring-0 focus:ring-offset-0 rounded-none"
                  >
                    <span className="hidden sm:inline lg:hidden xl:inline">Sort by:&nbsp;</span>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent align="end" className="rounded-sm border-border bg-white shadow-md">
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                    <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center border border-border rounded-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    className={`inline-flex items-center justify-center w-8 h-8 transition-colors ${
                      viewMode === "grid"
                        ? "bg-espresso text-ivory"
                        : "bg-white text-muted-foreground hover:text-espresso"
                    }`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    className={`inline-flex items-center justify-center w-8 h-8 border-l border-border transition-colors ${
                      viewMode === "list"
                        ? "bg-espresso text-ivory"
                        : "bg-white text-muted-foreground hover:text-espresso"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 mb-6 -mt-3">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => removeChip(chip.key)}
                    aria-label={`Remove filter: ${chip.label}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border
                               bg-blush px-3 py-1.5 text-[12px] text-espresso
                               hover:border-maroon transition-colors"
                  >
                    {chip.label}
                    <X className="h-3 w-3 text-maroon" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11.5px] text-muted-foreground underline underline-offset-[3px]
                             hover:text-espresso transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-10 h-10 border-2 border-sand border-t-gold rounded-full animate-spin" />
                <p className="mt-5 text-sm text-muted-foreground">Loading products…</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <h3 className="font-serif text-2xl font-medium text-espresso mb-2">
                  Unable to load products
                </h3>
                <p className="text-sm text-muted-foreground">Please try again in a moment.</p>
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                {/* Product Grid */}
                <ProductGrid
                  products={displayProducts}
                  title=""
                  viewMode={viewMode}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-14 pt-8 border-t border-border">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Page Info */}
                      <div className="text-sm text-muted-foreground">
                        Page <span className="text-espresso font-medium">{currentPage}</span> of{" "}
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
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)
                            .map((page) => (
                              <button
                                key={page}
                                type="button"
                                onClick={() => handlePageClick(page)}
                                className={`w-9 h-9 text-sm rounded-sm border transition-colors ${
                                  currentPage === page
                                    ? "bg-maroon text-ivory border-maroon"
                                    : "bg-white text-espresso border-border hover:border-espresso"
                                }`}
                              >
                                {page}
                              </button>
                            ))}
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
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em]
                               px-8 py-3.5 rounded-sm hover:bg-terracotta transition-colors"
                  >
                    Clear All Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="border border-espresso text-espresso text-xs font-semibold uppercase
                               tracking-[0.16em] px-8 py-3.5 rounded-sm hover:bg-espresso
                               hover:text-ivory transition-colors"
                  >
                    Clear Search
                  </button>
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
