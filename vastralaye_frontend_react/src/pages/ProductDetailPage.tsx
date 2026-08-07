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

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <div className="flex items-center">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
        {half && <StarHalf className="w-4 h-4 fill-amber-400 text-amber-400" />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e-${i}`} className="w-4 h-4 text-gray-300" />
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
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-[500px] bg-gray-200 rounded"></div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-12 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container px-4 py-12 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
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
  <div className="container px-4 py-6">
    {/* Breadcrumb */}
    <div className="mb-6">
      <nav className="flex items-center text-sm text-gray-600">
        <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link to="/products" className="hover:text-gray-900 transition-colors">Products</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link to={`/category/${product.category}`} className="hover:text-gray-900 transition-colors capitalize">
          {product.category}
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
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
                className={`flex-shrink-0 w-20 h-20 border rounded-lg overflow-hidden ${
                  selectedMedia === "image" && selectedImage === index 
                    ? "border-[#E97A48] ring-2 ring-[#E97A48]/20" 
                    : "border-gray-200 hover:border-gray-300"
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

            {product.video && (
              <button
                className={`flex-shrink-0 w-20 h-20 border rounded-lg flex items-center justify-center ${
                  selectedMedia === "video" 
                    ? "border-[#5E9F50] ring-2 ring-[#5E9F50]/20" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleMediaSelect("video")}
              >
                <div className="relative">
                  <Play className="w-6 h-6 text-gray-600" />
                </div>
              </button>
            )}

            {product.pdf && (
              <button
                className={`flex-shrink-0 w-20 h-20 border rounded-lg flex items-center justify-center ${
                  selectedMedia === "pdf" 
                    ? "border-[#E97A48] ring-2 ring-[#E97A48]/20" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleMediaSelect("pdf")}
              >
                <FileText className="w-6 h-6 text-gray-600" />
              </button>
            )}
          </div>

          {/* Main Media Display */}
          <div className="order-1 lg:order-2 flex-1">
            <div 
              ref={zoomContainerRef}
              className="relative bg-white border border-gray-200 rounded-xl overflow-hidden"
              onMouseMove={isZoomed ? handleMouseMove : handleMouseMoveHover}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={isZoomed ? resetZoom : handleMouseLeave}
            >
              {outOfStock && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-red-600 text-white px-3 py-1">Out of Stock</Badge>
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

              {selectedMedia === "video" && product.video && (
                <div className="w-full h-[480px] flex items-center justify-center bg-gray-900">
                  <video
                    ref={videoRef}
                    src={getMediaUrl(product.video)}
                    controls
                    className="max-w-full max-h-full"
                    poster="/video-poster.svg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {selectedMedia === "pdf" && product.pdf && (
                <div className="w-full h-[480px] flex flex-col items-center justify-center bg-gray-50 p-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-16 h-16 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium mb-4">Product Documentation</p>
                  <Button
                    onClick={() => {
                      const url = getMediaUrl(product.pdf);
                      window.open(url, '_blank');
                    }}
                    className="bg-[#5E9F50] hover:bg-[#4d8f40] text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              )}

              {selectedMedia === "image" && product.images.length === 0 && (
                <div className="w-full h-[480px] flex flex-col items-center justify-center bg-gray-50">
                  <Package className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600">No image available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products SLIDER - Desktop Only */}
        <div className="hidden lg:block border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
              <p className="text-gray-600 mt-1">Explore similar items you might like</p>
            </div>
            {relatedProducts.length > 0 && (
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900" asChild>
                <Link to={`/category/${product.category}`}>
                  View All
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
          
          {relatedProductsLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 text-gray-500">
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
                      className="flex-none w-[calc(33.333%-12px)] min-w-[200px] bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={getMediaUrl(
                            Array.isArray(relatedProduct.images) 
                              ? relatedProduct.images[0] 
                              : relatedProduct.images
                          ) || "/no-image.svg"}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.src = "/no-image.svg"; }}
                        />
                        {relatedProduct.discount_price && (
                          <Badge className="absolute top-2 left-2 bg-[#E97A48] text-white px-2 py-1 text-xs">
                            {Math.round(((relatedProduct.price - relatedProduct.discount_price) / relatedProduct.price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {relatedProduct.discount_price 
                              ? formatPrice(relatedProduct.discount_price) 
                              : formatPrice(relatedProduct.price)}
                          </span>
                          {relatedProduct.discount_price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(relatedProduct.price)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {renderStars(Number(relatedProduct.rating || 0))}
                          <span className="text-xs text-gray-600 ml-1">
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full shadow-lg bg-white hover:bg-gray-100 disabled:opacity-50"
                    onClick={slidePrev}
                    disabled={currentSlide === 0}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full shadow-lg bg-white hover:bg-gray-100 disabled:opacity-50"
                    onClick={slideNext}
                    disabled={currentSlide >= relatedProducts.length - 3}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12 border border-gray-200 rounded-xl bg-gray-50">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No related products found.</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {renderStars(Number(product.rating || 0))}
                <span className="text-gray-600 text-sm">
                  {Number(product.rating || 0).toFixed(1)}
                </span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 text-sm">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-bold text-gray-900">
                {product.discount_price ? formatPrice(product.discount_price) : formatPrice(product.price)}
              </span>
              {product.discount_price && (
                <>
                  <span className="text-lg md:text-xl text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <Badge className="bg-[#E97A48] text-white px-2 md:px-3 py-1">
                    <Tag className="w-3 h-3 mr-1" />
                    Save {Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                  </Badge>
                </>
              )}
            </div>
            {product.discount_price && (
              <p className="text-sm text-[#5E9F50] font-medium">
                You save {formatPrice(product.price - product.discount_price)}
              </p>
            )}
          </div>

          {/* Product Details Tabs */}
         <div className="border-t border-gray-200 pt-6">
  {/* Tab Navigation - Pure Tailwind */}
  <div className="border-b border-gray-200">
    <div className="flex space-x-6">
      {(["highlights", "specifications", "details"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`py-3 px-1 border-b-2 font-medium transition-colors text-sm ${
            activeTab === tab 
              ? "border-[#E97A48] text-gray-900" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  </div>

  {/* Tab Content - Pure Tailwind */}
  <div className="py-6 max-h-[400px] overflow-y-auto">
    {/* Highlights Tab - Pure Tailwind */}
    {activeTab === "highlights" && (
      <div className="space-y-3">
        {product.highlights?.length ? (
          product.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Check className="w-4 h-4 text-[#5E9F50] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 leading-relaxed">{h}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Check className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No highlights available</p>
          </div>
        )}
      </div>
    )}

    {/* Specifications Tab - Pure Tailwind */}
    {activeTab === "specifications" && (
      <div>
        {product.specifications && Object.keys(product.specifications).length ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {Object.entries(product.specifications).map(([key, value], index) => (
              <div 
                key={key} 
                className={`grid grid-cols-2 gap-4 px-4 py-3 hover:bg-gray-100 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } ${
                  index !== Object.keys(product.specifications).length - 1 
                    ? 'border-b border-gray-200' 
                    : ''
                }`}
              >
                <dt className="text-sm font-medium text-gray-700">{key}</dt>
                <dd className="text-sm text-gray-900 text-right font-medium">{String(value)}</dd>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500">No specifications available</p>
          </div>
        )}
      </div>
    )}

    {/* Details Tab - Pure Tailwind */}
    {activeTab === "details" && (
      <div>
        {product.details ? (
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {product.details}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <p className="text-sm text-gray-500">No detailed description available</p>
          </div>
        )}
      </div>
    )}
  </div>
</div>


          {/* Stock Status */}
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${outOfStock ? 'bg-red-50 text-red-700' : 'bg-green-50 text-[#5E9F50]'}`}>
            {outOfStock ? (
              <>
                <Info className="w-4 h-4" />
                <span className="font-medium">Out of Stock</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span className="font-medium">In Stock</span>
                <span className="text-sm">• Ready to ship</span>
              </>
            )}
          </div>

          {/* Colors, Sizes & Quantity */}
          <div className="p-4 md:p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:gap-5">
              {/* Colors */}
              {product.colors.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm sm:min-w-[60px]">Color:</h3>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                            selectedColor === color 
                              ? "border-[#E97A48] ring-2 ring-[#E97A48]/30 scale-110" 
                              : "border-gray-300 hover:border-gray-400 hover:scale-105"
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
                    {selectedColor && (
                      <span className="text-xs font-medium text-gray-700 px-3 py-1.5 bg-white rounded-lg border border-gray-300 whitespace-nowrap">
                        {selectedColor}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm sm:min-w-[60px]">Size:</h3>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 md:px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            selectedSize === size 
                              ? "bg-gradient-to-r from-[#5E9F50] to-[#4d8f40] text-white border-[#5E9F50] shadow-md scale-105" 
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <button className="text-xs text-[#E97A48] hover:text-[#d86a38] font-medium underline whitespace-nowrap">
                      Size Guide
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h3 className="font-semibold text-gray-900 text-sm sm:min-w-[60px]">Quantity:</h3>
                  <div className="flex items-center border-2 border-gray-300 rounded-lg bg-white overflow-hidden w-fit">
                    <button
                      className="px-3 md:px-4 py-2 md:py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 transition-colors font-bold text-lg"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={outOfStock}
                    >
                      −
                    </button>
                    <div className="px-4 md:px-6 py-2 md:py-2.5 font-bold text-gray-900 min-w-[50px] md:min-w-[60px] text-center border-x-2 border-gray-300">
                      {quantity}
                    </div>
                    <button
                      className="px-3 md:px-4 py-2 md:py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 transition-colors font-bold text-lg"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={outOfStock}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-[#5E9F50] to-[#4d8f40] hover:from-[#4d8f40] hover:to-[#3d7f30] text-white"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="outline"
                className={`border-gray-300 ${
                  isInWishlist(product.id) 
                    ? "text-[#E97A48] hover:text-[#E97A48] hover:bg-[#E97A48]/5" 
                    : "text-gray-700 hover:text-gray-900"
                }`}
                onClick={handleWishlist}
              >
                <Heart className={`w-5 h-5 mr-2 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                {isInWishlist(product.id) ? "Saved" : "Wishlist"}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:text-gray-900"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-[#5E9F50]/10 to-[#5E9F50]/5 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-[#5E9F50]" />
                </div>
                <span>Free shipping on orders over ₹499</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E97A48]/10 to-[#E97A48]/5 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-[#E97A48]" />
                </div>
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-[#5E9F50]/10 to-[#5E9F50]/5 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#5E9F50]" />
                </div>
                <span>Secure payment & data protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Related Products - Mobile Only (Bottom) */}
    <div className="lg:hidden mt-8 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Related Products</h2>
          <p className="text-sm text-gray-600 mt-1">Explore similar items you might like</p>
        </div>
        {relatedProducts.length > 0 && (
          <Button variant="ghost" className="text-gray-700 hover:text-gray-900 text-sm" asChild>
            <Link to={`/category/${product.category}`}>
              All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
      
      {relatedProductsLoading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-gray-500">
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
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
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
                      <Badge className="absolute top-1.5 left-1.5 bg-[#E97A48] text-white px-1.5 py-0.5 text-[10px]">
                        {Math.round(((relatedProduct.price - relatedProduct.discount_price) / relatedProduct.price) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 text-xs mb-1 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-gray-900">
                        {relatedProduct.discount_price 
                          ? formatPrice(relatedProduct.discount_price) 
                          : formatPrice(relatedProduct.price)}
                      </span>
                      {relatedProduct.discount_price && (
                        <span className="text-[10px] text-gray-500 line-through">
                          {formatPrice(relatedProduct.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex scale-75 origin-left">
                        {renderStars(Number(relatedProduct.rating || 0))}
                      </div>
                      <span className="text-[10px] text-gray-600">
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
        <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
          <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No related products found.</p>
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
  </div>
);

};

export default ProductDetailPage;
