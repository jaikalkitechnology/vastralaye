import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listCategories, listSubcategories, listProducts } from '@/api/apihelper';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  RefreshCw, 
  ShoppingBag, 
  ArrowRight, 
  Star,
  Grid3x3,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Search,
  Filter,
  Tag,
  Percent,
  Award,
  TrendingUp,
  Zap,
  // Category Icons
  Shirt,
  Briefcase,
  Trophy,
  Sparkles,
  Snowflake,
  Watch,
  Footprints,
  Baby,
  User,
  Users,
  Flame,
  Package
} from 'lucide-react';

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

  // Get icon and color based on category slug
  const getCategoryIcon = (slug: string) => {
    const iconMap = {
      'men': { 
        Icon: Users, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/20 to-[#559F4B]/10',
        borderColor: 'border-[#559F4B]/30',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#559F4B]/90',
        accentColor: 'bg-[#559F4B]'
      },
      'women': { 
        Icon: User, 
        color: 'text-[#E1783E]',
        bgColor: 'bg-gradient-to-br from-[#E1783E]/20 to-[#E1783E]/10',
        borderColor: 'border-[#E1783E]/30',
        gradient: 'from-[#E1783E] via-[#E1783E] to-[#E1783E]/90',
        accentColor: 'bg-[#E1783E]'
      },
      'kids': { 
        Icon: Baby, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/20 to-[#559F4B]/10',
        borderColor: 'border-[#559F4B]/30',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#E1783E]',
        accentColor: 'bg-gradient-to-r from-[#559F4B] to-[#E1783E]'
      },
      'footwear': { 
        Icon: Footprints, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/20 to-[#559F4B]/10',
        borderColor: 'border-[#559F4B]/30',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#559F4B]/90',
        accentColor: 'bg-[#559F4B]'
      },
      'accessories': { 
        Icon: Watch, 
        color: 'text-[#E1783E]',
        bgColor: 'bg-gradient-to-br from-[#E1783E]/20 to-[#E1783E]/10',
        borderColor: 'border-[#E1783E]/30',
        gradient: 'from-[#E1783E] via-[#E1783E] to-[#E1783E]/90',
        accentColor: 'bg-[#E1783E]'
      },
      'winter-wear': { 
        Icon: Snowflake, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/20 to-[#559F4B]/10',
        borderColor: 'border-[#559F4B]/30',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#559F4B]/90',
        accentColor: 'bg-[#559F4B]'
      },
      'ethnic': { 
        Icon: Sparkles, 
        color: 'text-[#E1783E]',
        bgColor: 'bg-gradient-to-br from-[#E1783E]/20 to-[#E1783E]/10',
        borderColor: 'border-[#E1783E]/30',
        gradient: 'from-[#E1783E] via-[#E1783E] to-[#E1783E]/90',
        accentColor: 'bg-[#E1783E]'
      },
      'sports': { 
        Icon: Trophy, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/20 to-[#559F4B]/10',
        borderColor: 'border-[#559F4B]/30',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#E1783E]',
        accentColor: 'bg-gradient-to-r from-[#559F4B] to-[#E1783E]'
      },
      'formal': { 
        Icon: Briefcase, 
        color: 'text-[#E1783E]',
        bgColor: 'bg-gradient-to-br from-[#E1783E]/20 to-[#E1783E]/10',
        borderColor: 'border-[#E1783E]/30',
        gradient: 'from-[#E1783E] via-[#E1783E] to-[#E1783E]/90',
        accentColor: 'bg-[#E1783E]'
      },
      'casual': { 
        Icon: Shirt, 
        color: 'text-[#559F4B]',
        bgColor: 'bg-gradient-to-br from-[#559F4B]/20 to-[#559F4B]/10',
        borderColor: 'border-[#559F4B]/30',
        gradient: 'from-[#559F4B] via-[#559F4B] to-[#559F4B]/90',
        accentColor: 'bg-[#559F4B]'
      },
    };

    return iconMap[slug] || { 
      Icon: ShoppingBag, 
      color: 'text-gray-600',
      bgColor: 'bg-gradient-to-br from-gray-100 to-gray-200',
      borderColor: 'border-gray-200',
      gradient: 'from-gray-500 via-gray-600 to-gray-700',
      accentColor: 'bg-gray-500'
    };
  };

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

  return (
    <section className="min-h-screen py-8 md:py-12 lg:py-16 bg-gradient-to-br from-white via-gray-50/50 to-white relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#559F4B]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[#E1783E]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-r from-[#559F4B]/5 to-[#E1783E]/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm font-bold mb-4 md:mb-5 shadow-lg">
            <Tag className="w-3.5 h-3.5 md:w-4 md:h-4" fill="white" />
            Browse All Categories
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
            Explore Our <span className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] bg-clip-text text-transparent">Categories</span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our complete collection across all categories. Find exactly what you're looking for.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-8 md:pr-10 py-2.5 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-[#559F4B] focus:ring-2 focus:ring-[#559F4B]/20 focus:outline-none transition-all duration-300"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1 md:gap-2">
                <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                <span className="text-xs md:text-sm font-medium text-gray-700">Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-2 border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:border-[#559F4B] focus:outline-none transition-all duration-300 text-sm md:text-base"
              >
                <option value="popular">Most Popular</option>
                <option value="a-z">A to Z</option>
                <option value="z-a">Z to A</option>
                <option value="most-items">Most Products</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {!loading && !error && categories.length > 0 && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-8 md:mb-12 border border-gray-100">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-gradient-to-r from-[#559F4B] to-[#559F4B]/80 rounded-full p-2 md:p-3">
                  <Grid3x3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{filteredCategories.length}</p>
                  <p className="text-xs md:text-sm text-gray-600">Total Categories</p>
                </div>
              </div>
              <div className="hidden sm:block h-8 md:h-12 w-px bg-gray-200" />
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-gradient-to-r from-[#E1783E] to-[#E1783E]/80 rounded-full p-2 md:p-3">
                  <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">
                    {totalProducts}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">Total Products</p>
                </div>
              </div>
              <div className="hidden sm:block h-8 md:h-12 w-px bg-gray-200" />
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] rounded-full p-2 md:p-3">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-white" fill="white" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">Premium</p>
                  <p className="text-xs md:text-sm text-gray-600">Quality Products</p>
                </div>
              </div>


   
    
              <div className="hidden sm:block h-8 md:h-12 w-px bg-gray-200" />
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-gradient-to-r from-[#E1783E] to-[#559F4B] rounded-full p-2 md:p-3">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">
                    Page {currentPage} of {totalPages}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    Showing {Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-md md:shadow-lg animate-pulse">
                <CardContent className="p-0">
                  <div className="h-56 md:h-64 bg-gradient-to-br from-gray-200 to-gray-300" />
                  <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                    <Skeleton className="h-5 md:h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 md:py-16 lg:py-20">
            <div className="max-w-md mx-auto">
              <div className="bg-red-50 rounded-full w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 flex items-center justify-center mx-auto mb-4 md:mb-6">
                <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-red-500" />
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
                Unable to Load Categories
              </h3>
              <p className="text-gray-600 mb-4 md:mb-6">{error}</p>
              <Button 
                onClick={fetchCategories}
                className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#E1783E] hover:to-[#559F4B] text-white shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> 
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCategories.length === 0 && (
          <div className="text-center py-12 md:py-16 lg:py-20">
            <div className="bg-gray-100 rounded-full w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Search className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-gray-400" />
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
              No Categories Found
            </h3>
            <p className="text-gray-600 mb-4 md:mb-6">
              {searchTerm ? `No categories matching "${searchTerm}"` : 'No categories available'}
            </p>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')}
                className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#E1783E] hover:to-[#559F4B] text-white shadow-lg"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Category Grid */}
        {!loading && !error && filteredCategories.length > 0 && (
          <>
            {/* Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12">
              {currentCategories.map((category: any, index: number) => {
                const { Icon, color, bgColor, borderColor, gradient, accentColor } = getCategoryIcon(category.slug);
                const globalIndex = categories.findIndex((c: any) => c.id === category.id);
                const productsCount = getProductsCount(category.id);
                const subcategoryCount = getSubcategoryCount(category.id);
                
                return (
                  <div
                    key={category.id}
                    className="group relative h-64 md:h-72 lg:h-80 overflow-hidden rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <Link to={`/category/${category.slug}`}>
                      {/* Card Background */}
                      <div className="absolute inset-0 bg-white border border-gray-200 rounded-xl md:rounded-2xl" />
                      
                      {/* Accent Glow */}
                      <div className={`absolute inset-0 ${accentColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                      {/* Content Container */}
                      <div className="relative h-full p-4 md:p-5 lg:p-6 flex flex-col items-center justify-center">
                        {/* Icon Container */}
                        <div className={`${bgColor} ${borderColor} border w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-5 lg:mb-6 
                          transform transition-all duration-300 group-hover:scale-105`}>
                          <Icon className={`w-8 h-8 md:w-10 md:h-10 ${color} group-hover:scale-105 transition-transform duration-300`} />
                        </div>

                        {/* Category Info */}
                        <div className="text-center">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">{category.name}</h3>
                          
                          {/* Products and Subcategory Count */}
                          <div className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                            <span className="font-medium">{productsCount} Products</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            <span className="text-gray-500">{subcategoryCount} Collections</span>
                          </div>

                          {/* Progress Indicator */}
                          <div className="h-1 w-12 md:w-16 bg-gray-200 rounded-full overflow-hidden mx-auto mb-3 md:mb-4">
                            <div 
                              className={`h-full bg-gradient-to-r ${gradient} transition-all duration-300`}
                              style={{ width: `${Math.min(((globalIndex + 1) / categories.length) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Hover CTA */}
                        <div className="absolute bottom-4 md:bottom-5 lg:bottom-6 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold text-[#559F4B]">
                            View Products
                            <ChevronRight className={`w-3 h-3 md:w-4 md:h-4 ${color} group-hover:translate-x-1 transition-transform duration-300`} />
                          </div>
                        </div>
                      </div>

                      {/* Popular Badge */}
                      {globalIndex < 3 && (
                        <div className="absolute top-2 md:top-3 left-2 md:left-3 z-10">
                          <div className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 md:w-3 md:h-3" fill="white" />
                            <span className="hidden xs:inline">Hot</span>
                          </div>
                        </div>
                      )}

                      {/* Products Count Badge */}
                      <div className="absolute top-2 md:top-3 right-2 md:right-3 z-10">
                        <div className="bg-white/90 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm border border-gray-200">
                          {productsCount}+ Items
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 md:mt-12 mb-8 md:mb-12">
                <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6">
                    {/* Page Info */}
                    <div className="text-gray-700">
                      <p className="text-sm md:text-base font-medium">
                        Showing <span className="font-bold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredCategories.length)}</span> of{' '}
                        <span className="font-bold text-gray-900">{filteredCategories.length}</span> categories
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Page {currentPage} of {totalPages}
                      </p>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-1 md:gap-2">
                      {/* First Page */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl border border-gray-200 hover:border-[#559F4B] hover:bg-[#559F4B]/10 transition-all"
                      >
                        <ChevronsLeft className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>

                      {/* Previous Page */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl border border-gray-200 hover:border-[#559F4B] hover:bg-[#559F4B]/10 transition-all"
                      >
                        <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) => (
                          <Button
                            key={index}
                            variant={page === currentPage ? "default" : "outline"}
                            size="icon"
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            disabled={typeof page !== 'number'}
                            className={`h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl ${
                              page === currentPage 
                                ? 'bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white shadow-lg' 
                                : 'border border-gray-200 hover:border-[#559F4B]'
                            } ${typeof page !== 'number' ? 'cursor-default hover:bg-transparent' : ''}`}
                          >
                            <span className="text-xs md:text-sm">{page}</span>
                          </Button>
                        ))}
                      </div>

                      {/* Next Page */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl border border-gray-200 hover:border-[#559F4B] hover:bg-[#559F4B]/10 transition-all"
                      >
                        <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>

                      {/* Last Page */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl border border-gray-200 hover:border-[#559F4B] hover:bg-[#559F4B]/10 transition-all"
                      >
                        <ChevronsRight className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>

                    {/* Items Per Page Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm text-gray-600">Show:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-200 rounded-lg md:rounded-xl px-2 md:px-3 py-1.5 md:py-2 focus:border-[#559F4B] focus:outline-none transition-all text-sm md:text-base"
                      >
                        <option value={8}>8 per page</option>
                        <option value={12}>12 per page</option>
                        <option value={16}>16 per page</option>
                        <option value={24}>24 per page</option>
                      </select>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 md:mt-6">
                    <div className="h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#559F4B] to-[#E1783E] transition-all duration-500"
                        style={{ width: `${(currentPage / totalPages) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs md:text-sm text-gray-600 mt-2">
                      <span>Page {currentPage}</span>
                      <span>{Math.round((currentPage / totalPages) * 100)}% Complete</span>
                      <span>Page {totalPages}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="text-center mt-10 md:mt-12 p-6 md:p-8 lg:p-12 bg-gradient-to-r from-[#559F4B] to-[#E1783E] rounded-2xl md:rounded-3xl shadow-xl text-white relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="absolute -top-12 md:-top-24 -left-12 md:-left-24 w-24 h-24 md:w-48 md:h-48 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              <div className="absolute -bottom-12 md:-bottom-24 -right-12 md:-right-24 w-24 h-24 md:w-48 md:h-48 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-3 md:mb-4">
                  <Award className="w-3 h-3 md:w-4 md:h-4" />
                  Premium Quality
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                  Can't Find What You're Looking For?
                </h2>
                <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
                  Browse all products or contact our team for personalized recommendations
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                  <Button 
                    asChild
                    size="lg"
                    className="bg-white text-[#559F4B] hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm md:text-base px-6 md:px-8 py-3 md:py-4 rounded-xl"
                  >
                    <Link to="/products" className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                      View All Products
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    size="lg"
                    variant="outline"
                    className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-[#559F4B] backdrop-blur-sm shadow-lg transition-all duration-300 text-sm md:text-base px-6 md:px-8 py-3 md:py-4 rounded-xl"
                  >
                    <Link to="/contact" className="flex items-center gap-2">
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CategoriesPage;