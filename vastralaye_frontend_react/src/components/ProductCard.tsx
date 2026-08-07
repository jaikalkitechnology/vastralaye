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
  Zap,
  TrendingUp,
  Truck,
  Shield,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useMemo, useState } from "react";
import { BASE_IMG, BASE_URL } from "@/config";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist, addToCart } = useStore();
  const [imageError, setImageError] = useState(false);
  const [imageHover, setImageHover] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  // Inline SVG placeholder (data URL) - Using brand colors
  const placeholderDataUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800' fill='none'>
        <rect width='800' height='800' fill='%23f8fafc'/>
        <g fill='%23e2e8f0' opacity='0.8'>
          <rect x='160' y='180' width='480' height='440' rx='16'/>
          <circle cx='400' cy='360' r='80'/>
          <rect x='320' y='500' width='160' height='20' rx='10'/>
          <rect x='280' y='540' width='240' height='16' rx='8'/>
        </g>
        <text x='400' y='360' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='Arial' font-size='32' font-weight='500'>
          No Image
        </text>
      </svg>`
    );

  // REMOVED: Review fetching useEffect and state
  // REMOVED: reviews, setReviews, reviewsLoading, setReviewsLoading

  // Use product's rating if available, otherwise show no rating
  const averageRating = product.rating || null;
  const totalReviews = product.reviewCount || 0;
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

  // Function to render star ratings - Using brand colors for accents
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
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#E1783E] fill-[#E1783E] relative z-10" />
          </div>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <div className="absolute inset-0 bg-[#E1783E] blur-sm opacity-40"></div>
            <StarHalf className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#E1783E] fill-[#E1783E] relative z-10" />
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300" />
        ))}

        {/* Rating number */}
        <span className="ml-1.5 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
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
      className="group relative flex flex-col bg-gradient-to-b from-white to-gray-50 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-gray-200 w-full"
    >
      {/* Top Gradient Accent - Using brand colors */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#559F4B] to-[#E1783E]"></div>

      {/* IMAGE CONTAINER */}
      <div
        className="relative aspect-square overflow-hidden"
        onMouseEnter={() => setImageHover(true)}
        onMouseLeave={() => setImageHover(false)}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200"></div>

        {/* Main Image */}
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
        <div className="absolute top-5 xs:top-16 right-3 z-20 flex flex-col gap-2">
          <button
            onClick={toggleWishlist}
            className={`p-2 sm:p-2.5 rounded-full backdrop-blur-sm transition-all duration-300 transform ${
              isWishlisted
                ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg scale-110"
                : "bg-white/90 hover:bg-white text-gray-700 hover:text-rose-500 shadow-md hover:shadow-lg"
            }`}
          >
            <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>
        </div>

        {/* REMOVED: Loading indicator for reviews */}
      </div>

      {/* CONTENT */}
      <div className="p-3 sm:p-4 md:p-5 flex flex-col gap-2 sm:gap-3 flex-1">
        {/* Category / Brand */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-0">
          <div className="flex items-center gap-2">
            {product.brand && (
              <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 border-[#559F4B]/30">
                {product.brand}
              </Badge>
            )}
            {(product as any).category && (
              <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 border-[#E1783E]/30">
                {(product as any).category}
              </Badge>
            )}
          </div>

          {/* Rating */}
          {hasRating ? (
            <div className="flex items-center gap-1.5">
              {renderStars(averageRating as number)}
              {totalReviews > 0 && (
                <span className="hidden sm:inline text-xs text-gray-500 font-medium">({totalReviews})</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <CircleAlert className="h-3.5 w-3.5" />
              <span className="font-medium hidden xs:inline">No ratings yet</span>
              <span className="font-medium xs:hidden">No rating</span>
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <Badge className="bg-gradient-to-r from-[#E1783E] to-[#f08a4e] hover:from-[#f08a4e] hover:to-[#E1783E] text-white border-0 shadow-lg font-bold py-1.5 px-3 text-xs sm:text-sm">
              <BadgePercent className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              {discountPercent}% OFF
            </Badge>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-gray-900 font-bold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-[#559F4B] transition-colors duration-300">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 flex-1">
          {(product as any).description || "No description available"}
        </p>

        {/* PRICE SECTION */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-bold text-xl sm:text-2xl text-gray-900">
              {INR(finalPrice)}
            </span>

            {hasDiscount && (
              <>
                <span className="text-base sm:text-lg text-gray-400 line-through">
                  {INR(price)}
                </span>
                <Badge className="bg-gradient-to-r from-[#559F4B] to-[#6ab45c] hover:from-[#6ab45c] hover:to-[#559F4B] text-white font-bold py-1 px-2 sm:px-3 text-xs sm:text-sm">
                  Save {INR(youSave)}
                </Badge>
              </>
            )}

            {/* Stock Status Badge */}
            <Badge className={`${
              isInStock
                ? "bg-gradient-to-r from-[#559F4B] to-[#6ab45c] hover:from-[#6ab45c] hover:to-[#559F4B]"
                : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            } text-white border-0 shadow-lg font-bold py-1.5 px-3 text-xs sm:text-sm`}>
              {isInStock ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  <span className="hidden xs:inline">In Stock</span>
                  <span className="xs:hidden">Stock</span>
                </>
              ) : (
                "Out of Stock"
              )}
            </Badge>

            {/* Featured Badge */}
            {product.featured && (
              <Badge className="bg-gradient-to-r from-[#559F4B] to-[#6ab45c] hover:from-[#6ab45c] hover:to-[#559F4B] text-white border-0 shadow-lg font-bold py-1.5 px-3 text-xs sm:text-sm">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                <span className="inline">Featured</span>
              </Badge>
            )}

            {/* Best Seller Badge */}
            {product.bestSeller && (
              <Badge className="bg-gradient-to-r from-[#E1783E] to-[#f08a4e] hover:from-[#f08a4e] hover:to-[#E1783E] text-white border-0 shadow-lg font-bold py-1.5 px-3 text-xs sm:text-sm">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                <span className="hidden sm:inline">Best Seller</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Features - Responsive Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 pt-1 sm:pt-2">
          {product.freeShipping && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-[#559F4B]/20 to-[#559F4B]/10 flex items-center justify-center flex-shrink-0">
                <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#559F4B]" />
              </div>
              <span className="font-medium hidden xs:inline">Free Shipping</span>
              <span className="font-medium xs:hidden">Free Ship</span>
            </div>
          )}

          {product.warranty && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-[#E1783E]/20 to-[#E1783E]/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#E1783E]" />
              </div>
              <span className="font-medium hidden xs:inline">{product.warranty}</span>
              <span className="font-medium xs:hidden">Warranty</span>
            </div>
          )}

          {(product as any).stock_quantity && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 flex items-center justify-center flex-shrink-0">
                <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600" />
              </div>
              <span className="font-medium">
                {(product as any).stock_quantity} <span className="hidden xs:inline">available</span>
                <span className="xs:hidden">left</span>
              </span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={!isInStock}
          className={`w-full py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mt-2 sm:mt-3 ${
            isInStock
              ? "bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#E1783E] hover:to-[#559F4B] text-white transform hover:scale-[1.02]"
              : "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-2.5" />
          {isInStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#559F4B]/20 rounded-xl sm:rounded-2xl transition-all duration-500 pointer-events-none"></div>
    </Link>
  );
};

export default ProductCard;
