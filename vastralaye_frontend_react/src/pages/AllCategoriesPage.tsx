import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listCategories, listSubcategories, listProducts } from '@/api/apihelper';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Search,
} from 'lucide-react';
import { BASE_IMG } from '@/config';
import PageBanner from '@/components/PageBanner';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Get products count for a specific category - UPDATED WITH BETTER DEBUGGING
  const getProductsCount = (categoryId: string) => {
    // Get all subcategories for this category
    const categorySubcategories = subcategories.filter((sub: any) => {
      // Try different possible field names for category relationship
      return sub.category_id === categoryId ||
             sub.categoryId === categoryId ||
             sub.category === categoryId;
    });

    const subcategoryIds = categorySubcategories.map((sub: any) => sub.id);

    // Count products that belong to these subcategories
    const productsCount = products.filter((product: any) => {
      // Try different possible field names for subcategory relationship
      const productSubcategoryId = product.subcategory_id ||
                                   product.subcategoryId ||
                                   product.subcategory ||
                                   product.sub_category_id ||
                                   product.subCategoryId;

      return subcategoryIds.includes(productSubcategoryId);
    }).length;

    return productsCount;
  };

  // Get subcategories count for a specific category
  const getSubcategoryCount = (categoryId: string) => {
    return subcategories.filter((sub: any) => {
      return sub.category_id === categoryId ||
             sub.categoryId === categoryId ||
             sub.category === categoryId;
    }).length;
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories, subcategories, and products
      const [categoriesResponse, subcategoriesResponse, productsResponse] = await Promise.all([
        listCategories(),
        listSubcategories(),
        listProducts()
      ]);

      const categoriesArray = Array.isArray(categoriesResponse) ? categoriesResponse : [];
      const subcategoriesArray = Array.isArray(subcategoriesResponse) ? subcategoriesResponse : [];
      const productsArray = Array.isArray(productsResponse) ? productsResponse : [];

      console.log('=== DATA STRUCTURE DEBUG ===');
      console.log('Categories:', categoriesArray);
      console.log('Categories sample:', categoriesArray[0]);
      console.log('Subcategories:', subcategoriesArray);
      console.log('Subcategories sample:', subcategoriesArray[0]);
      console.log('Products:', productsArray);
      console.log('Products sample:', productsArray[0]);
      console.log('===========================');

      // Log field names to help debug
      if (subcategoriesArray.length > 0) {
        console.log('Subcategory fields:', Object.keys(subcategoriesArray[0]));
      }
      if (productsArray.length > 0) {
        console.log('Product fields:', Object.keys(productsArray[0]));
      }

      setCategories(categoriesArray);
      setSubcategories(subcategoriesArray);
      setProducts(productsArray);
      setFilteredCategories(categoriesArray);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter and sort categories
  useEffect(() => {
    let result = [...categories];

    // Filter by search term
    if (searchTerm) {
      result = result.filter((category: any) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort categories
    switch(sortBy) {
      case 'a-z':
        result.sort((a: any, b: any) => a.name.localeCompare(b.name));
        break;
      case 'z-a':
        result.sort((a: any, b: any) => b.name.localeCompare(a.name));
        break;
      case 'popular':
        result.sort((a: any, b: any) => {
          const aIndex = categories.findIndex((cat: any) => cat.id === a.id);
          const bIndex = categories.findIndex((cat: any) => cat.id === b.id);
          return (aIndex < 3 ? -1 : 0) - (bIndex < 3 ? -1 : 0);
        });
        break;
      case 'most-items':
        result.sort((a: any, b: any) => {
          const aCount = getProductsCount(a.id);
          const bCount = getProductsCount(b.id);
          return bCount - aCount;
        });
        break;
    }

    setFilteredCategories(result);
    setCurrentPage(1);
  }, [searchTerm, sortBy, categories, subcategories, products]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Calculate total products
  const totalProducts = products.length;

  /** Normalize category image path (same pattern as CategorySection §5.4). */
  const imageUrl = (cat: any): string => {
    const raw = cat.image || cat.image_url || cat.img || '';
    if (!raw) return '/no-image.png';
    if (/^https?:\/\//i.test(raw)) return raw;
    let s = String(raw).trim();
    if (!s.startsWith('/')) s = `/${s}`;
    if (!s.startsWith('/static/')) s = `/static${s}`;
    return `${(BASE_IMG || '').replace(/\/$/, '')}${s}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin-driven banner (Admin → Banner Control) */}
      <PageBanner
        title="All Categories"
        subtitle={`Every weave, every occasion · ${filteredCategories.length} categories · ${totalProducts} products`}
        crumb="Categories"
      />

      <div className="container mx-auto px-4 pt-8 pb-16 lg:pb-20">

        {/* Toolbar: search left, sort right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-border py-3 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-border rounded-sm
                         text-espresso placeholder:text-muted-foreground
                         focus:outline-none focus:border-maroon transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-espresso transition-colors"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
            Sort by:
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-espresso font-medium uppercase tracking-[0.06em]
                         focus:outline-none cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="a-z">A to Z</option>
              <option value="z-a">Z to A</option>
              <option value="most-items">Most Products</option>
            </select>
          </label>
        </div>

        {/* Loading Skeleton — arch shaped */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="aspect-[3/4] w-full rounded-t-[999px] bg-sand" />
                <Skeleton className="h-5 w-24 mx-auto mt-4 bg-sand" />
                <Skeleton className="h-3 w-16 mx-auto mt-2 bg-sand" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-md mx-auto text-center border border-border rounded-sm bg-white p-8 my-10">
            <h3 className="font-serif text-xl font-medium text-espresso mb-2">
              Unable to Load Categories
            </h3>
            <p className="text-sm text-muted-foreground mb-5">{error}</p>
            <button
              type="button"
              onClick={fetchCategories}
              className="inline-flex items-center gap-2 bg-maroon text-ivory text-xs font-semibold
                         uppercase tracking-[0.16em] px-6 py-3 rounded-sm hover:bg-terracotta transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCategories.length === 0 && (
          <div className="text-center py-20">
            <p className="overline-label mb-3">Nothing here yet</p>
            <h3 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-3">
              No Categories Found
            </h3>
            <p className="text-sm text-muted-foreground mb-8">
              {searchTerm ? `No categories matching "${searchTerm}"` : 'No categories available'}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em]
                           px-8 py-3.5 rounded-sm hover:bg-terracotta transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Category Grid — arch (mehrab) cards per §5.4 */}
        {!loading && !error && filteredCategories.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 mb-12">
              {currentCategories.map((category: any) => {
                const productsCount = getProductsCount(category.id);

                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className="group text-center"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] bg-sand">
                      <img
                        src={imageUrl(category)}
                        alt={category.name}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/no-image.png';
                        }}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        className="absolute inset-[7px] rounded-t-[999px] border border-gold/0 group-hover:border-gold/60 transition-colors duration-300 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-serif text-base md:text-lg font-medium text-espresso mt-4">
                      {category.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {productsCount} products
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] uppercase tracking-[0.12em] text-terracotta opacity-80 group-hover:opacity-100">
                      Shop now <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Page Info */}
                  <p className="text-sm text-muted-foreground">
                    Showing{' '}
                    <span className="text-espresso font-medium">
                      {startIndex + 1}–{Math.min(endIndex, filteredCategories.length)}
                    </span>{' '}
                    of <span className="text-espresso font-medium">{filteredCategories.length}</span> categories
                  </p>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* First Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      aria-label="First page"
                      className="inline-flex items-center justify-center w-9 h-9 border border-border
                                 rounded-sm bg-white text-espresso hover:border-espresso transition-colors
                                 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>

                    {/* Previous Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="inline-flex items-center justify-center w-9 h-9 border border-border
                                 rounded-sm bg-white text-espresso hover:border-espresso transition-colors
                                 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        disabled={typeof page !== 'number'}
                        className={`inline-flex items-center justify-center w-9 h-9 text-sm rounded-sm border transition-colors ${
                          page === currentPage
                            ? 'bg-maroon text-ivory border-maroon'
                            : 'bg-white text-espresso border-border hover:border-espresso'
                        } ${typeof page !== 'number' ? 'pointer-events-none border-transparent bg-transparent text-muted-foreground' : ''}`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="inline-flex items-center justify-center w-9 h-9 border border-border
                                 rounded-sm bg-white text-espresso hover:border-espresso transition-colors
                                 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Last Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      aria-label="Last page"
                      className="inline-flex items-center justify-center w-9 h-9 border border-border
                                 rounded-sm bg-white text-espresso hover:border-espresso transition-colors
                                 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Items Per Page Selector */}
                  <label className="flex items-center gap-2 text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
                    Show:
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-espresso font-medium uppercase tracking-[0.06em]
                                 focus:outline-none cursor-pointer"
                    >
                      <option value={8}>8 per page</option>
                      <option value={12}>12 per page</option>
                      <option value={16}>16 per page</option>
                      <option value={24}>24 per page</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="mt-16 bg-blush border border-border rounded-sm text-center px-6 py-12 md:py-16">
              <p className="overline-label mb-2">Keep Exploring</p>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-3">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
                Browse all products or contact our team for personalised recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 bg-maroon text-ivory text-xs
                             font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm
                             hover:bg-terracotta transition-colors"
                >
                  View All Products <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center border border-espresso text-espresso
                             text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm
                             hover:bg-espresso hover:text-ivory transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
