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
import { discountBadgeText, discountLabel } from "@/lib/discount";

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
    .map((item: any) => {
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
      const exists = wishlist.some((w: any) => Number(w.product_id) === Number(productId));

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
    return cart.some((item: any) => Number(item.product_id) === Number(productId));
  };

  // Fetch reviews for all wishlist products
// Fetch reviews for all wishlist products - FIXED VERSION
useEffect(() => {
  const fetchReviews = async () => {
    const reviewsMap: Record<string, Review[]> = {};
    
    for (const product of wishlistProducts) {
      if (!product.id) continue;
      
      try {
        const response = await axios.get<any>(`${BASE_URL}/users/product/${product.id}/reviews?page=1&page_size=100`);
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
        const lowerValue = (product.in_stock as any).toLowerCase().trim();
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-sand rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  // Empty wishlist
  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-blush rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-10 w-10 text-maroon" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso mb-4">
              Your wishlist is empty
            </h1>
            <p className="text-muted-foreground mb-8">
              Save items you love by clicking the heart icon on any product.
            </p>
            <div className="space-y-4">
              <Button
                className="w-full h-12 bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm transition-colors"
                asChild
              >
                <Link to="/products">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Start Shopping
                </Link>
              </Button>
              {!isLoggedIn && (
                <Button
                  className="w-full h-12 text-xs font-semibold uppercase tracking-[0.16em] rounded-sm"
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
              <div className="text-center mb-8">
                <span className="overline-label mb-2">Handpicked for you</span>
                <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso">
                  Recommended for You
                </h2>
              </div>
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
          <Star key={`full-${i}`} className="h-3.5 w-3.5 text-gold fill-gold" />
        ))}
        {hasHalfStar && <StarHalf className="h-3.5 w-3.5 text-gold fill-gold" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-border" />
        ))}
        {totalReviews > 0 && (
          <span className="text-xs text-muted-foreground ml-1">({totalReviews})</span>
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
    <div className="min-h-screen bg-background py-8">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-espresso text-xs font-semibold uppercase tracking-[0.12em]"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso mb-2">Your Wishlist</h1>
              <p className="text-sm text-muted-foreground">
                {wishlistProducts.length} {wishlistProducts.length === 1 ? 'piece' : 'pieces'} saved — they're waiting for you
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button
                variant="outline"
                className="text-xs font-semibold uppercase tracking-[0.12em] rounded-sm"
                onClick={handleAddAllToCart}
                disabled={wishlistProducts.every(p => !checkStockStatus(p)) || isLoading}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </Button>
              <Button
                variant="outline"
                className="text-xs font-semibold uppercase tracking-[0.12em] rounded-sm border-border text-muted-foreground hover:bg-transparent hover:border-sale hover:text-sale"
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
              <Heart className="h-14 w-14 text-border mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="font-serif text-2xl font-medium text-espresso mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-6">Start adding items you love!</p>
              <Button
                className="bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] px-8 rounded-sm transition-colors"
                asChild
              >
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {wishlistProducts.map((product) => {
                const { averageRating, totalReviews } = getProductRating(product.id);
                const hasRating = averageRating !== null && averageRating > 0;
                
                const price: number = product.price ?? 0;
                const discountPrice: number | null = product.discount_price ?? product.discountPrice ?? null;
                const finalPrice = discountPrice && discountPrice > 0 ? discountPrice : price;
                const hasDiscount = discountPrice && discountPrice > 0 && price > discountPrice;
                const offBadge = hasDiscount ? discountBadgeText(price, discountPrice) : null;
                const offLabel = hasDiscount ? discountLabel(price, discountPrice) : null;
                
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
                  <div key={product.id} className="group">
                    {/* Product Image */}
                    <Link to={`/product/${product.id}`} className="block relative">
                      <div className="aspect-[3/4] overflow-hidden rounded-sm bg-sand">
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </div>

                      {/* Wishlist Remove Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateWishlist(String(product.id));
                        }}
                        className="absolute top-2.5 right-2.5 w-9 h-9 bg-white/95 rounded-full flex items-center justify-center text-espresso hover:text-sale transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                      </button>

                      {/* Stock & Discount Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                        {offBadge && (
                          <Badge className="bg-sale text-white border-0 rounded-[1px] text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 hover:bg-sale">
                            {offBadge}
                          </Badge>
                        )}
                        <Badge className={`border-0 rounded-[1px] text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 ${isInStock ? 'bg-ivory/95 text-green-700 hover:bg-ivory/95' : 'bg-espresso text-ivory hover:bg-espresso'}`}>
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
                    <div className="pt-3">
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{product.category}</span>
                        {hasRating && (
                          <div className="flex items-center gap-1">
                            {renderStars(averageRating as number, totalReviews)}
                          </div>
                        )}
                      </div>

                      {/* Product Name */}
                      <Link to={`/product/${product.id}`}>
                        <h3 className="text-sm font-medium text-espresso mb-1.5 line-clamp-2 group-hover:text-maroon transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="mb-3">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-[15px] font-semibold text-espresso">
                            {formatINR(finalPrice)}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-[13px] text-muted-foreground line-through">
                                {formatINR(price)}
                              </span>
                              {offLabel && (
                                <span className="text-xs font-semibold text-sale">
                                  ({offLabel})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {productInCart ? (
                          <Button
                            variant="outline"
                            className="flex-1 h-10 text-[11px] font-semibold uppercase tracking-[0.12em] rounded-sm"
                            asChild
                          >
                            <Link to="/cart">
                              <ShoppingCart className="h-4 w-4 mr-1.5" />
                              In Cart
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 h-10 bg-maroon hover:bg-terracotta text-ivory text-[11px] font-semibold uppercase tracking-[0.12em] rounded-sm transition-colors disabled:bg-sand disabled:text-muted-foreground"
                            onClick={handleAddToCart}
                            disabled={!isInStock}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1.5" />
                            {isInStock ? 'Add to Cart' : 'Out of Stock'}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          className="h-10 w-10 p-0 rounded-sm"
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
          <div className="mt-16 pt-10 border-t border-border">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="overline-label mb-2">Handpicked for you</span>
                <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso">Recommended for You</h2>
                <p className="text-sm text-muted-foreground mt-1">Products you might like</p>
              </div>
              <Button
                variant="ghost"
                className="text-espresso hover:text-maroon hover:bg-transparent text-xs font-semibold uppercase tracking-[0.12em] underline-offset-4 hover:underline"
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