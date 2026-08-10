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
import { PAISLEY_TILE } from '@/components/decor/patterns';

/** Serif gallery numerals for the arch cards (I, II, III …). */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const romanNumeral = (n: number) => ROMAN[n] ?? String(n + 1);

const FEATURED_EYEBROWS = ['Most Loved', 'Festive Ready'];

/** Toran garland divider under the section header (new_design.md §17). */
const ToranDivider = () => (
  <svg viewBox="0 0 340 26" className="mx-auto mt-3.5 h-[26px] w-[340px] max-w-full" fill="none" stroke="#C99A45" aria-hidden="true">
    <line x1="0" y1="4" x2="340" y2="4" strokeOpacity=".6" />
    <g strokeOpacity=".8">
      <path d="M30 4l7 12 7-12" /><path d="M72 4l7 12 7-12" /><path d="M114 4l7 12 7-12" /><path d="M156 4l7 12 7-12" /><path d="M198 4l7 12 7-12" /><path d="M240 4l7 12 7-12" /><path d="M282 4l7 12 7-12" />
    </g>
    <g fill="#B85C38" stroke="none">
      <circle cx="37" cy="19" r="1.7" /><circle cx="79" cy="19" r="1.7" /><circle cx="121" cy="19" r="1.7" /><circle cx="163" cy="19" r="1.7" /><circle cx="205" cy="19" r="1.7" /><circle cx="247" cy="19" r="1.7" /><circle cx="289" cy="19" r="1.7" />
    </g>
    <rect x="166.5" y="0.5" width="7" height="7" transform="rotate(45 170 4)" fill="#FAF6F0" />
  </svg>
);

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

  // Featured duo — the two largest categories, pinned above the arch
  // gallery (hidden while searching so results aren't split).
  const featured: any[] =
    !searchTerm && filteredCategories.length > 2
      ? [...filteredCategories]
          .sort((a: any, b: any) => getProductsCount(b.id) - getProductsCount(a.id))
          .slice(0, 2)
      : [];
  const archSource = featured.length
    ? filteredCategories.filter((c: any) => !featured.some((f: any) => f.id === c.id))
    : filteredCategories;

  // Calculate pagination (over the arch gallery, featured stay pinned)
  const totalPages = Math.ceil(archSource.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = archSource.slice(startIndex, endIndex);

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
        page="categories"
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

        {/* Category showcase */}
        {!loading && !error && filteredCategories.length > 0 && (
          <>
            {/* Featured duo — image banners with gradient, paisley & count chip */}
            {featured.length === 2 && (
              <div className="grid gap-5 md:grid-cols-2 mb-14">
                {featured.map((cat: any, i: number) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="group relative block aspect-[16/8.5] sm:aspect-[16/7.5] overflow-hidden rounded-sm bg-sand"
                  >
                    <img
                      src={imageUrl(cat)}
                      alt={cat.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/no-image.png';
                      }}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/45 to-espresso/5" />
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1/2 opacity-10"
                      style={{ backgroundImage: PAISLEY_TILE, backgroundSize: '120px 120px' }}
                    />
                    <span aria-hidden className="absolute inset-2 rounded-[2px] border border-gold/55 pointer-events-none" />
                    <span className="absolute right-4 top-3.5 rounded-full border border-gold/60 bg-espresso/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                      {getProductsCount(cat.id)} pieces
                    </span>
                    <span className="absolute left-6 md:left-7 top-1/2 max-w-[68%] -translate-y-1/2 text-ivory">
                      <span className="block text-[9.5px] font-semibold uppercase tracking-[0.24em] text-gold">
                        {FEATURED_EYEBROWS[i]}
                      </span>
                      <span className="mt-1 block font-serif text-2xl md:text-[28px] font-medium leading-tight">
                        {cat.name}
                      </span>
                      <span className="mt-1 block text-xs text-ivory/75">
                        {getSubcategoryCount(cat.id)} collections · {getProductsCount(cat.id)} products
                      </span>
                      <span className="mt-3.5 inline-flex items-center gap-2 rounded-[2px] border border-gold/70 bg-gold/10 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-colors group-hover:bg-gold/20">
                        Explore {cat.name} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Section header with toran garland */}
            <div className="text-center mb-9">
              <p className="overline-label mb-2">Browse the Loom</p>
              <h2 className="font-serif text-3xl font-medium text-espresso">Shop by Category</h2>
              <ToranDivider />
            </div>

            {/* Jharokha arch gallery — staggered, numbered */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 mb-12 items-start">
              {currentCategories.map((category: any, idx: number) => {
                const productsCount = getProductsCount(category.id);

                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className={`group text-center ${idx % 2 === 1 ? 'sm:mt-7' : ''}`}
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
                        className="absolute inset-2 rounded-t-[999px] border border-gold/0 group-hover:border-gold/70 transition-colors duration-300 pointer-events-none"
                        aria-hidden="true"
                      />
                      {/* Espresso veil with Explore on hover */}
                      <span className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-espresso/75 to-transparent pb-3.5 pt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        Explore →
                      </span>
                    </div>
                    <p className="mt-3.5 font-serif text-[13px] tracking-[0.14em] text-gold">
                      {romanNumeral(startIndex + idx)}
                    </p>
                    <h3 className="font-serif text-base md:text-lg font-medium text-espresso mt-0.5 transition-colors group-hover:text-maroon">
                      {category.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {productsCount} products
                    </p>
                    <span
                      aria-hidden
                      className="mx-auto mt-2.5 block h-px w-9 bg-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
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
                      {startIndex + 1}–{Math.min(endIndex, archSource.length)}
                    </span>{' '}
                    of <span className="text-espresso font-medium">{archSource.length}</span> categories
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
                            ? 'bg-espresso text-ivory border-espresso'
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

            {/* Bottom CTA — espresso strip with paisley & gold frame */}
            <div className="relative mt-16 overflow-hidden rounded-sm bg-espresso text-ivory">
              <span
                aria-hidden
                className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: PAISLEY_TILE, backgroundSize: '130px 130px' }}
              />
              <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[2px] border border-gold/35" />
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-9 md:px-10 text-center md:text-left">
                <div>
                  <h2 className="font-serif text-[23px] font-medium">Can't find your weave?</h2>
                  <p className="mt-1 text-[13px] text-ivory/65">
                    Browse the full catalogue — every piece, every craft, in one place.
                  </p>
                </div>
                <Link
                  to="/products"
                  className="shrink-0 rounded-sm border border-gold px-7 py-3.5 text-[11px] font-semibold
                             uppercase tracking-[0.16em] text-gold transition-colors
                             hover:bg-gold hover:text-espresso"
                >
                  Browse All Products
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
