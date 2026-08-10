import { Product } from "@/types";
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import {
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  RefreshCw,
  Shield,
  Check,
  Star,
  StarHalf,
  Play,
  FileText,
  Download,
  ArrowLeft,
  Package,
  Tag,
  Info,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { BASE_IMG, BASE_URL } from "@/config";
import ReviewSection from "@/pages/ReviewSection";
import ReelsSection from "@/components/ReelsSection";
import StickyReelVideo from "@/components/StickyReelVideo";
import ProductGrid from "@/components/ProductGrid";
import { adminMe } from "@/api/apihelper";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
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
          <div className="h-6 bg-sand rounded-sm w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-[500px] bg-sand rounded-sm"></div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 bg-sand rounded-sm w-3/4"></div>
              <div className="h-4 bg-sand rounded-sm w-1/2"></div>
              <div className="h-12 bg-sand rounded-sm w-1/4"></div>
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
      <nav className="flex items-center text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
        <Link to="/" className="hover:text-espresso transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 mx-2" />
        <Link to="/products" className="hover:text-espresso transition-colors">Products</Link>
        <ChevronRight className="w-3.5 h-3.5 mx-2" />
        <Link to={`/category/${product.category}`} className="hover:text-espresso transition-colors capitalize">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 mx-2" />
        <span className="text-espresso font-medium truncate max-w-xs">{product.name}</span>
      </nav>
    </div>

    {/* Main product layout */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Gallery (+ Related & Reviews on Desktop) */}
      <div className="lg:col-span-7 space-y-8">
        {/* Gallery Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Thumbnails */}
          <div className="order-2 lg:order-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[480px]">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`flex-shrink-0 w-20 aspect-[3/4] rounded-sm overflow-hidden bg-sand ${
                  selectedMedia === "image" && selectedImage === index
                    ? "border-[1.5px] border-maroon"
                    : "border border-border hover:border-espresso/40"
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
                className={`relative flex-shrink-0 w-20 aspect-[3/4] rounded-sm overflow-hidden bg-sand ${
                  selectedMedia === "video"
                    ? "border-[1.5px] border-maroon"
                    : "border border-border hover:border-espresso/40"
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
                className={`flex-shrink-0 w-20 aspect-[3/4] rounded-sm bg-white flex items-center justify-center ${
                  selectedMedia === "pdf"
                    ? "border-[1.5px] border-maroon"
                    : "border border-border hover:border-espresso/40"
                }`}
                onClick={() => handleMediaSelect("pdf")}
              >
                <FileText className="w-6 h-6 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Main Media Display */}
          <div className="order-1 lg:order-2 flex-1">
            <div 
              ref={zoomContainerRef}
              className="relative bg-sand border border-border rounded-sm overflow-hidden"
              onMouseMove={isZoomed ? handleMouseMove : handleMouseMoveHover}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={isZoomed ? resetZoom : handleMouseLeave}
            >
              {outOfStock && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-espresso text-ivory px-3 py-1 rounded-[1px] text-[11px] uppercase tracking-[0.08em] font-medium hover:bg-espresso">Out of Stock</Badge>
                </div>
              )}

              {selectedMedia === "image" && (
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 backdrop-blur-sm"
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
                    className="w-full h-[480px] object-contain transition-transform duration-150 cursor-zoom-in"
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
                </>
              )}

              {selectedMedia === "video" && productVideo && (
                <div className="w-full h-[480px] flex items-center justify-center bg-espresso">
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
                <div className="w-full h-[480px] flex flex-col items-center justify-center bg-ivory p-6">
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
                <div className="w-full h-[480px] flex flex-col items-center justify-center bg-sand">
                  <Package className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products SLIDER - Desktop Only */}
        <div className="hidden lg:block border-t border-border pt-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="overline-label mb-2">Keep exploring</span>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso">Related Products</h2>
            </div>
            {relatedProducts.length > 0 && (
              <Button variant="ghost" className="text-espresso hover:text-terracotta hover:bg-transparent" asChild>
                <Link to={`/category/${product.category}`}>
                  View All
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>

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
                    <Link
                      key={relatedProduct.id}
                      to={`/product/${relatedProduct.id}`}
                      className="flex-none w-[calc(33.333%-12px)] min-w-[200px] bg-white border border-border rounded-sm overflow-hidden hover:border-espresso/30 transition-colors group"
                    >
                      <div className="relative aspect-square overflow-hidden bg-sand">
                        <img
                          src={getMediaUrl(
                            Array.isArray(relatedProduct.images)
                              ? relatedProduct.images[0]
                              : relatedProduct.images
                          ) || "/no-image.svg"}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.src = "/no-image.svg"; }}
                        />
                        {relatedProduct.discount_price && (
                          <Badge className="absolute top-2 left-2 bg-maroon text-ivory px-2 py-1 text-[11px] font-medium rounded-[1px] hover:bg-maroon">
                            {Math.round(((relatedProduct.price - relatedProduct.discount_price) / relatedProduct.price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-espresso text-sm mb-2 line-clamp-2">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-semibold text-espresso">
                            {relatedProduct.discount_price
                              ? formatPrice(relatedProduct.discount_price)
                              : formatPrice(relatedProduct.price)}
                          </span>
                          {relatedProduct.discount_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(relatedProduct.price)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {renderStars(Number(relatedProduct.rating || 0))}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({Number(relatedProduct.rating || 0).toFixed(1)})
                          </span>
                        </div>
                      </div>
                    </Link>
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

        {/* Customer Reviews Section - Desktop Only */}
        <div className="hidden lg:block">
          <ReviewSection
            productId={id || ""}
            isAdmin={isAdmin}
            user={user}
            onReviewAdded={() => id && fetchReviewCount(id)}
            initialVisibleCount={10}
            loadMoreCount={10}
          />
        </div>
      </div>

      {/* Right Column - Product Info */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-6 space-y-6">
          {/* Product Title & Rating */}
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-medium text-espresso leading-snug mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <div className="flex items-center gap-2">
                {renderStars(Number(product.rating || 0))}
                <span>{Number(product.rating || 0).toFixed(1)}</span>
              </div>
              <span>·</span>
              <span>
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="text-2xl md:text-[26px] font-semibold text-espresso">
                {product.discount_price ? formatPrice(product.discount_price) : formatPrice(product.price)}
              </span>
              {product.discount_price && (
                <>
                  <span className="text-sm md:text-base text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm font-semibold text-sale">
                    ({Math.round(((product.price - product.discount_price) / product.price) * 100)}% off)
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
          </div>

          {/* Product Details Accordion (flat bordered rows, one open at a time) */}
          <div className="border-t border-border">
            {/* Highlights */}
            <div className="border-b border-border">
              <button
                onClick={() => setActiveTab("highlights")}
                className="flex w-full items-center justify-between py-4 px-0.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:text-maroon"
              >
                Highlights
                <span className="text-[15px] font-normal text-gold">{activeTab === "highlights" ? "−" : "+"}</span>
              </button>
              {activeTab === "highlights" && (
                <div className="px-0.5 pb-5 max-h-[400px] overflow-y-auto">
                  {product.highlights?.length ? (
                    <div className="space-y-2.5">
                      {product.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground leading-relaxed">{h}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No highlights available</p>
                  )}
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="border-b border-border">
              <button
                onClick={() => setActiveTab("specifications")}
                className="flex w-full items-center justify-between py-4 px-0.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:text-maroon"
              >
                Specifications
                <span className="text-[15px] font-normal text-gold">{activeTab === "specifications" ? "−" : "+"}</span>
              </button>
              {activeTab === "specifications" && (
                <div className="px-0.5 pb-5 max-h-[400px] overflow-y-auto">
                  {product.specifications && Object.keys(product.specifications).length ? (
                    <div className="border border-border rounded-sm overflow-hidden">
                      {Object.entries(product.specifications).map(([key, value], index) => (
                        <div
                          key={key}
                          className={`grid grid-cols-2 gap-4 px-4 py-3 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-sand/30'
                          } ${
                            index !== Object.keys(product.specifications).length - 1
                              ? 'border-b border-border'
                              : ''
                          }`}
                        >
                          <dt className="text-sm font-medium text-muted-foreground">{key}</dt>
                          <dd className="text-sm text-espresso text-right font-medium">{String(value)}</dd>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specifications available</p>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="border-b border-border">
              <button
                onClick={() => setActiveTab("details")}
                className="flex w-full items-center justify-between py-4 px-0.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:text-maroon"
              >
                Details
                <span className="text-[15px] font-normal text-gold">{activeTab === "details" ? "−" : "+"}</span>
              </button>
              {activeTab === "details" && (
                <div className="px-0.5 pb-5 max-h-[400px] overflow-y-auto">
                  {product.details ? (
                    <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {product.details}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No detailed description available</p>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Stock Status */}
          <div className={`inline-flex items-center gap-2 border px-3 py-2 rounded-sm text-xs uppercase tracking-[0.08em] ${outOfStock ? 'border-sale/30 bg-white text-sale' : 'border-border bg-white text-espresso'}`}>
            {outOfStock ? (
              <>
                <Info className="w-4 h-4" />
                <span className="font-medium">Out of Stock</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-terracotta" />
                <span className="font-medium">In Stock</span>
                <span className="text-muted-foreground normal-case tracking-normal">· Ready to ship</span>
              </>
            )}
          </div>

          {/* Colors, Sizes & Quantity */}
          <div className="space-y-5">
            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.16em] text-espresso mb-2.5">
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
                      className={`relative w-10 h-10 rounded-[1px] border transition-all ${
                        selectedColor === color
                          ? "border-espresso outline outline-2 outline-offset-2 outline-gold"
                          : "border-border hover:border-espresso/40"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                      aria-label={color}
                    >
                      {selectedColor === color && (
                        <Check className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-lg" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.16em] text-espresso mb-2.5">
                  <span>Size</span>
                  <button className="font-normal normal-case tracking-[0.02em] text-xs text-terracotta underline underline-offset-[3px] whitespace-nowrap">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[46px] text-center px-3 py-2.5 text-sm rounded-[1px] border transition-colors ${
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
              <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-espresso mb-2.5">Quantity</div>
              <div className="inline-flex items-center border border-border rounded-[1px] bg-white">
                <button
                  className="w-10 h-11 flex items-center justify-center text-lg text-muted-foreground hover:text-espresso disabled:opacity-50 transition-colors"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={outOfStock}
                >
                  −
                </button>
                <div className="w-12 text-center font-medium text-espresso">
                  {quantity}
                </div>
                <button
                  className="w-10 h-11 flex items-center justify-center text-lg text-muted-foreground hover:text-espresso disabled:opacity-50 transition-colors"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={outOfStock}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 h-[52px] bg-maroon text-ivory uppercase tracking-[0.16em] text-[13px] font-medium rounded-sm hover:bg-terracotta"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className={`h-[52px] w-[52px] p-0 shrink-0 rounded-sm border-espresso bg-transparent hover:bg-blush ${
                isInWishlist(product.id) ? "text-maroon hover:text-maroon" : "text-espresso hover:text-espresso"
              }`}
              onClick={handleWishlist}
              aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              title={isInWishlist(product.id) ? "Saved" : "Wishlist"}
            >
              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-[52px] w-[52px] p-0 shrink-0 rounded-sm border-espresso bg-transparent text-espresso hover:bg-blush hover:text-espresso"
              aria-label="Share"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Trust Row */}
          <div className="grid grid-cols-3 border border-border rounded-sm bg-white divide-x divide-border">
            <div className="flex flex-col items-center gap-1.5 px-2 py-3.5 text-center text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
              <Truck className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
              <span>Cash on delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-2 py-3.5 text-center text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
              <RefreshCw className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
              <span>7-day returns</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-2 py-3.5 text-center text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
              <Shield className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
              <span>Secure payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Related Products - Mobile Only (Bottom) */}
    <div className="lg:hidden mt-8 border-t border-border pt-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="overline-label mb-1.5">Keep exploring</span>
          <h2 className="font-serif text-xl font-medium text-espresso">Related Products</h2>
        </div>
        {relatedProducts.length > 0 && (
          <Button variant="ghost" className="text-espresso hover:text-terracotta hover:bg-transparent text-sm" asChild>
            <Link to={`/category/${product.category}`}>
              All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>

      {relatedProductsLoading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      ) : relatedProducts.length > 0 ? (
        <div className="relative">
          <div className="overflow-hidden -mx-2">
            <div className="grid grid-cols-2 gap-3 px-2">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="bg-white border border-border rounded-sm overflow-hidden hover:border-espresso/30 transition-colors"
                >
                  <div className="relative aspect-square overflow-hidden bg-sand">
                    <img
                      src={getMediaUrl(
                        Array.isArray(relatedProduct.images)
                          ? relatedProduct.images[0]
                          : relatedProduct.images
                      ) || "/no-image.svg"}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/no-image.svg"; }}
                    />
                    {relatedProduct.discount_price && (
                      <Badge className="absolute top-1.5 left-1.5 bg-maroon text-ivory px-1.5 py-0.5 text-[10px] font-medium rounded-[1px] hover:bg-maroon">
                        {Math.round(((relatedProduct.price - relatedProduct.discount_price) / relatedProduct.price) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-espresso text-xs mb-1 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-espresso">
                        {relatedProduct.discount_price
                          ? formatPrice(relatedProduct.discount_price)
                          : formatPrice(relatedProduct.price)}
                      </span>
                      {relatedProduct.discount_price && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatPrice(relatedProduct.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex scale-75 origin-left">
                        {renderStars(Number(relatedProduct.rating || 0))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        ({Number(relatedProduct.rating || 0).toFixed(1)})
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-border rounded-sm bg-sand/40">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No related products found.</p>
        </div>
      )}
    </div>

    {/* Customer Reviews - Mobile Only (Bottom) */}
    <div className="lg:hidden">
      <ReviewSection
        productId={id || ""}
        isAdmin={isAdmin}
        user={user}
        onReviewAdded={() => id && fetchReviewCount(id)}
        initialVisibleCount={5}
        loadMoreCount={5}
      />
    </div>

    {/* Watch It Styled — related product reels (design.md §5.11) */}
    <ReelsSection
      id="watch-it-styled"
      placement="pdp"
      productId={id ? Number(id) : undefined}
      title="Watch It Styled"
      overline="Watch & Shop"
    />

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
