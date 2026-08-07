import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Heart, Trash2, ArrowRight, Eye, ShoppingCart, Star, StarHalf, CircleAlert, Tag, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductGrid from "@/components/ProductGrid";
import { BASE_URL, BASE_IMG } from "../config";
import { toast } from "sonner";
import { Product } from "@/types";
import { useEffect, useState } from "react";
import axios from "axios";

interface Review {
  id: number;
  rating: number;
  comment: string;
  name: string;
  email: string;
  created_at: string;
}

const WishlistPage = () => {
  const { state, addToWishlist, removeFromWishlist, syncWishlistFromServer, addToCart } = useStore();
  const { wishlist, products, isLoggedIn, cart } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [productReviews, setProductReviews] = useState<Record<string, Review[]>>({});

  // Sync wishlist for logged-in users
  useEffect(() => {
    const load = async () => {
      if (isLoggedIn) {
        try {
          setIsLoading(true);
          await syncWishlistFromServer();
        } catch {
          toast.error("Failed to load wishlist");
        } finally {
          setIsLoading(false);
        }
      }
    };
    load();
  }, [isLoggedIn]);

  // Wishlist product mapping
  const wishlistProducts = wishlist
    .map((item) => {
      if (item.product) return item.product;
      return products.find((p) => Number(p.id) === Number(item.product_id));
    })
    .filter(Boolean) as Product[];

  const recommendedProducts = products
    .filter((p) => p.featured || p.bestSeller)
    .slice(0, 8);

  // Add/Remove from wishlist
  const updateWishlist = async (productId: string) => {
    try {
      setIsLoading(true);
      const exists = wishlist.some((w) => Number(w.product_id) === Number(productId));

      if (exists) {
        await removeFromWishlist(productId);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if product is in cart
  const isInCart = (productId: string) => {
    return cart.some(item => Number(item.product_id) === Number(productId));
  };

  // Fetch reviews for all wishlist products
// Fetch reviews for all wishlist products - FIXED VERSION
useEffect(() => {
  const fetchReviews = async () => {
    const reviewsMap: Record<string, Review[]> = {};
    
    for (const product of wishlistProducts) {
      if (!product.id) continue;
      
      try {
        const response = await axios.get(`${BASE_URL}/users/product/${product.id}/reviews?page=1&page_size=100`);
        let reviewsData: Review[] = [];

        // Handle paginated response
        if (response.data && Array.isArray(response.data.reviews)) {
          reviewsData = response.data.reviews;
        } else if (response.data && Array.isArray(response.data.data)) {
          reviewsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          reviewsData = response.data;
        } else if (response.data && typeof response.data === "object") {
          const arrays = Object.values(response.data).filter((v) => Array.isArray(v));
          if (arrays.length > 0) reviewsData = arrays[0] as Review[];
        } else if (typeof response.data === "string") {
          try {
            const parsed = JSON.parse(response.data);
            if (Array.isArray(parsed)) reviewsData = parsed;
            else if (parsed && Array.isArray(parsed.reviews)) reviewsData = parsed.reviews;
          } catch {
            console.log("Could not parse string response as JSON for reviews");
          }
        }

        reviewsMap[product.id] = reviewsData;
      } catch (error: any) {
        console.log("Error fetching reviews for product:", product.id, error);
        reviewsMap[product.id] = [];
      }
    }
    
    setProductReviews(reviewsMap);
  };

  if (wishlistProducts.length > 0) {
    fetchReviews();
  }
  
  // FIXED: Only run when wishlist item IDs change, not the entire object
}, [wishlistProducts.map(p => p.id).join(',')]); // ← Changed dependency


  // Stock check function
  const checkStockStatus = (product: Product): boolean => {
    if (product.stock !== undefined && product.stock !== null) {
      const stockNum = Number(product.stock);
      if (!isNaN(stockNum)) {
        return stockNum > 0;
      }
    }

    if (product.quantity !== undefined && product.quantity !== null) {
      const quantityNum = Number(product.quantity);
      if (!isNaN(quantityNum)) {
        return quantityNum > 0;
      }
    }

    if (product.in_stock !== undefined && product.in_stock !== null) {
      if (typeof product.in_stock === 'boolean') {
        return product.in_stock;
      }
      if (typeof product.in_stock === 'string') {
        const lowerValue = product.in_stock.toLowerCase().trim();
        if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') {
          return true;
        }
        if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') {
          return false;
        }
      }
      if (typeof product.in_stock === 'number') {
        return product.in_stock > 0;
      }
    }

    const stockFields = ['inStock', 'available', 'available_quantity', 'in_stock_quantity', 'stock_quantity'];
    for (const field of stockFields) {
      const value = (product as any)[field];
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase().trim();
          if (lowerValue === 'true' || lowerValue === 'yes') return true;
          if (lowerValue === 'false' || lowerValue === 'no') return false;
        }
        const numValue = Number(value);
        if (!isNaN(numValue)) return numValue > 0;
      }
    }

    return true;
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#E97A48] to-[#5E9F50] rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  // Empty wishlist
  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto border-2 border-gray-200">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Wishlist is Empty
            </h1>
            <p className="text-gray-600 mb-8">
              Save items you love by clicking the heart icon on any product.
            </p>
            <div className="space-y-4">
              <Button
                className="w-full bg-[#5E9F50] hover:bg-[#4d8f40] text-white py-3 text-base rounded-lg"
                asChild
              >
                <Link to="/products">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Start Shopping
                </Link>
              </Button>
              {!isLoggedIn && (
                <Button
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 text-base rounded-lg hover:bg-gray-50"
                  variant="outline"
                  asChild
                >
                  {/* <Link to="/login">
                    <Heart className="mr-2 h-5 w-5" />
                    Login to Save Wishlist
                  </Link> */}
                </Button>
              )}
            </div>
          </div>
          
          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Recommended for You
              </h2>
              <ProductGrid products={recommendedProducts} title="" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Helper function to get image URL
  const getImageUrl = (product: Product) => {
    try {
      const images = Array.isArray(product.images)
        ? product.images
        : JSON.parse(product.images || "[]");

      if (images.length > 0) {
        const firstImage = images[0];
        let imageUrl = firstImage;
        
        if (!firstImage.startsWith('http') && !firstImage.startsWith('//')) {
          imageUrl = firstImage.startsWith('/') ? firstImage : `/${firstImage}`;
          const base = BASE_IMG || BASE_URL.replace("/api/v1", "");
          imageUrl = `${base}${imageUrl}`;
        }
        
        return imageUrl;
      }
    } catch (error) {
      console.error("Error parsing product images:", error);
    }
    return "/placeholder.svg";
  };

  // Format price in INR
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get rating for a product
  const getProductRating = (productId: string) => {
    const reviews = productReviews[productId] || [];
    if (reviews.length === 0) return { averageRating: null, totalReviews: 0 };
    
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    
    return { averageRating, totalReviews: reviews.length };
  };

  // Function to render star ratings
  const renderStars = (rating: number, totalReviews: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
        ))}
        {hasHalfStar && <StarHalf className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-gray-300" />
        ))}
        {totalReviews > 0 && (
          <span className="text-xs text-gray-500 ml-1">({totalReviews})</span>
        )}
      </div>
    );
  };

  // Handle "Add All to Cart"
  const handleAddAllToCart = async () => {
    const inStockProducts = wishlistProducts.filter(p => checkStockStatus(p));
    
    if (inStockProducts.length === 0) {
      toast.error("No items in stock to add to cart");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(`Adding ${inStockProducts.length} items to cart...`);

    try {
      for (const product of inStockProducts) {
        await addToCart(product, 1, "", "");
      }
      toast.success(`Successfully added ${inStockProducts.length} items to cart!`, {
        id: toastId
      });
    } catch (error) {
      toast.error("Failed to add some items to cart", {
        id: toastId
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Clear Wishlist"
  const handleClearWishlist = async () => {
    const confirmed = window.confirm("Clear all items from your wishlist?");
    if (!confirmed) return;

    setIsLoading(true);
    const toastId = toast.loading("Clearing wishlist...");

    try {
      for (const product of wishlistProducts) {
        await removeFromWishlist(String(product.id));
      }
      toast.success("Wishlist cleared successfully!", {
        id: toastId
      });
    } catch (error) {
      toast.error("Failed to clear wishlist", {
        id: toastId
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
              <p className="text-gray-600">
                {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handleAddAllToCart}
                disabled={wishlistProducts.every(p => !checkStockStatus(p)) || isLoading}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={handleClearWishlist}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Wishlist Items - Grid Layout */}
        <div className="mb-12">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">Start adding items you love!</p>
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistProducts.map((product) => {
                const { averageRating, totalReviews } = getProductRating(product.id);
                const hasRating = averageRating !== null && averageRating > 0;
                
                const price: number = product.price ?? 0;
                const discountPrice: number | null = product.discount_price ?? product.discountPrice ?? null;
                const finalPrice = discountPrice && discountPrice > 0 ? discountPrice : price;
                const hasDiscount = discountPrice && discountPrice > 0 && price > discountPrice;
                const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
                
                const isInStock = checkStockStatus(product);
                const productInCart = isInCart(String(product.id));

                const handleAddToCart = async (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isInStock) {
                    toast.error("Out of Stock");
                    return;
                  }
                  try {
                    addToCart(product, 1, "", "");
                    toast.success("Added to cart");
                  } catch {
                    toast.error("Failed to add to cart");
                  }
                };

                return (
                  <div
                    key={product.id}
                    className="group bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    {/* Product Image */}
                    <Link to={`/product/${product.id}`} className="block relative">
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      {/* Wishlist Remove Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateWishlist(String(product.id));
                        }}
                        className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow hover:scale-105"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>

                      {/* Stock & Discount Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {hasDiscount && (
                          <Badge className="bg-[#E97A48] text-white border-0">
                            <Tag className="h-3 w-3 mr-1" /> {discountPercent}% OFF
                          </Badge>
                        )}
                        <Badge className={`border-0 ${isInStock ? 'bg-[#5E9F50] text-white' : 'bg-red-600 text-white'}`}>
                          {isInStock ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {isInStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="p-5">
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">{product.category}</span>
                        {hasRating && (
                          <div className="flex items-center gap-1">
                            {renderStars(averageRating as number, totalReviews)}
                          </div>
                        )}
                      </div>

                      {/* Product Name */}
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#E97A48] transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            {formatINR(finalPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatINR(price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {productInCart ? (
                          <Button
                            className="flex-1 bg-green-50 text-[#5E9F50] hover:bg-green-100 border border-[#5E9F50]"
                            asChild
                          >
                            <Link to="/cart">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              In Cart
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 bg-[#5E9F50] hover:bg-[#4d8f40] text-white"
                            onClick={handleAddToCart}
                            disabled={!isInStock}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isInStock ? 'Add to Cart' : 'Out of Stock'}
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          className="border-gray-300 hover:border-gray-400"
                          asChild
                        >
                          <Link to={`/product/${product.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                <p className="text-gray-600 mt-1">Products you might like</p>
              </div>
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-gray-900"
                asChild
              >
                <Link to="/products">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={recommendedProducts} title="" />
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;