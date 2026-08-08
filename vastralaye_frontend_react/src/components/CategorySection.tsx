import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listCategories, listSubcategories, listProducts } from '../api/apihelper';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { BASE_IMG } from '@/config';

/**
 * Shop by Category — arch (mehrab) cards per design.md §5.4.
 * Data fetching preserved from the previous implementation.
 */
const CategorySection = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesResponse, subcategoriesResponse, productsResponse] = await Promise.all([
        listCategories(),
        listSubcategories(),
        listProducts(),
      ]);

      const categoriesArray = Array.isArray(categoriesResponse) ? categoriesResponse : [];
      const subcategoriesArray = Array.isArray(subcategoriesResponse) ? subcategoriesResponse : [];
      const productsArray = Array.isArray(productsResponse) ? productsResponse : [];

      const categoriesWithCounts = categoriesArray.map((category: any) => {
        const categorySubcategories = subcategoriesArray.filter(
          (sub: any) => sub.category_id === category.id
        );
        const subcategoryIds = categorySubcategories.map((sub: any) => sub.id);
        const productsCount = productsArray.filter(
          (product: any) =>
            subcategoryIds.includes(product.subcategory_id) ||
            subcategoryIds.includes(product.sub_id) ||
            product.category_id === category.id
        ).length;

        return { ...category, subcategories: categorySubcategories, productsCount };
      });

      setCategories(categoriesWithCounts);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.detail || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        {/* Section head */}
        <div className="text-center mb-10 md:mb-12">
          <span className="overline-label mb-2">Explore</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso">Shop by Category</h2>
          <svg
            className="mx-auto mt-4"
            width="130"
            height="14"
            viewBox="0 0 130 14"
            aria-hidden="true"
          >
            <g fill="none" stroke="#C99A45">
              <line x1="0" y1="7" x2="50" y2="7" />
              <line x1="80" y1="7" x2="130" y2="7" />
              <rect x="60.5" y="2.5" width="9" height="9" transform="rotate(45 65 7)" />
            </g>
            <circle cx="65" cy="7" r="1.5" fill="#C99A45" />
          </svg>
        </div>

        {/* Loading skeletons (arch shaped) */}
        {loading && (
          <div className="flex gap-4 overflow-hidden md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[44%] md:min-w-0 text-center">
                <Skeleton className="aspect-[3/4] w-full rounded-t-[999px]" />
                <Skeleton className="h-4 w-20 mx-auto mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="max-w-md mx-auto text-center border border-border rounded-sm bg-white p-8">
            <p className="text-muted-foreground mb-5">{error}</p>
            <button
              onClick={fetchCategories}
              className="inline-flex items-center gap-2 bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-sm hover:bg-terracotta transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        )}

        {/* Arch category cards */}
        {!loading && !error && categories.length > 0 && (
          <>
            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-6 md:overflow-visible snap-x">
              {categories.slice(0, 6).map((cat: any) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug || cat.id}`}
                  className="group min-w-[44%] xs:min-w-[38%] sm:min-w-[30%] md:min-w-0 text-center snap-start"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] bg-sand">
                    <img
                      src={imageUrl(cat)}
                      alt={cat.name}
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
                    {cat.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-terracotta opacity-80 group-hover:opacity-100">
                    Shop now <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-terracotta border-b border-terracotta pb-1 hover:text-maroon hover:border-maroon transition-colors"
              >
                View all categories <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && categories.length === 0 && (
          <p className="text-center text-muted-foreground">Categories are on their way — check back soon.</p>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
