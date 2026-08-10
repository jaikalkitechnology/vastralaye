import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Product } from "@/types";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useMemo, useState } from "react";
import { BASE_IMG, BASE_URL } from "@/config";

interface ProductCardProps {
  product: Product;
}

/**
 * Matted atelier product card (new_design.md §15): the 3:4 image sits
 * inside a white "mat" frame with an inner gold hairline that appears
 * on hover, museum-label typography centered beneath (gold category
 * overline → serif name → stars → price → gold rule), an espresso
 * quick-add bar and a framed square wishlist chip. Hover image-swap,
 * cart/wishlist logic and image normalization preserved.
 */
const ProductCard = ({ product }: ProductCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist, addToCart } = useStore();
  const [imageError, setImageError] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  const placeholderDataUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'>
        <rect width='600' height='800' fill='%23EFE7DB'/>
        <text x='300' y='400' dominant-baseline='middle' text-anchor='middle' fill='%236E5F53' font-family='Georgia' font-style='italic' font-size='28'>Vastralaye</text>
      </svg>`
    );

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
  const discountPercent = hasDiscount ? Math.round(((price - (discountPrice as number)) / price) * 100) : 0;

  const isInStock = (product as any).in_stock ?? true;
  const isNew = (product as any).new_arrival ?? (product as any).newArrival ?? false;
  const isBestSeller = (product as any).best_seller ?? product.bestSeller ?? false;

  const averageRating = product.rating || null;
  const totalReviews = product.reviewCount || (product as any).reviews || 0;
  const hasRating = averageRating !== null && averageRating > 0;

  const categoryName =
    (product as any).category?.name || (product as any).category_name || null;

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
      className="group relative flex w-full flex-col rounded-sm border border-border bg-white p-2.5 transition-all duration-300 hover:border-gold/50 hover:shadow-[0_10px_30px_rgba(43,27,18,0.1)]"
    >
      {/* IMAGE — matted inside the card */}
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
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

        {/* Inner gold hairline frame (hover) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-2 z-10 border border-gold/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Badges */}
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

        {/* Wishlist — framed square chip */}
        <button
          onClick={toggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-[3px] border border-border bg-white/95 transition-colors hover:border-maroon"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? "fill-maroon text-maroon" : "text-espresso"
            }`}
            strokeWidth={1.6}
          />
        </button>

        {/* Quick add — espresso bar, slides up on hover (always visible on touch) */}
        <button
          onClick={handleAddToCart}
          disabled={!isInStock}
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 bg-espresso/95 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ivory transition-transform duration-200 sm:translate-y-full sm:group-hover:translate-y-0 disabled:text-ivory/60"
        >
          <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.6} />
          {isInStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>

      {/* INFO — centered museum label */}
      <div className="px-1.5 pb-3 pt-3.5 text-center">
        {categoryName && (
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#8A6414]">
            {categoryName}
          </p>
        )}
        <h3 className="mt-1 truncate font-serif text-[15px] font-medium leading-snug text-espresso transition-colors group-hover:text-maroon">
          {product.name}
        </h3>

        {hasRating && (
          <div className="mt-1.5 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.round(averageRating as number)
                    ? "text-gold fill-gold"
                    : "text-sand fill-sand"
                }`}
              />
            ))}
            {totalReviews > 0 && (
              <span className="ml-1 text-[11px] text-muted-foreground">({totalReviews})</span>
            )}
          </div>
        )}

        <div className="mt-1.5 flex items-baseline justify-center gap-2">
          <span className="text-[15px] font-semibold text-espresso">{INR(finalPrice)}</span>
          {hasDiscount && (
            <>
              <span className="text-[13px] text-muted-foreground line-through">{INR(price)}</span>
              <span className="text-xs font-semibold text-sale">({discountPercent}% off)</span>
            </>
          )}
        </div>

        {/* Signature gold rule (hover) */}
        <span
          aria-hidden
          className="mx-auto mt-2.5 block h-px w-11 scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100"
        />
      </div>
    </Link>
  );
};

export default ProductCard;
