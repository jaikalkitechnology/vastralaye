import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listCategories, listSubcategories, listProducts } from '../api/apihelper';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { 
  RefreshCw, 
  ShoppingBag, 
  ArrowLeft, 
  ArrowRight,
  Star,
  ChevronRight,
  Sparkles,
  // Category Icons
  Shirt,
  Briefcase,
  Trophy,
  Snowflake,
  Watch,
  Footprints,
  Baby,
  User,
  Users,
  Heart,
  Zap,
  Tag,
  Grid3x3,
  Award,
  Package
} from 'lucide-react';

const CategorySection = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [categoriesResponse, subcategoriesResponse, productsResponse] = await Promise.all([
        listCategories(),
        listSubcategories(),
        listProducts()
      ]);
      
      const categoriesArray = Array.isArray(categoriesResponse) ? categoriesResponse : [];
      const subcategoriesArray = Array.isArray(subcategoriesResponse) ? subcategoriesResponse : [];
      const productsArray = Array.isArray(productsResponse) ? productsResponse : [];
      
      // Map products count to categories
      const categoriesWithCounts = categoriesArray.map(category => {
        // Get subcategories for this category
        const categorySubcategories = subcategoriesArray.filter(
          (sub: any) => sub.category_id === category.id
        );
        
        const subcategoryIds = categorySubcategories.map((sub: any) => sub.id);
        
        // Count products that belong to these subcategories
        const productsCount = productsArray.filter((product: any) => 
          subcategoryIds.includes(product.subcategory_id) ||
          subcategoryIds.includes(product.sub_id) ||
          product.category_id === category.id
        ).length;
        
        return {
          ...category,
          subcategories: categorySubcategories,
          productsCount: productsCount
        };
      });
      
      // console.log('Categories with counts:', categoriesWithCounts);
      
      setCategories(categoriesWithCounts);
      setSubcategories(subcategoriesArray);
      setProducts(productsArray);
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

  // Get icon and color based on category slug
  const getCategoryIcon = (slug: string) => {
    const iconMap: Record<string, any> = {
      'men': { 
        Icon: Users, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/10 to-[#559F4B]/5',
        borderColor: 'border-[#559F4B]/20',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#559F4B]/90',
        ringColor: 'ring-[#559F4B]/20',
        countColor: 'bg-[#559F4B]/10 text-[#559F4B]'
      },
      'women': { 
        Icon: User, 
        color: 'text-[#E1783E]',
        bgColor: 'bg-gradient-to-br from-[#E1783E]/10 to-[#E1783E]/5',
        borderColor: 'border-[#E1783E]/20',
        gradient: 'from-[#E1783E] via-[#E1783E] to-[#E1783E]/90',
        ringColor: 'ring-[#E1783E]/20',
        countColor: 'bg-[#E1783E]/10 text-[#E1783E]'
      },
      'kids': { 
        Icon: Baby, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/10 to-[#559F4B]/5',
        borderColor: 'border-[#559F4B]/20',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#E1783E]',
        ringColor: 'ring-[#559F4B]/20',
        countColor: 'bg-gradient-to-r from-[#559F4B]/10 to-[#E1783E]/10 text-[#559F4B]'
      },
      'footwear': { 
        Icon: Footprints, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/10 to-[#559F4B]/5',
        borderColor: 'border-[#559F4B]/20',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#E1783E]',
        ringColor: 'ring-[#559F4B]/20',
        countColor: 'bg-[#559F4B]/10 text-[#559F4B]'
      },
      'accessories': { 
        Icon: Watch, 
        color: 'text-[#E1783E]',
        bgColor: 'bg-gradient-to-br from-[#E1783E]/10 to-[#E1783E]/5',
        borderColor: 'border-[#E1783E]/20',
        gradient: 'from-[#E1783E] via-[#E1783E] to-[#E1783E]/90',
        ringColor: 'ring-[#E1783E]/20',
        countColor: 'bg-[#E1783E]/10 text-[#E1783E]'
      },
      'winter-wear': { 
        Icon: Snowflake, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/10 to-[#559F4B]/5',
        borderColor: 'border-[#559F4B]/20',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#559F4B]/90',
        ringColor: 'ring-[#559F4B]/20',
        countColor: 'bg-[#559F4B]/10 text-[#559F4B]'
      },
      'ethnic': { 
        Icon: Sparkles, 
        color: 'text-[#E1783E]',
        bgColor: 'bg-gradient-to-br from-[#E1783E]/10 to-[#E1783E]/5',
        borderColor: 'border-[#E1783E]/20',
        gradient: 'from-[#E1783E] via-[#E1783E] to-[#E1783E]/90',
        ringColor: 'ring-[#E1783E]/20',
        countColor: 'bg-[#E1783E]/10 text-[#E1783E]'
      },
      'sports': { 
        Icon: Trophy, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/10 to-[#559F4B]/5',
        borderColor: 'border-[#559F4B]/20',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#E1783E]',
        ringColor: 'ring-[#559F4B]/20',
        countColor: 'bg-gradient-to-r from-[#559F4B]/10 to-[#E1783E]/10 text-[#559F4B]'
      },
      'formal': { 
        Icon: Briefcase, 
        color: 'text-[#E1783E]',
        bgColor: 'bg-gradient-to-br from-[#E1783E]/10 to-[#E1783E]/5',
        borderColor: 'border-[#E1783E]/20',
        gradient: 'from-[#E1783E] via-[#E1783E] to-[#E1783E]/90',
        ringColor: 'ring-[#E1783E]/20',
        countColor: 'bg-[#E1783E]/10 text-[#E1783E]'
      },
      'casual': { 
        Icon: Shirt, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/10 to-[#559F4B]/5',
        borderColor: 'border-[#559F4B]/20',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#559F4B]/90',
        ringColor: 'ring-[#559F4B]/20',
        countColor: 'bg-[#559F4B]/10 text-[#559F4B]'
      },
    };

    return iconMap[slug] || { 
      Icon: ShoppingBag, 
      color: 'text-gray-600',
      bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
      borderColor: 'border-gray-200',
      gradient: 'from-gray-500 via-gray-600 to-gray-700',
      ringColor: 'ring-gray-500/20',
      countColor: 'bg-gray-100 text-gray-600'
    };
  };

  // Scroll functions for manual navigation
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  // ================================
  // Loading State
  // ================================
  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto hidden md:block" />
            <Skeleton className="h-5 w-80 mx-auto md:hidden" />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="relative">
                    <Skeleton className="h-40 md:h-48 w-full" />
                    <div className="absolute top-3 right-3">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="p-4 md:p-5">
                    <Skeleton className="h-6 w-3/4 mb-2 md:mb-3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ================================
  // Error State
  // ================================
  if (error) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto bg-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-red-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-3">
              Unable to Load Categories
            </h3>
            <p className="text-gray-600 text-center mb-6 md:mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={fetchCategories}
                className="flex-1 bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#E1783E] hover:to-[#559F4B] text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button 
                asChild 
                variant="outline"
                className="flex-1 border-gray-300"
              >
                <Link to="/">
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ================================
  // Empty State
  // ================================
  if (categories.length === 0) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto bg-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-3">
              No Categories Available
            </h3>
            <p className="text-gray-600 text-center mb-2">
              Check back later for new collections
            </p>
            <p className="text-sm text-gray-500 text-center">
              We're working on adding exciting categories for you
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#559F4B]/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[#E1783E]/10 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold mb-4 md:mb-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Tag className="w-3.5 h-3.5 md:w-4 md:h-4" fill="white" />
            Trendy Collections
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-5">
            Shop by <span className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] bg-clip-text text-transparent">Category</span>
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Explore our handpicked categories featuring the latest trends and timeless classics
          </p>
        </div>

        {/* Navigation Buttons for Desktop */}
        {categories.length > 4 && (
          <div className="hidden lg:flex items-center justify-between mb-6 md:mb-8">
            <Button
              onClick={scrollLeft}
              variant="outline"
              size="icon"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-200 hover:border-[#559F4B] hover:bg-[#559F4B]/10 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
      
            <Button
              onClick={scrollRight}
              variant="outline"
              size="icon"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-200 hover:border-[#E1783E] hover:bg-[#E1783E]/10 transition-all duration-300"
            >
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        )}

        {/* Categories Grid/Scroll */}
        <div className="relative">
          {categories.length <= 4 ? (
            // Grid Layout for few categories
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category) => {
                const { Icon, color, bgColor, borderColor, gradient, ringColor, countColor } = getCategoryIcon(category.slug);
                
                return (
                  <CategoryCard 
                    key={category.id}
                    category={category}
                    Icon={Icon}
                    color={color}
                    bgColor={bgColor}
                    borderColor={borderColor}
                    gradient={gradient}
                    ringColor={ringColor}
                    countColor={countColor}
                  />
                );
              })}
            </div>
          ) : (
            // Horizontal Scroll for many categories
            <>
              <div 
                ref={scrollContainerRef}
                className="flex gap-4 md:gap-6 pb-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((category) => {
                  const { Icon, color, bgColor, borderColor, gradient, ringColor, countColor } = getCategoryIcon(category.slug);
                  
                  return (
                    <div 
                      key={category.id} 
                      className="flex-shrink-0 w-[250px] xs:w-[280px] sm:w-[300px] snap-start"
                    >
                      <CategoryCard 
                        category={category}
                        Icon={Icon}
                        color={color}
                        bgColor={bgColor}
                        borderColor={borderColor}
                        gradient={gradient}
                        ringColor={ringColor}
                        countColor={countColor}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Scroll Indicator for Mobile */}
              <div className="lg:hidden mt-4 md:mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-full border border-gray-200">
                  <span className="animate-pulse">←</span>
                  Scroll to explore more
                  <span className="animate-pulse">→</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10 md:mt-14">
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#E1783E] hover:to-[#559F4B] text-white px-6 md:px-8 py-5 md:py-6 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl hover:shadow-[#559F4B]/30 transition-all duration-300 transform hover:scale-[1.02] group"
          >
            <Link to="/categories" className="flex items-center gap-2 md:gap-3">
              <Grid3x3 className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-base md:text-lg font-semibold">Browse All Categories</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Button>
          
          <p className="text-gray-500 text-xs md:text-sm mt-3 md:mt-4">
            Discover {categories.length} unique categories with {products.length}+ products
          </p>
        </div>
      </div>

      {/* Add custom scrollbar hide styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

// Separate Category Card Component for better organization
const CategoryCard = ({ category, Icon, color, bgColor, borderColor, gradient, ringColor, countColor }: any) => {
  const productsCount = category.productsCount || 0;
  const subcategoriesCount = category.subcategories?.length || 0;
  
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group block"
    >
      <Card className="border border-gray-200 hover:border-transparent bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2 relative h-full">
        {/* Gradient Overlay on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        {/* Popular Badge */}
        {category.popular && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
              <Award className="w-3 h-3" />
              <span className="hidden xs:inline">Popular</span>
            </span>
          </div>
        )}

        <CardContent className="p-4 md:p-5 lg:p-6 relative">
          {/* Icon Container */}
          <div className={`${bgColor} ${borderColor} border w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500 mx-auto`}>
            <Icon className={`w-6 h-6 md:w-7 md:h-7 lg:w-10 lg:h-10 ${color} group-hover:scale-110 transition-transform duration-500`} />
          </div>

          {/* Category Name */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3 text-center group-hover:text-[#559F4B] transition-colors duration-300 line-clamp-1">
            {category.name}
          </h3>

          {/* Products & Collection Count */}
          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            {productsCount > 0 ? (
              <div className="flex items-center gap-2">
                <span className={`${countColor} px-3 py-1 rounded-full text-xs md:text-sm font-medium flex items-center gap-1`}>
                  <Package className="w-3 h-3" />
                  {productsCount} Products
                </span>
              </div>
            ) : (
              <span className={`${countColor} px-3 py-1 rounded-full text-xs md:text-sm font-medium`}>
                {subcategoriesCount} Collections
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4 md:mb-6">
            <div className="h-1 md:h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700 group-hover:w-full`}
                style={{ 
                  width: `${Math.min((productsCount > 0 ? productsCount : subcategoriesCount) * 5, 100)}%` 
                }}
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold text-[#559F4B] group-hover:text-[#E1783E] transition-colors duration-300">
              {productsCount > 0 ? 'Shop Now' : 'Explore Category'}
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </div>

          {/* Hover Effect Border */}
          <div className={`absolute inset-0 border-2 ${borderColor} rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategorySection;