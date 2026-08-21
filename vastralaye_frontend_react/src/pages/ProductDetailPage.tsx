import { Product } from "@/types";
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore, MAX_QTY_PER_PRODUCT } from "@/contexts/StoreContext";
import {
  ShoppingBag,
  Heart,
  Share2,
  RefreshCw,
  Star,
  StarHalf,
  Play,
  FileText,
  Download,
  ArrowLeft,
  Package,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { BASE_IMG, BASE_URL } from "@/config";
import ReviewSection from "@/pages/ReviewSection";
import ReelsSection from "@/components/ReelsSection";
import StickyReelVideo from "@/components/StickyReelVideo";
import ProductCard from "@/components/ProductCard";
import { adminMe } from "@/api/apihelper";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<"image" | "video" | "pdf">("image");
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [colorImageMap, setColorImageMap] = useState<{ [color: string]: string }>({});
  const [activeTab, setActiveTab] = useState<"highlights" | "specifications" | "details">("highlights");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isHoverZoom, setIsHoverZoom] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Slider state for related products
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();

  const getMediaUrl = (media: string | null) => {
    if (!media) return null;
    if (media.startsWith("http")) return media;
    if (media.startsWith("/static/")) return `${BASE_IMG}${media}`;
    if (media.startsWith("static/")) return `${BASE_IMG}/${media}`;
    if (media.includes('/')) {
      const cleanPath = media.replace(/^\/+/, "");
      return `${BASE_IMG}/${cleanPath}`;
    }
    const cleanPath = media.replace(/^\/+/, "");
    return `${BASE_IMG}/static/${cleanPath}`;
  };

  const parseStringArray = (arr: any): string[] => {
    if (!arr) return [];
    if (Array.isArray(arr)) return arr.map(String).filter(Boolean);
    try {
      const parsed = JSON.parse(arr);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return String(arr).split(',').map(item => item.trim()).filter(Boolean);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAdmin(false);
        setUser(null);
        return;
      }
      const adminData = await adminMe();
      if (adminData && (adminData.role === 'admin' || adminData.is_admin === true)) {
        setIsAdmin(true);
        setUser(adminData);
      } else {
        setIsAdmin(false);
        setUser(null);
      }
    } catch (error) {
      setIsAdmin(false);
      setUser(null);
    }
  };

  const fetchReviewCount = async (productId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/users/product/${productId}/reviews`);
      let reviewsData = [];
      if (Array.isArray(response.data)) {
        reviewsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        reviewsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.reviews)) {
        reviewsData = response.data.reviews;
      } else if (response.data && typeof response.data === 'object') {
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          reviewsData = possibleArrays[0];
        }
      }
      setReviewCount(reviewsData.length);
    } catch (error) {
      setReviewCount(0);
    }
  };

  const fetchRelatedProducts = async (categoryId: number, currentProductId: string) => {
    setRelatedProductsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/admin/products`);
      let productsData: Product[] = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }
      const filteredProducts = productsData
        .filter(p => {
          const isSameCategory = p.category_id === categoryId;
          const isNotCurrent = p.id?.toString() !== currentProductId;
          return isSameCategory && isNotCurrent;
        })
        .slice(0, 8);
      setRelatedProducts(filteredProducts);
    } catch (error) {
      setRelatedProducts([]);
    } finally {
      setRelatedProductsLoading(false);
    }
  };

const parseAndSetProductData = (productData: Product) => {
  // Parse highlights
  if (productData.highlights) {
    if (typeof productData.highlights === "string") {
      try {
        productData.highlights = JSON.parse(productData.highlights);
      } catch {
        productData.highlights = productData.highlights.split(",").map((h: string) => h.trim());
      }
    }
  } else {
    productData.highlights = [];
  }

  // ✅ FIXED: Parse specifications from pipe-separated string
  if (productData.specifications) {
    if (typeof productData.specifications === "string") {
      // Try JSON parse first
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch {
        // If not JSON, parse pipe-separated format
        const specsObj: { [key: string]: string } = {};
        const parts = productData.specifications.split('|').map(item => item.trim());

        parts.forEach(part => {
          const [key, ...valueParts] = part.split(':');
          if (key && valueParts.length > 0) {
            specsObj[key.trim()] = valueParts.join(':').trim();
          }
        });

        productData.specifications = specsObj;
      }
    }
  } else {
    productData.specifications = {};
  }

  productData.colors = parseStringArray(productData.colors);
  productData.sizes = parseStringArray(productData.sizes);

  if (productData.images_by_color) {
    try {
      const parsed = JSON.parse(productData.images_by_color);
      if (parsed && typeof parsed === "object") {
        setColorImageMap(parsed);
      }
    } catch {}
  }

  if (typeof productData.images === "string") {
    try {
      productData.images = JSON.parse(productData.images);
    } catch {
      productData.images = [productData.images];
    }
  }

  if (!Array.isArray(productData.images)) {
    productData.images = [];
  }

  setProduct(productData);
};


  // Slider functions for related products
  const slideNext = () => {
    if (sliderRef.current) {
      const isMobile = window.innerWidth < 640;
      const maxSlide = isMobile ? relatedProducts.length - 2 : relatedProducts.length - 3;
      setCurrentSlide((prev) => Math.min(prev + 1, maxSlide));
    }
  };

  const slidePrev = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    if (sliderRef.current) {
      const isMobile = window.innerWidth < 640;
      const slideWidth = sliderRef.current.offsetWidth / (isMobile ? 2 : 3);
      sliderRef.current.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    }
  }, [currentSlide]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomContainerRef.current || !imageRef.current || !isZoomed || selectedMedia !== "image") return;
    const container = zoomContainerRef.current;
    const { left, top, width, height } = container.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setZoomPosition({ x, y });
    imageRef.current.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    imageRef.current.style.transform = `scale(${zoomLevel})`;
  };

  const handleMouseMoveHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomContainerRef.current || !imageRef.current || selectedMedia !== "image" || !isHoverZoom) return;
    const container = zoomContainerRef.current;
    const { left, top, width, height } = container.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setZoomPosition({ x, y });
    imageRef.current.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    imageRef.current.style.transform = `scale(2)`;
  };

  const handleMouseEnter = () => {
    if (selectedMedia === "image") {
      setIsHoverZoom(true);
    }
  };

  const handleMouseLeave = () => {
    if (selectedMedia === "image") {
      setIsHoverZoom(false);
      if (imageRef.current) {
        imageRef.current.style.transform = "scale(1)";
      }
    }
  };

  const resetZoom = () => {
    if (selectedMedia !== "image") return;
    setZoomLevel(1);
    setIsZoomed(false);
    setIsHoverZoom(false);
    if (imageRef.current) {
      imageRef.current.style.transform = "scale(1)";
    }
  };

  const handleZoomIn = () => {
    if (selectedMedia !== "image") return;
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
    setIsZoomed(true);
    setIsHoverZoom(false);
  };

  const handleZoomOut = () => {
    if (selectedMedia !== "image") return;
    const newZoom = Math.max(zoomLevel - 0.5, 1);
    setZoomLevel(newZoom);
    if (newZoom === 1) {
      setIsZoomed(false);
    }
  };

  const toggleFullZoom = () => {
    if (selectedMedia !== "image") return;
    if (zoomLevel === 3) {
      resetZoom();
    } else {
      setZoomLevel(3);
      setIsZoomed(true);
      setIsHoverZoom(false);
    }
  };

  const handleMediaSelect = (type: "image" | "video" | "pdf", index?: number) => {
    setSelectedMedia(type);
    if (type === "image" && index !== undefined) {
      setSelectedImage(index);
      resetZoom();
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (!product) return;
    const image = colorImageMap[color];
    if (image) {
      const index = product.images.findIndex(img => img === image);
      if (index !== -1) {
        handleMediaSelect("image", index);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedColor && product.colors.length > 0) {
      toast({ title: "Select color", description: "Choose a color to continue." });
      return;
    }
    if (!selectedSize && product.sizes.length > 0) {
      toast({ title: "Select size", description: "Choose a size to continue." });
      return;
    }
    addToCart(product, quantity, selectedColor, selectedSize);
    toast({ title: "Added to cart" });
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!selectedColor && product.colors.length > 0) {
      toast({ title: "Select color", description: "Choose a color to continue." });
      return;
    }
    if (!selectedSize && product.sizes.length > 0) {
      toast({ title: "Select size", description: "Choose a size to continue." });
      return;
    }
    addToCart(product, quantity, selectedColor, selectedSize);
    navigate("/cart");
  };

  const handleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast({ title: "Removed from wishlist" });
    } else {
      addToWishlist(product.id);
      toast({ title: "Added to wishlist" });
    }
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

  const outOfStock = Number(product?.in_stock ?? 0) <= 0;

  // Product video source (supports both `video` and `video_url` fields); render-only derivation
  const productVideo = product?.video || product?.video_url || null;

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <div className="flex items-center">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f-${i}`} className="w-4 h-4 fill-gold text-gold" />
        ))}
        {half && <StarHalf className="w-4 h-4 fill-gold text-gold" />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e-${i}`} className="w-4 h-4 text-border" />
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get<Product>(`${BASE_URL}/admin/product/${id}`);
        const productData = res.data;
        parseAndSetProductData(productData);
        if (id) {
          await fetchReviewCount(id);
          if (productData.category_id) {
            await fetchRelatedProducts(productData.category_id, id);
          }
        }
      } catch (error) {
        toast({ title: "Error!", description: "Failed to load product.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    checkAdminStatus();
  }, [id]);

  if (loading) {
    return (
      <div className="container px-4 py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-sand rounded-sm w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12">
            <div>
              <div className="aspect-[3/4] bg-sand rounded-sm"></div>
              <div className="mt-3 flex gap-2.5">
                <div className="w-[74px] aspect-[3/4] bg-sand rounded-sm"></div>
                <div className="w-[74px] aspect-[3/4] bg-sand rounded-sm"></div>
                <div className="w-[74px] aspect-[3/4] bg-sand rounded-sm"></div>
                <div className="w-[74px] aspect-[3/4] bg-sand rounded-sm"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-3 bg-sand rounded-sm w-1/3"></div>
              <div className="h-9 bg-sand rounded-sm w-3/4"></div>
              <div className="h-4 bg-sand rounded-sm w-1/2"></div>
              <div className="h-16 bg-sand rounded-sm"></div>
              <div className="h-11 bg-sand rounded-sm w-2/3"></div>
              <div className="h-12 bg-sand rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container px-4 py-12 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Products
          </Link>
        </Button>
      </div>
    );
  }

return (
  <div className="container px-4 py-6 pb-28 lg:pb-6">
    {/* Breadcrumb */}
    <div className="mb-6">
      <nav className="flex items-center text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <Link to="/" className="hover:text-espresso transition-colors">Home</Link>
        <span aria-hidden className="mx-2 text-[8px] leading-none text-gold">◆</span>
        <Link to="/products" className="hover:text-espresso transition-colors">Products</Link>
        <span aria-hidden className="mx-2 text-[8px] leading-none text-gold">◆</span>
        <Link to={`/category/${product.category}`} className="hover:text-espresso transition-colors capitalize">
          {product.category}
        </Link>
        <span aria-hidden className="mx-2 text-[8px] leading-none text-gold">◆</span>
        <span className="text-espresso font-medium truncate max-w-xs">{product.name}</span>
      </nav>
    </div>

    {/* Main product layout */}
    <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12">
      {/* Left Column — Gallery */}
      <div>
        {/* Main media stage */}
        <div
          ref={zoomContainerRef}
          className="relative aspect-[3/4] bg-sand overflow-hidden rounded-sm"
          onMouseMove={isZoomed ? handleMouseMove : handleMouseMoveHover}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={isZoomed ? resetZoom : handleMouseLeave}
        >
          {/* Inner gold hairline frame */}
          <span aria-hidden className="pointer-events-none absolute inset-2.5 z-10 border border-gold/55" />

          {outOfStock && (
            <div className="absolute top-3.5 left-3.5 z-10">
              <span className="inline-block bg-espresso text-ivory px-2.5 py-1 rounded-[2px] text-[10px] font-semibold uppercase tracking-[0.12em]">
                Out of Stock
              </span>
            </div>
          )}

          {selectedMedia === "image" && (
            <div className="absolute top-3.5 right-3.5 z-10 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-[3px] border border-border bg-white/90 backdrop-blur-sm shadow-none hover:bg-white"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-[3px] border border-border bg-white/90 backdrop-blur-sm shadow-none hover:bg-white"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-[3px] border border-border bg-white/90 backdrop-blur-sm shadow-none hover:bg-white"
                onClick={toggleFullZoom}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          {selectedMedia === "image" && product.images.length > 0 && (
            <>
              <img
                ref={imageRef}
                src={getMediaUrl(product.images[selectedImage]) || "/no-image.svg"}
                alt={product.name}
                className="h-full w-full object-contain transition-transform duration-150 cursor-zoom-in"
                style={{
                  transform: isZoomed ? `scale(${zoomLevel})` : isHoverZoom ? "scale(2)" : "scale(1)",
                  transformOrigin: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`,
                  cursor: isZoomed ? 'move' : 'zoom-in'
                }}
                onError={(e) => { e.currentTarget.src = "/no-image.svg"; }}
              />
              {isZoomed && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                  {zoomLevel.toFixed(1)}x
                </div>
              )}
              {!isZoomed && (
                <span className="pointer-events-none absolute bottom-3.5 right-3.5 z-10 hidden lg:inline-block bg-espresso/75 text-ivory text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 rounded-[2px]">
                  Hover to zoom
                </span>
              )}
            </>
          )}

          {selectedMedia === "video" && productVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-espresso">
              <video
                ref={videoRef}
                src={getMediaUrl(productVideo)}
                controls
                playsInline
                className="max-w-full max-h-full"
                poster={(product.images.length > 0 && getMediaUrl(product.images[0])) || "/video-poster.svg"}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {selectedMedia === "pdf" && product.pdf && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ivory p-6">
              <div className="w-32 h-32 bg-sand rounded-full flex items-center justify-center mb-6">
                <FileText className="w-16 h-16 text-muted-foreground" />
              </div>
              <p className="text-espresso font-medium mb-4">Product Documentation</p>
              <Button
                onClick={() => {
                  const url = getMediaUrl(product.pdf);
                  window.open(url, '_blank');
                }}
                className="bg-maroon hover:bg-terracotta text-ivory uppercase tracking-[0.16em] text-xs rounded-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}

          {selectedMedia === "image" && product.images.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-sand">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}
        </div>

        {/* Thumbnail filmstrip */}
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {product.images.map((image, index) => (
            <button
              key={index}
              className={`w-[74px] flex-none aspect-[3/4] overflow-hidden bg-sand border transition-colors ${
                selectedMedia === "image" && selectedImage === index
                  ? "border-gold ring-1 ring-gold"
                  : "border-border hover:border-espresso/40"
              }`}
              onClick={() => handleMediaSelect("image", index)}
            >
              <img
                src={getMediaUrl(image) || "/no-image.svg"}
                alt={`${product.name} ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = "/no-image.svg"; }}
              />
            </button>
          ))}

          {productVideo && (
            <button
              className={`relative w-[74px] flex-none aspect-[3/4] overflow-hidden bg-sand border transition-colors ${
                selectedMedia === "video"
                  ? "border-gold ring-1 ring-gold"
                  : "border-border hover:border-espresso/40"
              }`}
              onClick={() => handleMediaSelect("video")}
              aria-label="Play product video"
            >
              {product.images.length > 0 && (
                <img
                  src={getMediaUrl(product.images[0]) || "/no-image.svg"}
                  alt={`${product.name} video`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = "/no-image.svg"; }}
                />
              )}
              <span className="absolute inset-0 z-[2] flex items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ivory/95">
                  <Play className="h-3.5 w-3.5 translate-x-[1px] fill-maroon text-maroon" />
                </span>
              </span>
            </button>
          )}

          {product.pdf && (
            <button
              className={`w-[74px] flex-none aspect-[3/4] bg-white flex items-center justify-center border transition-colors ${
                selectedMedia === "pdf"
                  ? "border-gold ring-1 ring-gold"
                  : "border-border hover:border-espresso/40"
              }`}
              onClick={() => handleMediaSelect("pdf")}
            >
              <FileText className="w-6 h-6 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Right Column — Product Info */}
      <div>
        <div className="lg:sticky lg:top-6">
          {/* Category overline + stock status */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#8A6414]">
              {product.category || "Vastraliya"}
            </span>
            <span
              className={`whitespace-nowrap text-[11px] uppercase tracking-[0.1em] ${
                outOfStock ? "text-sale" : "text-[#3E6B4F]"
              }`}
            >
              {outOfStock ? "Out of Stock" : "● In Stock"}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-[33px] font-medium leading-tight text-espresso mt-1.5">
            {product.name}
          </h1>

          {/* Rating row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted-foreground">
            {renderStars(Number(product.rating || 0))}
            <span>{Number(product.rating || 0).toFixed(1)}</span>
            <span aria-hidden className="text-border">·</span>
            <a
              href="#reviews"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-maroon underline underline-offset-[3px] transition-colors hover:text-terracotta"
            >
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </a>
            {product.sku && (
              <>
                <span aria-hidden className="text-border">·</span>
                <span>SKU {product.sku}</span>
              </>
            )}
          </div>

          {/* Price panel */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3 rounded-sm border border-border bg-blush/55 px-4 py-3.5">
            <span className="font-serif text-[29px] font-medium leading-none text-espresso">
              {product.discount_price ? formatPrice(product.discount_price) : formatPrice(product.price)}
            </span>
            {product.discount_price && (
              <>
                <span className="text-[15px] text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-[12.5px] font-semibold text-sale">
                  ({Math.round(((product.price - product.discount_price) / product.price) * 100)}% off)
                </span>
              </>
            )}
            <span className="ml-auto text-[11px] text-muted-foreground">Inclusive of all taxes</span>
          </div>

          {/* Gold ornament divider */}
          <div aria-hidden className="mt-4 flex items-center gap-2.5">
            <span className="h-px w-11 bg-gold/60" />
            <span className="h-[7px] w-[7px] rotate-45 border border-gold" />
            <span className="h-px w-11 bg-gold/60" />
          </div>

          {/* Colour */}
          {product.colors.length > 0 && (
            <div>
              <div className="mt-4 mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-espresso">
                <span>Colour</span>
                {selectedColor && (
                  <span className="font-normal normal-case tracking-normal text-xs text-muted-foreground">
                    {selectedColor}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`h-11 w-11 rounded-[3px] border border-border transition-all ${
                      selectedColor === color
                        ? "outline outline-2 outline-gold outline-offset-2"
                        : "hover:border-espresso/40"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes.length > 0 && (
            <div>
              <div className="mt-4 mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-espresso">
                <span>Size</span>
                <button className="font-medium normal-case tracking-[0.02em] text-xs text-maroon underline underline-offset-[3px] whitespace-nowrap">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[44px] h-10 px-3 inline-flex items-center justify-center rounded-[3px] border text-[13px] transition-colors ${
                      selectedSize === size
                        ? "bg-espresso text-ivory border-espresso"
                        : "bg-white text-espresso border-border hover:border-espresso"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <div className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-espresso">Quantity</div>
            <div className="inline-flex rounded-[3px] border border-border bg-white">
              <button
                className="w-[38px] h-10 flex items-center justify-center text-lg text-muted-foreground hover:text-espresso disabled:opacity-50 transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={outOfStock}
              >
                −
              </button>
              <div className="w-[38px] h-10 flex items-center justify-center border-x border-border font-semibold text-espresso">
                {quantity}
              </div>
              <button
                className="w-[38px] h-10 flex items-center justify-center text-lg text-muted-foreground hover:text-espresso disabled:opacity-50 transition-colors"
                onClick={() => setQuantity(Math.min(MAX_QTY_PER_PRODUCT, quantity + 1))}
                disabled={outOfStock || quantity >= MAX_QTY_PER_PRODUCT}
              >
                +
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-5 grid grid-cols-[1fr_1fr_48px_48px] gap-2.5">
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-[3px] bg-maroon text-ivory text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-terracotta disabled:pointer-events-none disabled:opacity-50"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              <ShoppingBag className="hidden sm:block h-4 w-4" strokeWidth={1.6} />
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </button>

            <button
              className="flex h-12 items-center justify-center rounded-[3px] border border-espresso bg-white text-espresso text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-espresso hover:text-ivory disabled:pointer-events-none disabled:opacity-50"
              onClick={handleBuyNow}
              disabled={outOfStock}
            >
              Buy Now
            </button>

            <button
              className="flex h-12 items-center justify-center rounded-[3px] border border-border bg-white transition-colors hover:border-maroon"
              onClick={handleWishlist}
              aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              title={isInWishlist(product.id) ? "Saved" : "Wishlist"}
            >
              <Heart
                className={`h-[18px] w-[18px] transition-colors ${
                  isInWishlist(product.id) ? "fill-maroon text-maroon" : "text-espresso"
                }`}
                strokeWidth={1.6}
              />
            </button>

            <button
              className="flex h-12 items-center justify-center rounded-[3px] border border-border bg-white transition-colors hover:border-maroon"
              aria-label="Share"
              title="Share"
            >
              <Share2 className="h-[18px] w-[18px] text-espresso" strokeWidth={1.6} />
            </button>
          </div>

          {/* Trust strip */}
          <div className="mt-5 grid grid-cols-3 rounded-sm border border-border bg-white divide-x divide-border text-center">
            <div className="px-2 py-3 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
              <span aria-hidden className="block mx-auto mb-1.5 h-[7px] w-[7px] rotate-45 border border-gold" />
              Free shipping ₹999+
            </div>
            <div className="px-2 py-3 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
              <span aria-hidden className="block mx-auto mb-1.5 h-[7px] w-[7px] rotate-45 border border-gold" />
              Easy 7-day returns
            </div>
            <div className="px-2 py-3 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
              <span aria-hidden className="block mx-auto mb-1.5 h-[7px] w-[7px] rotate-45 border border-gold" />
              Premium fabrics
            </div>
          </div>

          {/* Product Details Accordion (one open at a time) */}
          <div className="mt-5 border-t border-border">
            {/* Highlights */}
            <div className="border-b border-border">
              <button
                onClick={() => setActiveTab("highlights")}
                className="flex w-full items-center justify-between py-3.5 text-left font-serif text-[15.5px] text-espresso transition-colors hover:text-maroon"
              >
                Highlights
                <span className="text-[17px] leading-none text-[#8A6414]">{activeTab === "highlights" ? "−" : "+"}</span>
              </button>
              {activeTab === "highlights" && (
                <div className="pb-4 max-h-[400px] overflow-y-auto">
                  {product.highlights?.length ? (
                    <div className="space-y-1.5">
                      {product.highlights.map((h, i) => (
                        <div key={i} className="flex gap-2.5">
                          <span aria-hidden className="mt-2 h-1 w-1 flex-none rounded-full bg-gold" />
                          <span className="text-[13px] leading-relaxed text-muted-foreground">{h}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">No highlights available</p>
                  )}
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="border-b border-border">
              <button
                onClick={() => setActiveTab("specifications")}
                className="flex w-full items-center justify-between py-3.5 text-left font-serif text-[15.5px] text-espresso transition-colors hover:text-maroon"
              >
                Specifications
                <span className="text-[17px] leading-none text-[#8A6414]">{activeTab === "specifications" ? "−" : "+"}</span>
              </button>
              {activeTab === "specifications" && (
                <div className="pb-4 max-h-[400px] overflow-y-auto">
                  {product.specifications && Object.keys(product.specifications).length ? (
                    <div className="border border-border rounded-sm overflow-hidden">
                      {Object.entries(product.specifications).map(([key, value], index) => (
                        <div
                          key={key}
                          className={`grid grid-cols-2 gap-4 px-4 py-2.5 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-sand/30'
                          } ${
                            index !== Object.keys(product.specifications).length - 1
                              ? 'border-b border-border'
                              : ''
                          }`}
                        >
                          <dt className="text-[13px] font-medium text-muted-foreground">{key}</dt>
                          <dd className="text-[13px] text-espresso text-right font-medium">{String(value)}</dd>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">No specifications available</p>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="border-b border-border">
              <button
                onClick={() => setActiveTab("details")}
                className="flex w-full items-center justify-between py-3.5 text-left font-serif text-[15.5px] text-espresso transition-colors hover:text-maroon"
              >
                Details
                <span className="text-[17px] leading-none text-[#8A6414]">{activeTab === "details" ? "−" : "+"}</span>
              </button>
              {activeTab === "details" && (
                <div className="pb-4 max-h-[400px] overflow-y-auto">
                  {product.details ? (
                    <div className="text-[13px] text-muted-foreground whitespace-pre-line leading-relaxed">
                      {product.details}
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">No detailed description available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Watch It Styled — related product reels (design.md §5.11) */}
    <ReelsSection
      id="watch-it-styled"
      placement="pdp"
      productId={id ? Number(id) : undefined}
      title="Watch It Styled"
      overline="Watch & Shop"
    />

    {/* You Might Also Like */}
    <section className="mt-14">
      <div className="text-center">
        <span className="overline-label">Complete the Look</span>
        <h2 className="mt-1.5 font-serif text-2xl md:text-3xl font-medium text-espresso">You Might Also Like</h2>
      </div>

      <div className="mt-7">
        {relatedProductsLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading related products...
            </div>
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="relative">
            <div className="overflow-hidden">
              <div
                ref={sliderRef}
                className="flex gap-4 transition-transform duration-300 ease-in-out"
              >
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="flex-none w-[calc(33.333%-12px)] min-w-[240px] md:min-w-[260px]"
                  >
                    <ProductCard product={relatedProduct} />
                  </div>
                ))}
              </div>
            </div>

            {relatedProducts.length > 3 && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full border border-border bg-white text-espresso shadow-none hover:bg-sand disabled:opacity-50"
                  onClick={slidePrev}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full border border-border bg-white text-espresso shadow-none hover:bg-sand disabled:opacity-50"
                  onClick={slideNext}
                  disabled={currentSlide >= relatedProducts.length - 3}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 border border-border rounded-sm bg-sand/40">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No related products found.</p>
          </div>
        )}
      </div>
    </section>

    {/* Reviews */}
    <section id="reviews" className="mt-14 scroll-mt-24">
      <div className="text-center">
        <span className="overline-label">From Our Customers</span>
        <h2 className="mt-1.5 font-serif text-2xl md:text-3xl font-medium text-espresso">Reviews</h2>
      </div>
      <ReviewSection
        productId={id || ""}
        isAdmin={isAdmin}
        user={user}
        onReviewAdded={() => id && fetchReviewCount(id)}
        initialVisibleCount={10}
        loadMoreCount={10}
      />
    </section>

    {/* Sticky floating reel — appears on scroll-down, hides on scroll-up */}
    <StickyReelVideo
      productId={id ? Number(id) : undefined}
      fallbackVideoUrl={(product as any)?.video || (product as any)?.video_url}
    />

    {/* Sticky mobile add-to-cart bar */}
    <div className="lg:hidden fixed bottom-[53px] md:bottom-0 inset-x-0 z-40 bg-white border-t border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-espresso leading-tight">
            {product.discount_price ? formatPrice(product.discount_price) : formatPrice(product.price)}
          </div>
          {product.discount_price ? (
            <div className="text-[11px] leading-tight whitespace-nowrap">
              <span className="text-muted-foreground line-through">{formatPrice(product.price)}</span>{" "}
              <span className="text-sale font-semibold">
                ({Math.round(((product.price - product.discount_price) / product.price) * 100)}% off)
              </span>
            </div>
          ) : (
            <div className="text-[11px] leading-tight text-muted-foreground">Inclusive of all taxes</div>
          )}
        </div>
        <Button
          className="flex-1 h-11 bg-maroon text-ivory uppercase tracking-[0.16em] text-xs font-medium rounded-sm hover:bg-terracotta"
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  </div>
);

};

export default ProductDetailPage;
