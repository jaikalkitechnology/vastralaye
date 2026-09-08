// EditProductForm.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Upload, X, Image, Video, FileText, Check, Tag, Star, TrendingUp, Package, Sparkles, Info } from "lucide-react";

type ProductType = {
  id: number | string;
  name: string;
  description?: string;
  details?: string | null;
  specifications?: string | null;
  highlights?: string[] | string | null;
  price?: number;
  discount_price?: number | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  colors?: string[] | string;
  sizes?: string[] | string;
  in_stock?: boolean;
  rating?: number | null;
  reviews?: number | null;
  featured?: boolean;
  best_seller?: boolean;
  new_arrival?: boolean;
  images?: string[] | string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  created_at?: string | null;
};

type CategoryType = { id: number; name: string };
type SubcategoryType = { id: number; name: string; category_id?: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductType | null;
  axiosInstance: any;
  categories: CategoryType[];
  subcategories: SubcategoryType[];
  onSaved?: (updated?: ProductType) => void;
  formatAxiosError: (err: any) => { message: string; fields?: Record<string, string> };
  endpoints: { productUpdate: (id: string | number) => string };
  getImageUrl: (path: string) => string;
};

export default function AdminEditProductForm({
  open,
  onOpenChange,
  product,
  axiosInstance,
  categories,
  subcategories,
  onSaved,
  formatAxiosError,
  endpoints,
  getImageUrl,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    details: "",
    specifications: "",
    highlights: "",
    price: "",
    discount_price: "",
    sgst: "",
    cgst: "",
    igst: "",
    category_id: "",
    subcategory_id: "",
    colors: "",
    sizes: "",
    in_stock: true,
    featured: false,
    best_seller: false,
    new_arrival: false,
    images: [] as File[],
    rating: "",
    reviews: "",
    video: null as File | null,
    pdf: null as File | null,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [existingPdf, setExistingPdf] = useState<string | null>(null);
  const [removedExistingVideo, setRemovedExistingVideo] = useState(false);
  const [removedExistingPdf, setRemovedExistingPdf] = useState(false);

  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const idSuffix = useMemo(() => String(product?.id ?? "new"), [product]);

  useEffect(() => {
    if (!product) {
      setForm({
        name: "",
        description: "",
        details: "",
        specifications: "",
        highlights: "",
        price: "",
        discount_price: "",
        sgst: "",
        cgst: "",
        igst: "",
        category_id: "",
        subcategory_id: "",
        colors: "",
        sizes: "",
        in_stock: true,
        featured: false,
        best_seller: false,
        new_arrival: false,
        images: [],
        rating: "",
        reviews: "",
        video: null,
        pdf: null,
      });
      setExistingImages([]);
      setExistingVideo(null);
      setExistingPdf(null);
      setRemovedExistingVideo(false);
      setRemovedExistingPdf(false);
      setLocalPreviews([]);
      if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }
      setSubmitError("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      return;
    }

    let existingImgs: string[] = [];
    if (Array.isArray(product.images)) existingImgs = product.images as string[];
    else if (typeof product.images === "string" && product.images) {
      try {
        const parsed = JSON.parse(product.images);
        existingImgs = Array.isArray(parsed) ? parsed : [product.images as string];
      } catch {
        existingImgs = [product.images as string];
      }
    }

    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      details: (product as any).details ?? "",
      specifications: (product as any).specifications ?? "",
      highlights: Array.isArray((product as any).highlights) ? (product as any).highlights.join(",") : ((product as any).highlights as string) ?? "",
      price: (product.price ?? "").toString(),
      discount_price: (product.discount_price ?? "").toString(),
      sgst: ((product as any).sgst ?? "").toString(),
      cgst: ((product as any).cgst ?? "").toString(),
      igst: ((product as any).igst ?? "").toString(),
      category_id: (product.category_id ?? "").toString(),
      subcategory_id: (product.subcategory_id ?? "").toString(),
      colors: Array.isArray(product.colors) ? (product.colors as string[]).join(",") : ((product.colors as string) ?? ""),
      sizes: Array.isArray(product.sizes) ? (product.sizes as string[]).join(",") : ((product.sizes as string) ?? ""),
      in_stock: product.in_stock ?? true,
      featured: product.featured ?? false,
      best_seller: product.best_seller ?? false,
      new_arrival: product.new_arrival ?? false,
      images: [],
      rating: (product.rating ?? "").toString(),
      reviews: (product.reviews ?? "").toString(),
      video: null,
      pdf: null,
    });

    setExistingImages(existingImgs);
    setExistingVideo((product as any).video_url ?? null);
    setExistingPdf((product as any).pdf_url ?? null);
    setRemovedExistingVideo(false);
    setRemovedExistingPdf(false);
    setLocalPreviews([]);
    if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }
    setSubmitError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }, [product]);

  useEffect(() => {
    return () => {
      localPreviews.forEach((u) => URL.revokeObjectURL(u));
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [localPreviews, videoPreviewUrl]);

  const updateForm = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const onImagesChange = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    updateForm("images", arr);
    localPreviews.forEach((u) => URL.revokeObjectURL(u));
    const previews = arr.map((f) => URL.createObjectURL(f));
    setLocalPreviews(previews);
  };

  const removeLocalPreview = (idx: number) => {
    const copyFiles = [...(form.images as File[])];
    copyFiles.splice(idx, 1);
    updateForm("images", copyFiles);
    const copyPreviews = [...localPreviews];
    URL.revokeObjectURL(copyPreviews[idx]);
    copyPreviews.splice(idx, 1);
    setLocalPreviews(copyPreviews);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeExistingImage = (idx: number) => {
    const copy = [...existingImages];
    copy.splice(idx, 1);
    setExistingImages(copy);
  };

  const onVideoChange = (file: File | null) => {
    if (!file) {
      updateForm("video", null);
      if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be less than 50MB");
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    setRemovedExistingVideo(false);
    updateForm("video", file);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  };

  const removeSelectedVideo = () => {
    updateForm("video", null);
    if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeExistingVideo = () => {
    setExistingVideo(null);
    setRemovedExistingVideo(true);
    if (form.video) {
      if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }
      updateForm("video", null);
    }
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const onPdfChange = (file: File | null) => {
    if (!file) { updateForm("pdf", null); return; }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF must be less than 10MB");
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      return;
    }
    setRemovedExistingPdf(false);
    updateForm("pdf", file);
  };

  const removeSelectedPdf = () => {
    updateForm("pdf", null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const removeExistingPdf = () => {
    setExistingPdf(null);
    setRemovedExistingPdf(true);
    if (form.pdf) updateForm("pdf", null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const toMaybeNumberString = (v: string) => (v === "" ? null : String(Number(v)));
  const toMaybeIntString = (v: string) => {
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return String(Math.trunc(n));
  };
  const nonEmpty = (v: string) => (v?.trim() ? v.trim() : null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!product) return;
    setLoading(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("name", String((form.name || "").trim()));
      fd.append("price", String(Number(form.price || 0)));
      fd.append("category_id", String(Number(form.category_id || 0)));

      const desc = nonEmpty(form.description); if (desc) fd.append("description", desc);
      const details = nonEmpty(form.details); if (details) fd.append("details", details);
      const specs = nonEmpty(form.specifications); if (specs) fd.append("specifications", specs);
      const highlights = nonEmpty(form.highlights); if (highlights) fd.append("highlights", highlights);

      const dp = toMaybeNumberString(form.discount_price); if (dp !== null) fd.append("discount_price", dp);
      const sg = toMaybeNumberString(form.sgst); if (sg !== null) fd.append("sgst", sg);
      const cg = toMaybeNumberString(form.cgst); if (cg !== null) fd.append("cgst", cg);
      const ig = toMaybeNumberString(form.igst); if (ig !== null) fd.append("igst", ig);
      const sub = toMaybeIntString(form.subcategory_id); if (sub !== null) fd.append("subcategory_id", sub);

      const colors = nonEmpty(form.colors); if (colors) fd.append("colors", colors);
      const sizes = nonEmpty(form.sizes); if (sizes) fd.append("sizes", sizes);

      fd.append("in_stock", String(!!form.in_stock));
      fd.append("featured", String(!!form.featured));
      fd.append("best_seller", String(!!form.best_seller));
      fd.append("new_arrival", String(!!form.new_arrival));

      const rating = toMaybeNumberString(form.rating);
      if (rating !== null) fd.append("rating", rating);
      const reviews = toMaybeIntString(form.reviews);
      if (reviews !== null) fd.append("reviews", reviews);

      (form.images || []).forEach((f: File) => fd.append("images", f));

      if (form.video) fd.append("video", form.video as File);
      if (form.pdf) fd.append("pdf", form.pdf as File);

      fd.append("replace_images_json", JSON.stringify(existingImages || []));
      if (removedExistingVideo) fd.append("replace_video", "true");
      if (removedExistingPdf) fd.append("replace_pdf", "true");

      const id = Number(product.id);
      if (!Number.isFinite(id)) throw new Error("Invalid product id");
      const res = await axiosInstance.put(endpoints.productUpdate(id), fd, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: [(d: any) => d],
      });

      if (res?.data) {
        const updated = res.data;
        toast.success("Product updated successfully");
        if (onSaved) onSaved(updated);
      } else {
        toast.success("Product updated");
        if (onSaved) onSaved();
      }
      onOpenChange(false);
    } catch (err: any) {
      const { message } = formatAxiosError(err);
      setSubmitError(message);
      toast.error(message.split("\n")[0] || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const existingImagesLabel = useMemo(() => {
    if (existingImages.length === 0) return null;
    if (existingImages.length === 1) return "1 existing image";
    return `${existingImages.length} existing images`;
  }, [existingImages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 bg-[#F7F4EF]">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-border px-8 py-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-maroon/10 rounded-md">
                <Package className="h-5 w-5 text-maroon" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl md:text-2xl font-medium text-espresso mb-1">Edit Product</DialogTitle>
                <p className="text-muted-foreground text-[13px]">Update product information and media</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="mx-8 mt-6 rounded-md border border-sale/25 border-l-4 border-l-sale bg-sale/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-sale/10 rounded-full flex items-center justify-center">
                  <X className="h-5 w-5 text-sale" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-sale mb-1">Validation Error</h4>
                <p className="text-sm text-sale/90 whitespace-pre-line">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto px-8 pb-6" style={{ maxHeight: 'calc(95vh - 180px)' }}>
          <form onSubmit={submit} className="space-y-6 mt-6">
            {/* Basic Information */}
            <div className="bg-white rounded-md border border-border overflow-hidden">
              <div className="bg-[#FBF8F3] px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-maroon" />
                  <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Basic Information</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>Product Name</span>
                      <span className="text-sale">*</span>
                    </label>
                    <Input 
                      value={form.name} 
                      onChange={(e) => updateForm("name", e.target.value)} 
                      placeholder="Enter product name" 
                      className="h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                      required 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>Category</span>
                      <span className="text-sale">*</span>
                    </label>
                    <select 
                      value={form.category_id} 
                      onChange={(e) => updateForm("category_id", e.target.value)} 
                      className="w-full h-10 border border-border rounded-sm px-3 text-[13px] bg-white focus:outline-none focus:border-maroon transition-colors"
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>Subcategory</span>
                    </label>
                    <select 
                      value={form.subcategory_id} 
                      onChange={(e) => updateForm("subcategory_id", e.target.value)} 
                      className="w-full h-10 border border-border rounded-sm px-3 text-[13px] bg-white focus:outline-none focus:border-maroon transition-colors disabled:bg-sand/40 disabled:cursor-not-allowed"
                      disabled={!form.category_id}
                    >
                      <option value="">Select a subcategory</option>
                      {subcategories.filter(s => !form.category_id || String(s.category_id) === form.category_id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>Price</span>
                      <span className="text-sale">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                      <Input 
                        type="number" 
                        value={form.price} 
                        onChange={(e) => updateForm("price", e.target.value)} 
                        placeholder="0.00" 
                        className="pl-10 h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0" 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>Discount Price</span>
                      <span className="text-[10px] text-muted-foreground font-normal normal-case tracking-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                      <Input
                        type="number"
                        value={form.discount_price}
                        onChange={(e) => updateForm("discount_price", e.target.value)}
                        placeholder="0.00"
                        className="pl-10 h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>SGST (%)</span>
                      <span className="text-[10px] text-muted-foreground font-normal normal-case tracking-normal">(Optional)</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={form.sgst}
                      onChange={(e) => updateForm("sgst", e.target.value)}
                      placeholder="e.g. 2.5"
                      className="h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>IGST (%)</span>
                      <span className="text-[10px] text-muted-foreground font-normal normal-case tracking-normal">(Optional — used in the cart)</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={form.igst}
                      onChange={(e) => updateForm("igst", e.target.value)}
                      placeholder="e.g. 5"
                      className="h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>CGST (%)</span>
                      <span className="text-[10px] text-muted-foreground font-normal normal-case tracking-normal">(Optional)</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={form.cgst}
                      onChange={(e) => updateForm("cgst", e.target.value)}
                      placeholder="e.g. 2.5"
                      className="h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>Sizes</span>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </label>
                    <Input 
                      value={form.sizes} 
                      onChange={(e) => updateForm("sizes", e.target.value)} 
                      placeholder="S, M, L, XL" 
                      className="h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-muted-foreground rounded-full"></span>
                      Separate with commas
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
                      <span>Colors</span>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </label>
                    <Input 
                      value={form.colors} 
                      onChange={(e) => updateForm("colors", e.target.value)} 
                      placeholder="Red, Blue, Green" 
                      className="h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-muted-foreground rounded-full"></span>
                      Separate with commas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-md border border-border overflow-hidden">
              <div className="bg-[#FBF8F3] px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-maroon" />
                  <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Product Description</h3>
                </div>
              </div>
              <div className="p-6">
                <Textarea 
                  rows={5} 
                  value={form.description} 
                  onChange={(e) => updateForm("description", e.target.value)} 
                  placeholder="Write a detailed description of your product..." 
                  className="text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-md border border-border overflow-hidden">
              <div className="bg-[#FBF8F3] px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-maroon" />
                  <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Additional Details</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2 block">Product Details</label>
                    <Textarea 
                      rows={7} 
                      value={form.details} 
                      onChange={(e) => updateForm("details", e.target.value)} 
                      placeholder="• Soft and durable material&#10;• Compact design&#10;• Easy to carry"
                      className="text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0 resize-none font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-2">One detail per line</p>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2 block">Specifications</label>
                    <Textarea 
                      rows={7} 
                      value={form.specifications} 
                      onChange={(e) => updateForm("specifications", e.target.value)} 
                      placeholder="Material: PU Leather&#10;Dimensions: 12 × 3 × 9 cm&#10;Weight: 150g"
                      className="text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0 resize-none font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Format: Key: Value</p>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2 block">Highlights</label>
                    <Textarea 
                      rows={7} 
                      value={form.highlights} 
                      onChange={(e) => updateForm("highlights", e.target.value)} 
                      placeholder="Premium quality, Durable, Stylish design"
                      className="text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Separate with commas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="bg-white rounded-md border border-border overflow-hidden">
              <div className="bg-[#FBF8F3] px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-maroon" />
                    <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Product Images</h3>
                  </div>
                  {existingImagesLabel && (
                    <span className="text-[11px] font-semibold text-muted-foreground bg-espresso/5 px-2.5 py-0.5 rounded-full">
                      {existingImagesLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="border-2 border-dashed border-sand rounded-md p-8 text-center bg-ivory hover:border-gold transition-all cursor-pointer group">
                  <input
                    ref={imageInputRef}
                    id={`image-upload-edit-${idSuffix}`}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onImagesChange(e.target.files)}
                  />
                  <label htmlFor={`image-upload-edit-${idSuffix}`} className="cursor-pointer block">
                    <div className="w-16 h-16 mx-auto mb-4 bg-maroon/10 rounded-full flex items-center justify-center group-hover:bg-maroon/15 transition-colors">
                      <Upload className="w-8 h-8 text-maroon" />
                    </div>
                    <p className="text-base font-semibold text-espresso mb-1">Click to upload images</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB each</p>
                  </label>
                </div>

                {(existingImages.length > 0 || localPreviews.length > 0) && (
                  <div className="mt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {existingImages.map((url, index) => (
                        <div key={`exist-${index}`} className="relative group">
                          <div className="aspect-square bg-[#FBF8F3] rounded-md overflow-hidden border border-border group-hover:border-gold transition-all">
                            <img 
                              src={getImageUrl(url)} 
                              alt={`Product ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button 
                            type="button" 
                            className="absolute -top-2 -right-2 w-7 h-7 bg-sale text-ivory rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-sale/90"
                            onClick={() => removeExistingImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-espresso/70 text-ivory text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm">
                            Existing
                          </div>
                        </div>
                      ))}

                      {localPreviews.map((preview, index) => (
                        <div key={`preview-${index}`} className="relative group">
                          <div className="aspect-square bg-[#FBF8F3] rounded-md overflow-hidden border border-gold">
                            <img 
                              src={preview} 
                              alt={`New ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button 
                            type="button" 
                            className="absolute -top-2 -right-2 w-7 h-7 bg-sale text-ivory rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-sale/90"
                            onClick={() => removeLocalPreview(index)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-maroon text-ivory text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm">
                            New
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video & PDF */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Upload */}
              <div className="bg-white rounded-md border border-border overflow-hidden">
                <div className="bg-[#FBF8F3] px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-maroon" />
                    <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Product Video</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="border-2 border-dashed border-sand rounded-md p-6 text-center bg-ivory hover:border-gold transition-all cursor-pointer group">
                    <input
                      ref={videoInputRef}
                      id={`video-upload-edit-${idSuffix}`}
                      className="hidden"
                      type="file"
                      accept="video/*"
                      onChange={(e) => onVideoChange(e.target.files?.[0] || null)}
                    />
                    <label htmlFor={`video-upload-edit-${idSuffix}`} className="cursor-pointer block">
                      <div className="w-12 h-12 mx-auto mb-3 bg-maroon/10 rounded-full flex items-center justify-center group-hover:bg-maroon/15 transition-colors">
                        <Video className="w-6 h-6 text-maroon" />
                      </div>
                      <p className="text-sm font-semibold text-espresso mb-1">Upload Video</p>
                      <p className="text-xs text-muted-foreground">Max 50MB (MP4, WEBM)</p>
                    </label>
                  </div>

                  {existingVideo && !removedExistingVideo && (
                    <div className="mt-4 p-4 bg-[#FBF8F3] rounded-md border border-border">
                      <p className="text-sm font-medium text-espresso mb-2">Existing Video</p>
                      <video src={getImageUrl(existingVideo)} controls className="w-full rounded-md mb-3" />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        onClick={removeExistingVideo}
                        className="w-full rounded-sm text-sale border-sale/40 hover:bg-sale hover:text-ivory"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove Video
                      </Button>
                    </div>
                  )}

                  {form.video && (
                    <div className="mt-4 p-4 bg-gold/10 rounded-md border border-gold/40">
                      <p className="text-sm font-medium text-espresso mb-2">New Video Selected</p>
                      {videoPreviewUrl ? (
                        <video src={videoPreviewUrl} controls className="w-full rounded-md mb-3" />
                      ) : (
                        <p className="text-sm text-espresso mb-3">{(form.video as File).name}</p>
                      )}
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        onClick={removeSelectedVideo}
                        className="w-full rounded-sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove Selection
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF Upload */}
              <div className="bg-white rounded-md border border-border overflow-hidden">
                <div className="bg-[#FBF8F3] px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-maroon" />
                    <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Product PDF</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="border-2 border-dashed border-sand rounded-md p-6 text-center bg-ivory hover:border-gold transition-all cursor-pointer group">
                    <input 
                      ref={pdfInputRef} 
                      id={`pdf-upload-edit-${idSuffix}`} 
                      className="hidden" 
                      type="file" 
                      accept="application/pdf" 
                      onChange={(e) => onPdfChange(e.target.files?.[0] || null)} 
                    />
                    <label htmlFor={`pdf-upload-edit-${idSuffix}`} className="cursor-pointer block">
                      <div className="w-12 h-12 mx-auto mb-3 bg-maroon/10 rounded-full flex items-center justify-center group-hover:bg-maroon/15 transition-colors">
                        <FileText className="w-6 h-6 text-maroon" />
                      </div>
                      <p className="text-sm font-semibold text-espresso mb-1">Upload PDF</p>
                      <p className="text-xs text-muted-foreground">Max 10MB</p>
                    </label>
                  </div>

                  {existingPdf && !removedExistingPdf && (
                    <div className="mt-4 p-4 bg-[#FBF8F3] rounded-md border border-border">
                      <p className="text-sm font-medium text-espresso mb-2">Existing PDF</p>
                      <a 
                        href={getImageUrl(existingPdf)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm text-maroon underline underline-offset-2 flex items-center gap-1 mb-3"
                      >
                        <FileText className="h-4 w-4" />
                        {existingPdf?.split("/").pop()}
                      </a>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        onClick={removeExistingPdf}
                        className="w-full rounded-sm text-sale border-sale/40 hover:bg-sale hover:text-ivory"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove PDF
                      </Button>
                    </div>
                  )}

                  {form.pdf && (
                    <div className="mt-4 p-4 bg-gold/10 rounded-md border border-gold/40">
                      <p className="text-sm font-medium text-espresso mb-2">New PDF Selected</p>
                      <p className="text-sm text-espresso flex items-center gap-1 mb-3">
                        <FileText className="h-4 w-4" />
                        {(form.pdf as File).name}
                      </p>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        onClick={removeSelectedPdf}
                        className="w-full rounded-sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove Selection
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Flags */}
            <div className="bg-white rounded-md border border-border overflow-hidden">
              <div className="bg-[#FBF8F3] px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-maroon" />
                  <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Product Status</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: "in_stock", label: "In Stock", icon: Package },
                    { key: "featured", label: "Featured", icon: Star },
                    { key: "best_seller", label: "Best Seller", icon: TrendingUp },
                    { key: "new_arrival", label: "New Arrival", icon: Sparkles }
                  ].map(({ key, label, icon: Icon }) => (
                    <label
                      key={key}
                      className={`relative flex items-center gap-3 p-4 rounded-md border transition-all cursor-pointer ${
                        form[key]
                          ? 'bg-maroon/5 border-maroon/40'
                          : 'bg-[#FBF8F3] border-border hover:border-espresso/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!form[key]}
                        onChange={(e) => updateForm(key, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${
                        form[key] ? 'bg-maroon/10' : 'bg-sand'
                      }`}>
                        <Icon className={`h-5 w-5 ${form[key] ? 'text-maroon' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${form[key] ? 'text-espresso' : 'text-muted-foreground'}`}>
                          {label}
                        </p>
                      </div>
                      {form[key] && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-maroon rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-ivory" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="bg-white rounded-md border border-border overflow-hidden">
              <div className="bg-[#FBF8F3] px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-maroon" />
                  <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Ratings & Reviews</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2 block">Rating (0–5)</label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="5" 
                      value={form.rating} 
                      onChange={(e) => updateForm("rating", e.target.value)} 
                      placeholder="4.5" 
                      className="h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2 block">Reviews Count</label>
                    <Input 
                      type="number" 
                      min="0" 
                      step="1" 
                      value={form.reviews} 
                      onChange={(e) => updateForm("reviews", e.target.value)} 
                      placeholder="123" 
                      className="h-10 text-[13px] bg-white rounded-sm border-border focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-border px-8 py-5">
          <DialogFooter className="flex flex-row gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-sm uppercase text-[11px] tracking-[0.12em]"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={loading}
              className="flex-1 h-11 bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-terracotta transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Updating Product...
                </>
              ) : (
                <>
                  <Check className="-ml-1 mr-2 h-4 w-4" />
                  Update Product
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}