import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Product } from "@/types";
import { Heart, ShoppingBag, Star, ArrowRight } from "lucide-react";
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

/**
 * Editorial list-view row (design system): 3:4 image with hover swap,
 * serif title, gold stars, quiet price block and a flat action row.
 * Review fetching, image normalization and cart/wishlist logic preserved.
 */
const ProductListItem = ({ product }: ProductListItemProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist, addToCart } = useStore();
  const [imageError, setImageError] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const isWishlisted = isInWishlist(product.id);

  const placeholderDataUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'>
        <rect width='600' height='800' fill='%23EFE7DB'/>
        <text x='300' y='400' dominant-baseline='middle' text-anchor='middle' fill='%236E5F53' font-family='Georgia' font-style='italic' font-size='28'>Vastraliya</text>
      </svg>`
    );

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product.id) return;
      try {
        const response = await axios.get<any>(`${BASE_URL}/users/product/${product.id}/reviews`);

        let reviewsData: Review[] = [];
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
      }
    };

    fetchReviews();
  }, [product.id]);

  const { averageRating, totalReviews } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { averageRating: null, totalReviews: 0 };
    }
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const avg = totalRating / reviews.length;
    return { averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length };
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

  /** Flatten potential nested arrays and weird shapes into a flat array of strings. */
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

  /** Normalize a single image fragment into an absolute URL. */
  const normalizeSingleImage = (img: any) => {
    if (!img && img !== 0) return "";
    if (typeof img === "object" && (img as any).url) img = (img as any).url;
    if (typeof img !== "string") img = String(img);

    let s = img.trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (!s.startsWith("/")) s = `/${s}`;
    if (!s.startsWith("/static/")) s = `/static${s}`;

    const base = (BASE_IMG || BASE_URL || "").replace(/\/$/, "");
    return `${base}${s}`;
  };

  const normalizedImages: string[] = useMemo(() => {
    try {
      return flattenImages((product as any).images).map(normalizeSingleImage).filter(Boolean);
    } catch (err) {
      console.error("Error normalizing images for product", product?.id, err);
      return [];
    }
  }, [product.images]);

  const imageUrl = normalizedImages[0] || placeholderDataUrl;
  const hoverImageUrl = normalizedImages[1] || null;

  const price: number = (product as any).price ?? 0;
  const discountPrice: number | null =
    (product as any).discount_price ?? (product as any).discountPrice ?? null;

  const finalPrice = discountPrice && discountPrice > 0 ? discountPrice : price;
  const hasDiscount = !!(discountPrice && discountPrice > 0 && price > discountPrice);
  const discountPercent = hasDiscount
    ? Math.round(((price - (discountPrice as number)) / price) * 100)
    : 0;

  const isInStock = (product as any).in_stock ?? true;
  const isNew = (product as any).new_arrival ?? (product as any).newArrival ?? false;
  const isBestSeller = (product as any).best_seller ?? product.bestSeller ?? false;

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
      className="group flex bg-white border border-border rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300 w-full"
    >
      {/* IMAGE — fixed 3:4 column with hover swap */}
      <div className="relative w-32 xs:w-36 sm:w-44 md:w-52 shrink-0 self-stretch bg-sand overflow-hidden">
        <div className="relative w-full h-full min-h-[170px] sm:min-h-[200px]">
          <img
            src={imageError ? placeholderDataUrl : imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.04] ${
              hoverImageUrl ? "group-hover:opacity-0" : ""
            }`}
          />
          {hoverImageUrl && (
            <img
              src={hoverImageUrl}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.04]"
            />
          )}

          {/* Flat badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {isNew && (
              <span className="bg-gold text-espresso text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-[2px] w-max">
                New
              </span>
            )}
            {isBestSeller && (
              <span className="bg-espresso text-ivory text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-[2px] w-max">
                Bestseller
              </span>
            )}
            {hasDiscount && (
              <span className="bg-sale text-white text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-[2px] w-max">
                -{discountPercent}%
              </span>
            )}
            {!isInStock && (
              <span className="bg-white/90 text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-[2px] w-max">
                Out of stock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-5 md:p-6">
        {/* Category overline */}
        {(product as any).category && (
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold mb-1">
            {(product as any).category}
          </span>
        )}

        {/* Title */}
        <h3 className="font-serif text-base sm:text-lg md:text-xl font-medium text-espresso leading-snug line-clamp-2 group-hover:text-maroon transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {hasRating && (
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.round(averageRating as number)
                    ? "text-gold fill-gold"
                    : "text-sand fill-sand"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1.5">
              {(averageRating as number).toFixed(1)}
              {totalReviews > 0 && ` (${totalReviews})`}
            </span>
          </div>
        )}

        {/* Description */}
        {((product as any).description || (product as any).short_description) && (
          <p className="hidden sm:block text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-2">
            {(product as any).description || (product as any).short_description}
          </p>
        )}

        {/* Price */}
        <div className="flex flex-wrap items-baseline gap-2 mt-3">
          <span className="text-lg md:text-xl font-semibold text-espresso">{INR(finalPrice)}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-muted-foreground line-through">{INR(price)}</span>
              <span className="text-xs font-semibold text-sale">({discountPercent}% off)</span>
            </>
          )}
        </div>

        {/* Action row */}
        <div className="mt-auto pt-4 flex items-center gap-2.5 border-t border-border mt-4">
          <button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className="inline-flex items-center gap-2 bg-maroon text-ivory text-[11px] font-semibold uppercase tracking-[0.14em] px-5 sm:px-7 py-2.5 sm:py-3 rounded-sm hover:bg-terracotta transition-colors disabled:bg-sand disabled:text-muted-foreground"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span className="hidden xs:inline">{isInStock ? "Add to Cart" : "Out of Stock"}</span>
            <span className="xs:hidden">{isInStock ? "Add" : "N/A"}</span>
          </button>

          <button
            onClick={toggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] shrink-0 border rounded-sm flex items-center justify-center transition-colors ${
              isWishlisted
                ? "border-maroon bg-blush"
                : "border-espresso/30 hover:border-maroon hover:bg-ivory"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${isWishlisted ? "fill-maroon text-maroon" : "text-espresso"}`}
              strokeWidth={1.6}
            />
          </button>

          <span className="hidden lg:inline-flex items-center gap-1 ml-auto text-[11px] font-semibold uppercase tracking-[0.12em] text-terracotta opacity-0 group-hover:opacity-100 transition-opacity">
            View details <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductListItem;
