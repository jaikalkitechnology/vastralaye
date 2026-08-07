import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Product } from "@/types";
import {
  Heart,
  Star,
  StarHalf,
  ShoppingCart,
  BadgePercent,
  CheckCircle2,
  CircleAlert,
  Eye,
  Tag,
  Package,
  Zap,
  TrendingUp,
  Truck,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useMemo, useState, useEffect } from "react";
import { BASE_IMG, BASE_URL } from "@/config";
import axios from "axios";

interface ProductListItemProps {
  product: Product;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  name: string;
  email: string;
  created_at: string;
}

const ProductListItem = ({ product }: ProductListItemProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist, addToCart } = useStore();
  const [imageError, setImageError] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [imageHover, setImageHover] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  // Inline SVG placeholder (data URL)
  const placeholderDataUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800' fill='none'>
        <rect width='800' height='800' fill='%23f8fafc'/>
        <g fill='%23e2e8f0' opacity='0.8'>
          <rect x='120' y='160' width='560' height='480' rx='16'/>
        </g>
        <text x='400' y='420' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='Arial' font-size='32' font-weight='500'>
          No Image
        </text>
      </svg>`
    );

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product.id) return;

      setReviewsLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/users/product/${product.id}/reviews`);

        let reviewsData: Review[] = [];

        // Flexible parsing for different API shapes
        if (Array.isArray(response.data)) {
          reviewsData = response.data;
        } else if (response.data && Array.isArray(response.data.reviews)) {
          reviewsData = response.data.reviews;
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

        setReviews(reviewsData);
      } catch (error: any) {
        console.log("Error fetching reviews for product:", product.id, error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [product.id]);

  // Calculate average rating from reviews
  const { averageRating, totalReviews } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { averageRating: null, totalReviews: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const avg = totalRating / reviews.length;

    return {
      averageRating: Math.round(avg * 10) / 10, // 1 decimal place
      totalReviews: reviews.length,
    };
  }, [reviews]);

  const hasRating = averageRating !== null && averageRating > 0;

  const INR = (n?: number | null) =>
    n == null || isNaN(n as number)
      ? "N/A"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(n as number);

  /**
   * Flatten potential nested arrays and weird shapes into a flat array of strings.
   */
  const flattenImages = (imgs: any): string[] => {
    if (!imgs && imgs !== 0) return [];

    if (Array.isArray(imgs)) {
      const flat = (imgs as any[]).flat(Infinity);
      return flat.map(String).map((s) => s.trim()).filter(Boolean);
    }

    if (typeof imgs === "object") {
      const vals = Object.values(imgs || {}).flat(Infinity);
      return vals.map(String).map((s) => s.trim()).filter(Boolean);
    }

    if (typeof imgs === "string") {
      const raw = imgs.trim();

      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.flat(Infinity).map(String).map((s) => s.trim()).filter(Boolean);
        }
        if (typeof parsed === "string") {
          return parsed.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        // not JSON
      }

      const parts = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) return parts;

      return raw ? [raw] : [];
    }

    return [];
  };

  /**
   * Normalize a single image fragment into an absolute URL
   */
  const normalizeSingleImage = (img: any) => {
    if (!img && img !== 0) return "";
    if (typeof img === "object" && (img as any).url) img = (img as any).url;
    if (typeof img !== "string") img = String(img);

    let s = img.trim();
    if (!s) return "";

    if (/^https?:\/\//i.test(s)) return s;

    if (!s.startsWith("/")) s = `/${s}`;
    if (!s.startsWith("/static/")) {
      s = `/static${s}`;
    }

    const base = (BASE_IMG || BASE_URL || "").replace(/\/$/, "");
    return `${base}${s}`;
  };

  // Build canonical normalizedImages array
  const normalizedImages: string[] = useMemo(() => {
    try {
      const flat = flattenImages((product as any).images);
      const normalized = flat.map(normalizeSingleImage).filter(Boolean);
      return normalized;
    } catch (err) {
      console.error("Error normalizing images for product", product?.id, err);
      return [];
    }
  }, [product.images]);

  // Compute imageUrl for card (first image or placeholder)
  const imageUrl = useMemo(() => {
    return (normalizedImages && normalizedImages.length > 0) ? normalizedImages[0] : placeholderDataUrl;
  }, [normalizedImages]);

  const price: number = (product as any).price ?? 0;
  const discountPrice: number | null =
    (product as any).discount_price ?? (product as any).discountPrice ?? null;

  const finalPrice = discountPrice && discountPrice > 0 ? discountPrice : price;
  const hasDiscount = discountPrice && discountPrice > 0 && price > discountPrice;
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const youSave = hasDiscount ? Math.max(0, price - discountPrice) : 0;

  const isInStock = (product as any).in_stock ?? true;

  // Function to render star ratings with brand colors
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <div key={`full-${i}`} className="relative">
            <div className="absolute inset-0 bg-[#E1783E] blur-sm opacity-40"></div>
            <Star className="h-4 w-4 text-[#E1783E] fill-[#E1783E] relative z-10" />
          </div>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <div className="absolute inset-0 bg-[#E1783E] blur-sm opacity-40"></div>
            <StarHalf className="h-4 w-4 text-[#E1783E] fill-[#E1783E] relative z-10" />
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}

        {/* Rating number */}
        <span className="ml-1.5 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
        {totalReviews > 0 && (
          <span className="text-xs text-gray-500 ml-1">({totalReviews})</span>
        )}
      </div>
    );
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast({ title: "Removed from Wishlist" });
    } else {
      addToWishlist(product.id);
      toast({ title: "Added to Wishlist" });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isInStock) return toast({ title: "Out of Stock" });
    addToCart(product, 1, "", "");
    toast({ title: "Added to Cart" });
  };



  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative flex flex-col md:flex-row bg-gradient-to-b from-white to-gray-50 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-0.5 border border-gray-200/50 w-full"
    >
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#559F4B] to-[#E1783E]"></div>

      {/* IMAGE SECTION - Left Side */}
      <div 
        className="relative md:w-56 lg:w-64 flex-shrink-0 aspect-square md:aspect-auto md:h-full"
        onMouseEnter={() => setImageHover(true)}
        onMouseLeave={() => setImageHover(false)}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200"></div>
        
        <img
          src={imageError ? placeholderDataUrl : imageUrl}
          alt={product.name}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageHover ? 'scale-110 opacity-90' : 'scale-100 opacity-100'
          }`}
        />

        {/* Gradient Overlay on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent transition-opacity duration-500 ${
          imageHover ? 'opacity-100' : 'opacity-0'
        }`}></div>

   


        {/* Quick Actions */}
        <div className="absolute top-5 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={toggleWishlist}
            className={`p-2.5 rounded-full backdrop-blur-sm transition-all duration-300 transform ${
              isWishlisted 
                ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg scale-110" 
                : "bg-white/90 hover:bg-white text-gray-700 hover:text-rose-500 shadow-md hover:shadow-lg"
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-white" : ""}`} />
          </button>
          
    
        </div>

        {/* Loading indicator for reviews */}
        {reviewsLoading && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
            Loading reviews...
          </div>
        )}
      </div>

      {/* CONTENT SECTION - Right Side */}
      <div className="flex-1 p-4 md:p-5 lg:p-6 flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-2 group-hover:text-[#559F4B] transition-colors duration-300">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {(product as any).description || "—"}
            </p>
          </div>
          
          <div className="flex-shrink-0">
            {/* Rating */}
            {hasRating ? (
              <div className="flex items-center gap-2">
                {renderStars(averageRating as number)}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <CircleAlert className="h-4 w-4" /> 
                <span className="font-medium">No ratings yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl md:text-3xl font-bold text-gray-900">
              {INR(finalPrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg md:text-xl text-gray-400 line-through">
                  {INR(price)}
                </span>
                <Badge className="bg-gradient-to-r from-[#559F4B] to-[#6ab45c] hover:from-[#6ab45c] hover:to-[#559F4B] text-white font-bold py-1 px-3">
                  Save {INR(youSave)}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Features and Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Category/Tags */}
          {product.category && (
            <Badge variant="outline" className="flex items-center gap-1 border-[#559F4B]/30">
              <Tag className="h-3.5 w-3.5 text-[#559F4B]" />
              <span className="text-[#559F4B] font-medium">{product.category}</span>
            </Badge>
          )}

          {/* Brand */}
          {product.brand && (
            <Badge variant="outline" className="flex items-center gap-1 border-[#E1783E]/30">
              <span className="text-[#E1783E] font-medium">{product.brand}</span>
            </Badge>
          )}

          {/* Stock Quantity */}
          {(product as any).stock_quantity && (
            <Badge variant="outline" className="flex items-center gap-1 border-gray-300">
              <Package className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-gray-600 font-medium">{(product as any).stock_quantity} available</span>
            </Badge>
          )}
        </div>

        {/* Description */}
        <div className="mb-6 flex-1">
          <p className="text-gray-600 text-sm md:text-base line-clamp-3">
            {product.description || (product as any).short_description || "No description available."}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {product.freeShipping && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#559F4B]/20 to-[#559F4B]/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-[#559F4B]" />
              </div>
              <span className="font-medium">Free Shipping</span>
            </div>
          )}
          
          {product.warranty && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#E1783E]/20 to-[#E1783E]/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#E1783E]" />
              </div>
              <span className="font-medium">{product.warranty}</span>
            </div>
          )}
        </div>

        {/* Action Buttons - Bottom */}
        <div className="mt-auto flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-100">
          <div className="flex-1 w-full sm:w-auto">
            <Button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className={`w-full py-3 text-base font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                isInStock 
                  ? "bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#E1783E] hover:to-[#559F4B] text-white transform hover:scale-[1.02]" 
                  : "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {isInStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>


               {/* Top Left Badges */}
   
          {/* Discount Badge */}
          {hasDiscount && (
            <Badge className="bg-gradient-to-r from-[#E1783E] to-[#f08a4e] hover:from-[#f08a4e] hover:to-[#E1783E] text-white border-0 shadow-lg font-bold py-1.5 px-3 text-sm">
              <BadgePercent className="h-3.5 w-3.5 mr-1.5" />
              {discountPercent}% OFF
            </Badge>
          )}

          {/* Stock Status Badge */}
          <Badge className={`${
            isInStock 
              ? "bg-gradient-to-r from-[#559F4B] to-[#6ab45c] hover:from-[#6ab45c] hover:to-[#559F4B]" 
              : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            } text-white border-0 shadow-lg font-bold py-1.5 px-3 text-sm`}
          >
            {isInStock ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                In Stock
              </>
            ) : (
              "Out of Stock"
            )}
          </Badge>


                    {/* Featured Badge */}
          {product.featured && (
            <Badge className="bg-gradient-to-r from-[#559F4B] to-[#6ab45c] hover:from-[#6ab45c] hover:to-[#559F4B] text-white border-0 shadow-lg font-bold py-1.5 px-3 text-sm">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Featured
            </Badge>
          )}

          {/* Best Seller Badge */}
          {product.bestSeller && (
            <Badge className="bg-gradient-to-r from-[#E1783E] to-[#f08a4e] hover:from-[#f08a4e] hover:to-[#E1783E] text-white border-0 shadow-lg font-bold py-1.5 px-3 text-sm">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Best Seller
            </Badge>
          )}
        
          
          <div className="flex items-center gap-2">
 
            
            <button
              onClick={toggleWishlist}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isWishlisted 
                  ? "text-rose-500 border-rose-300 bg-rose-50" 
                  : "text-gray-600 border-gray-300 hover:border-[#E1783E] hover:text-[#E1783E]"
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-rose-500" : ""}`} />
            </button>
            
            {/* View Details Arrow */}
            <div className="hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center text-sm text-[#559F4B] font-medium">
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#559F4B]/20 rounded-xl sm:rounded-2xl transition-all duration-500 pointer-events-none"></div>
    </Link>
  );
};

export default ProductListItem;