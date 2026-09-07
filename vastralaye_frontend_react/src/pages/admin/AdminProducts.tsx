// AdminProductsPage.tsx - Enhanced Design Version (Fixed Subcategory Issues)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminLoading from '@/components/admin/AdminLoading';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BASE_URL, BASE_IMG } from "@/config";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  X,
  RefreshCw,
  Download,
  ShieldAlert,
  Star,
  Upload,
  FileText,
  Play,
  Check,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Sparkles,
  BarChart3,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminEditProductForm from "./AdminEditProductForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/* ======================== Types ======================== */
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
  category?: string;
  subcategory?: string;
  /** Storefront visibility — false means hidden from every fronted route. */
  is_active?: boolean;
};

type CategoryType = {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  subcategories?: { id: number; name: string; category_id?: number }[];
};

type SubcategoryType = {
  id: number;
  name: string;
  slug?: string;
  category_id?: number;
};

type FilterState = {
  search: string;
  category_id: string;
  subcategory_id: string;
  min_price: string;
  max_price: string;
  in_stock: string;
  featured: string;
  best_seller: string;
  new_arrival: string;
  min_rating: string;
  sizes: string;
  colors: string;
  sort_by: string;
};

/* ======================== Generic list extraction ======================== */
type ListResp<T> =
  | T[]
  | { data: T[] }
  | { categories: T[] }
  | { products: T[] }
  | { subcategories: T[] };

const extractList = <T,>(payload: unknown, keys: (keyof any)[]): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    for (const k of keys) {
      const arr = (payload as any)[k];
      if (Array.isArray(arr)) return arr as T[];
    }
  }
  return [];
};

/* ======================== Error formatting ======================== */
type FieldErrorMap = Record<string, string>;
const formatAxiosError = (err: any): { message: string; fields?: FieldErrorMap } => {
  let fallback = err?.message || "Request failed";
  const data = err?.response?.data;
  if (!data) return { message: fallback };
  if (typeof data === "string") return { message: data };
  if (typeof data.detail === "string") return { message: data.detail };
  if (Array.isArray(data.detail)) {
    const lines: string[] = [];
    const fields: FieldErrorMap = {};
    for (const item of data.detail) {
      const loc = Array.isArray(item.loc) ? item.loc.join(".") : String(item.loc ?? "field");
      const msg = item.msg || item.detail || "Invalid value";
      lines.push(`${loc}: ${msg}`);
      const key = Array.isArray(item.loc) ? String(item.loc[item.loc.length - 1]) : String(item.loc ?? "");
      if (key) fields[key] = msg;
    }
    return { message: lines.join("\n"), fields: Object.keys(fields).length ? fields : undefined };
  }
  if (data.detail && typeof data.detail === "object") {
    const lines: string[] = [];
    const fields: FieldErrorMap = {};
    for (const [k, v] of Object.entries<any>(data.detail)) {
      const msg = Array.isArray(v) ? v.join(", ") : String(v);
      lines.push(`${k}: ${msg}`);
      fields[k] = msg;
    }
    return { message: lines.join("\n"), fields };
  }
  if (data.message) return { message: String(data.message) };
  try { return { message: JSON.stringify(data) }; } catch { return { message: fallback }; }
};

/* ======================== Auth helpers ======================== */
const readJSON = (k: string) => {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; } catch { return null; }
};
const readJSONSession = (k: string) => {
  try { const raw = sessionStorage.getItem(k); return raw ? JSON.parse(raw) : null; } catch { return null; }
};

const getAuthToken = (): string => {
  const direct =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken");
  if (direct) return direct;
  const adminUser = readJSON("adminUser") || readJSONSession("adminUser");
  if (adminUser?.token) return adminUser.token;
  if (adminUser?.access_token) return adminUser.access_token;
  const currentUser = readJSON("currentUser") || readJSONSession("currentUser");
  if (currentUser?.token) return currentUser.token;
  if (currentUser?.access_token) return currentUser.access_token;
  return "";
};

const isAdminUser = (): boolean => {
  const adminUser = readJSON("adminUser") || readJSONSession("adminUser");
  if (adminUser?.role === "admin" || adminUser?.is_admin === true) return true;
  if (adminUser?.user?.role === "admin") return true;
  const currentUser = readJSON("currentUser") || readJSONSession("currentUser");
  if (currentUser?.role === "admin" || currentUser?.is_admin === true) return true;
  if (currentUser?.user?.role === "admin") return true;
  return false;
};

/* ======================== Numeric Coercion ======================== */
const toNumOrNull = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeProduct = (p: any): ProductType => ({
  ...p,
  rating: toNumOrNull(p?.rating),
  reviews: toNumOrNull(p?.reviews),
  price: toNumOrNull(p?.price) ?? undefined,
  discount_price: toNumOrNull(p?.discount_price),
  category_id: toNumOrNull(p?.category_id) ?? undefined,
  subcategory_id: toNumOrNull(p?.subcategory_id) ?? undefined,
});

/* ======================== Status chip (admin_design.md §3.4) ======================== */
const StatusChip = ({ tint, label }: { tint: string; label: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap ${tint}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {label}
  </span>
);

/* ======================== API endpoints ======================== */
const ENDPOINTS = {
  productsList: `${BASE_URL}/admin/products`,
  productCreate: `${BASE_URL}/admin/product/create`,
  productUpdate: (id: string | number) => `${BASE_URL}/admin/product/${id}`,
  productDelete: (id: string | number) => `${BASE_URL}/admin/product/${id}`,
  productVisibility: `${BASE_URL}/admin/products/visibility`,
  productsBulkDelete: `${BASE_URL}/admin/products/bulk-delete`,
  productsExport: `${BASE_URL}/admin/products/export`,
  categoriesList: `${BASE_URL}/admin/cat/list`,
  subcategoriesList: `${BASE_URL}/admin/cat/subcategory/list`,
};

/* ======================== MAIN COMPONENT ======================== */
export default function AdminProductsPage(): JSX.Element {
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [products, setProducts] = useState<ProductType[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryType[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category_id: "",
    subcategory_id: "",
    min_price: "",
    max_price: "",
    in_stock: "all",
    featured: "all",
    best_seller: "all",
    new_arrival: "all",
    min_rating: "",
    sizes: "",
    colors: "",
    sort_by: "newest",
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  /* Storefront visibility: per-row eye toggle plus checkbox selection for
     hiding or showing a whole batch in one call. */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    details: "",
    specifications: "",
    highlights: "",
    price: "",
    discount_price: "",
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

  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | string | null>(null);
  const [submitError, setSubmitError] = useState("");

  /* ========== Auth guard ========== */
  useEffect(() => {
    const hasRole = isAdminUser();
    const token = getAuthToken();
    if (!hasRole || !token) {
      toast.error("Admin access required. Please log in.");
      navigate("/login");
      return;
    }
    setIsAdmin(true);
  }, [navigate]);

  /* ========== Axios instance ========== */
  const axiosInstance = useMemo(() => {
    const inst = axios.create({ timeout: 30000 });
    inst.interceptors.request.use((config) => {
      const t = getAuthToken();
      if (t) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${t}` };
      return config;
    });
    inst.defaults.headers.post = inst.defaults.headers.post || {};
    inst.defaults.headers.put = inst.defaults.headers.put || {};
    delete (inst.defaults.headers.post as any)["Content-Type"];
    delete (inst.defaults.headers.put as any)["Content-Type"];
    return inst;
  }, []);

  /* ═══════════════════════════════════════════════════════════
   *  FIX #1: fetchCategories — gather subcategories from ALL sources
   *  and normalize category_id on every subcategory
   * ═══════════════════════════════════════════════════════════ */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosInstance.get<ListResp<CategoryType>>(ENDPOINTS.categoriesList, {
        headers: { "Cache-Control": "no-cache" },
      });
      const categoriesData = extractList<CategoryType>(res.data, ["data", "categories"]);
      setCategories(categoriesData);

      // ── Collect subcategories from multiple sources ──
      let allSubcategories: SubcategoryType[] = [];

      // Source 1: Dedicated subcategory API
      try {
        const subRes = await axiosInstance.get<ListResp<SubcategoryType>>(ENDPOINTS.subcategoriesList, {
          headers: { "Cache-Control": "no-cache" },
        });
        const apiSubs = extractList<SubcategoryType>(subRes.data, ["data", "subcategories"]);
        allSubcategories = [...apiSubs];
      } catch (subErr) {
        console.warn("Subcategory API failed, falling back to category-embedded subcategories", subErr);
      }

      // Source 2: Subcategories embedded inside each category object
      const embeddedSubs: SubcategoryType[] = [];
      categoriesData.forEach((cat) => {
        if (Array.isArray(cat.subcategories)) {
          cat.subcategories.forEach((sub: any) => {
            embeddedSubs.push({
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              // ✅ FIX: Always set category_id from parent category
              category_id: sub.category_id || cat.id,
            });
          });
        }
      });

      // ── Merge: use a Map keyed by subcategory ID to deduplicate ──
      const subMap = new Map<number, SubcategoryType>();

      // Add embedded first (they always have correct category_id)
      embeddedSubs.forEach((sub) => subMap.set(sub.id, sub));

      // Then overlay API results, but preserve category_id from embedded if API is missing it
      allSubcategories.forEach((sub) => {
        const existing = subMap.get(sub.id);
        subMap.set(sub.id, {
          ...sub,
          // ✅ FIX: If API subcategory has no category_id, use the one from embedded
          category_id: sub.category_id || existing?.category_id,
        });
      });

      const mergedSubcategories = Array.from(subMap.values());

      console.log("📂 Categories loaded:", categoriesData.length);
      console.log("📁 Subcategories loaded:", mergedSubcategories.length);
      console.log("📁 Subcategories detail:", mergedSubcategories.map(s => ({
        id: s.id, name: s.name, category_id: s.category_id
      })));

      setSubcategories(mergedSubcategories);

    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }
      toast.error("Failed to load categories");
      console.error("Category fetch error:", err);
    }
  }, [axiosInstance, navigate]);

  const fetchProducts = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const params: any = { page: currentPage, limit: pageLimit };

      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.category_id && filters.category_id !== "all") params.category_id = parseInt(filters.category_id);
      if (filters.subcategory_id && filters.subcategory_id !== "all") params.subcategory_id = parseInt(filters.subcategory_id);
      if (filters.min_price) params.min_price = parseFloat(filters.min_price);
      if (filters.max_price) params.max_price = parseFloat(filters.max_price);
      if (filters.in_stock !== "all") params.in_stock = filters.in_stock === "true";
      if (filters.featured !== "all") params.featured = filters.featured === "true";
      if (filters.best_seller !== "all") params.best_seller = filters.best_seller === "true";
      if (filters.new_arrival !== "all") params.new_arrival = filters.new_arrival === "true";
      if (filters.min_rating && filters.min_rating !== "all") params.min_rating = parseFloat(filters.min_rating);
      if (filters.sizes.trim()) params.sizes = filters.sizes.trim();
      if (filters.colors.trim()) params.colors = filters.colors.trim();
      if (filters.sort_by && filters.sort_by !== "newest") params.sort_by = filters.sort_by;

      const res = await axiosInstance.get<ListResp<ProductType>>(ENDPOINTS.productsList, {
        params,
        headers: { "Cache-Control": "no-cache" },
      });

      const productsDataRaw = extractList<ProductType>(res.data, ["data", "products"]);
      const productsData = productsDataRaw.map(normalizeProduct);
      setProducts(productsData);

      const apiTotal = (res.data as any)?.total || (res.data as any)?.count || (res.data as any)?.pagination?.total;

      if (apiTotal !== undefined && apiTotal !== null) {
        setTotalProducts(apiTotal);
        setTotalPages(Math.ceil(apiTotal / pageLimit));
      } else {
        if (productsData.length === pageLimit) {
          setTotalProducts(currentPage * pageLimit + 1);
          setTotalPages(currentPage + 1);
        } else {
          setTotalProducts((currentPage - 1) * pageLimit + productsData.length);
          setTotalPages(currentPage);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }
      const { message } = formatAxiosError(err);
      toast.error(`Failed to load products: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, navigate, isAdmin, filters, currentPage, pageLimit]);

  useEffect(() => { if (isAdmin) fetchCategories(); }, [isAdmin, fetchCategories]);

  useEffect(() => {
    if (isAdmin) {
      const debounce = setTimeout(() => fetchProducts(), 300);
      return () => clearTimeout(debounce);
    }
  }, [isAdmin, fetchProducts]);

  useEffect(() => {
    return () => {
      localPreviews.forEach((url) => URL.revokeObjectURL(url));
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [localPreviews, videoPreviewUrl]);

  /* ========== Filter helpers ========== */
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      search: "", category_id: "", subcategory_id: "",
      min_price: "", max_price: "", in_stock: "all",
      featured: "all", best_seller: "all", new_arrival: "all",
      min_rating: "", sizes: "", colors: "", sort_by: "newest",
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search || filters.category_id || filters.subcategory_id ||
      filters.min_price || filters.max_price || filters.in_stock !== "all" ||
      filters.featured !== "all" || filters.best_seller !== "all" ||
      filters.new_arrival !== "all" || filters.min_rating || filters.sizes ||
      filters.colors || filters.sort_by !== "newest"
    );
  }, [filters]);

  /* ═══════════════════════════════════════════════════════════
   *  FIX #2: Subcategory filtering — use Number() comparison
   *  to handle string vs number type mismatches
   * ═══════════════════════════════════════════════════════════ */
  const filteredSubcategoriesForFilter = useMemo(() => {
    if (!filters.category_id || filters.category_id === "all") return subcategories;
    const catId = Number(filters.category_id);
    const filtered = subcategories.filter(sub => Number(sub.category_id) === catId);
    console.log(`🔍 Filter subcategories for category ${catId}:`, filtered.length, "found from", subcategories.length, "total");
    return filtered;
  }, [filters.category_id, subcategories]);

  const filteredSubcategories = useMemo(() => {
    if (!form.category_id) return [];
    const catId = Number(form.category_id);
    const filtered = subcategories.filter(sub => Number(sub.category_id) === catId);
    console.log(`🔍 Form subcategories for category ${catId}:`, filtered.length, "found from", subcategories.length, "total");
    return filtered;
  }, [form.category_id, subcategories]);

  /* ========== Form helpers ========== */
  const updateForm = (name: string, value: any) => setForm((s) => ({ ...s, [name]: value }));

  const onFileChange = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    updateForm("images", arr);
    localPreviews.forEach((url) => URL.revokeObjectURL(url));
    setLocalPreviews(arr.map((f) => URL.createObjectURL(f)));
  };

  const onVideoChange = (file: File | null) => {
    if (!file) {
      updateForm("video", null);
      if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }
      return;
    }
    if (file.size > 50 * 1024 * 1024) { toast.error("Video must be less than 50MB"); return; }
    updateForm("video", file);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const onPdfChange = (file: File | null) => {
    if (!file) { updateForm("pdf", null); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("PDF must be less than 10MB"); return; }
    updateForm("pdf", file);
  };

  const resetForm = () => {
    setForm({
      name: "", description: "", details: "", specifications: "", highlights: "",
      price: "", discount_price: "", category_id: "", subcategory_id: "",
      colors: "", sizes: "", in_stock: true, featured: false, best_seller: false,
      new_arrival: false, images: [], rating: "", reviews: "", video: null, pdf: null,
    });
    setLocalPreviews([]);
    if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }
    setSubmitError("");
  };

  /* ========== Create ========== */
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setSubmitError("");

    try {
      if (!form.name.trim()) { toast.error("Product name is required"); return; }
      if (!form.category_id) { toast.error("Category is required"); return; }
      if (!form.price || Number(form.price) <= 0) { toast.error("Valid price is required"); return; }

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("details", form.details.trim());
      formData.append("specifications", form.specifications.trim());
      formData.append("highlights", form.highlights.trim());
      formData.append("price", form.price);
      formData.append("discount_price", form.discount_price || "0");
      formData.append("category_id", form.category_id);
      formData.append("subcategory_id", form.subcategory_id || "");
      formData.append("colors", form.colors);
      formData.append("sizes", form.sizes);
      formData.append("in_stock", form.in_stock.toString());
      formData.append("featured", form.featured.toString());
      formData.append("best_seller", form.best_seller.toString());
      formData.append("new_arrival", form.new_arrival.toString());
      formData.append("rating", form.rating || "0");
      formData.append("reviews", form.reviews || "0");
      form.images.forEach((image) => formData.append("images", image));
      if (form.video) formData.append("video", form.video);
      if (form.pdf) formData.append("pdf", form.pdf);

      const response = await axiosInstance.post(ENDPOINTS.productCreate, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Product created successfully!");
        setIsCreateOpen(false);
        resetForm();
        await fetchProducts();
      }
    } catch (error: any) {
      const { message } = formatAxiosError(error);
      setSubmitError(message);
      toast.error(`Failed to create product: ${message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const openCreate = () => {
    if (!isAdminUser() || !getAuthToken()) { toast.error("Admin privileges required"); navigate("/login"); return; }
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (p: ProductType) => {
    if (!isAdminUser() || !getAuthToken()) { toast.error("Admin privileges required"); navigate("/login"); return; }
    setEditingProduct(p);
    setIsEditOpen(true);
  };

  /** Hide or show products on the storefront — one id or a selection. */
  const setVisibility = async (ids: number[], isActive: boolean) => {
    if (!isAdminUser() || !getAuthToken()) { toast.error("Admin privileges required"); navigate("/login"); return; }
    if (!ids.length) return;
    setVisibilityBusy(true);
    try {
      const res = await axiosInstance.patch(ENDPOINTS.productVisibility, {
        product_ids: ids,
        is_active: isActive,
      });
      const msg = (res.data as { message?: string })?.message;
      toast.success(msg || (isActive ? "Shown on storefront" : "Hidden from storefront"));
      setProducts(prev =>
        prev.map(p => (ids.includes(Number(p.id)) ? { ...p, is_active: isActive } : p))
      );
      setSelectedIds(new Set());
    } catch (error: any) {
      const { message } = formatAxiosError(error);
      toast.error(`Failed to update visibility: ${message}`);
    } finally {
      setVisibilityBusy(false);
    }
  };

  /** Delete the selection — sold products get archived server-side. */
  const confirmBulkDelete = async () => {
    if (!isAdminUser() || !getAuthToken()) { toast.error("Admin privileges required"); navigate("/login"); return; }
    setBulkDeleteLoading(true);
    try {
      const res = await axiosInstance.post(ENDPOINTS.productsBulkDelete, {
        product_ids: [...selectedIds],
      });
      const data = res.data as { message?: string };
      toast.success(data?.message || "Selection deleted");
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      await fetchProducts();
    } catch (error: any) {
      const { message } = formatAxiosError(error);
      toast.error(`Failed to delete selection: ${message}`);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  /** The whole catalogue as a spreadsheet, saved through the browser. */
  const downloadExcel = async () => {
    if (!isAdminUser() || !getAuthToken()) { toast.error("Admin privileges required"); navigate("/login"); return; }
    setExportLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.productsExport, { responseType: "blob" });
      const dispo = (res.headers?.["content-disposition"] as string | undefined) || "";
      const match = /filename="?([^";]+)/.exec(dispo);
      const name = match ? match[1] : `vastraliya-products-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Product list downloaded");
    } catch (error: any) {
      const { message } = formatAxiosError(error);
      toast.error(`Download failed: ${message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageIds = products.map(p => Number(p.id)).filter(Number.isFinite);
  const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(pageIds));

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    if (!isAdminUser() || !getAuthToken()) { toast.error("Please log in"); navigate("/login"); return; }
    setDeleteLoading(true);
    try {
      const id = Number(deleteTargetId);
      if (!Number.isFinite(id)) throw new Error("Invalid product id");
      const res = await axiosInstance.delete(ENDPOINTS.productDelete(id));
      // A product with order history is archived (hidden from the store),
      // not destroyed — surface the API's explanation instead of claiming
      // a deletion that didn't happen.
      const data = res.data as { archived?: boolean; message?: string } | undefined;
      if (data?.archived) {
        toast.success(data?.message || "Product archived — it appears in past orders.");
      } else {
        toast.success("Product deleted successfully");
      }
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      await fetchProducts();
    } catch (err: any) {
      const { message } = formatAxiosError(err);
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ========== Maps ========== */
  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);
  const subcategoryMap = useMemo(() => Object.fromEntries(subcategories.map((s) => [s.id, s.name])), [subcategories]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_IMG}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  const stats = useMemo(() => {
    const inStock = products.filter(p => p.in_stock).length;
    const featured = products.filter(p => p.featured).length;
    const bestSellers = products.filter(p => p.best_seller).length;
    return { inStock, featured, bestSellers };
  }, [products]);

  /* ========== Guard ========== */
  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ShieldAlert className="h-16 w-16 text-sale mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-medium text-espresso mb-2">Access Denied</h2>
            <p className="text-[13px] text-muted-foreground">Admin privileges required.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ═══════════════════════════════════════════════════════════
   *                         UI
   * ═══════════════════════════════════════════════════════════ */
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-medium text-espresso">Products</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Manage your product catalog</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadExcel} disabled={exportLoading} className="uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm">
              <Download className={`h-4 w-4 mr-2 ${exportLoading ? "animate-bounce" : ""}`} />
              {exportLoading ? "Preparing…" : "Download Excel"}
            </Button>
            <Button variant="outline" onClick={() => { fetchProducts(); fetchCategories(); }} disabled={loading} className="uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
            </Button>
            <Button onClick={openCreate} className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />Add Product
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Total Products", value: totalProducts, icon: Package, tint: "bg-maroon/10 text-maroon" },
            { label: "In Stock", value: stats.inStock, icon: ShoppingBag, tint: "bg-green-700/10 text-green-800" },
            { label: "Featured", value: stats.featured, icon: Star, tint: "bg-gold/15 text-[#8a6414]" },
            { label: "Best Sellers", value: stats.bestSellers, icon: Award, tint: "bg-[#5C6B8A]/10 text-[#5C6B8A]" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-border rounded-md p-5">
              <div className={`w-9 h-9 rounded-md ${s.tint} flex items-center justify-center mb-3`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">{s.label}</p>
              <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-border rounded-md p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-9 h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                  />
                </div>

                {/* ✅ FIX #3: Category filter — reset subcategory when category changes */}
                <Select
                  value={filters.category_id || "all"}
                  onValueChange={(v) => {
                    const newCatId = v === "all" ? "" : v;
                    setFilters((prev) => ({
                      ...prev,
                      category_id: newCatId,
                      subcategory_id: "", // ✅ Always reset subcategory
                    }));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* ✅ FIX #4: Subcategory filter — show count for debugging, handle empty */}
                <Select
                  value={filters.subcategory_id || "all"}
                  onValueChange={(v) => updateFilter("subcategory_id", v === "all" ? "" : v)}
                  disabled={!filters.category_id || filters.category_id === "all"}
                >
                  <SelectTrigger className="h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder={
                      !filters.category_id || filters.category_id === "all"
                        ? "Select category first"
                        : filteredSubcategoriesForFilter.length === 0
                          ? "No subcategories"
                          : "All Subcategories"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Subcategories ({filteredSubcategoriesForFilter.length})
                    </SelectItem>
                    {filteredSubcategoriesForFilter.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id.toString()}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="w-full h-10 rounded-sm text-[12.5px]">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {showAdvancedFilters ? "Hide" : "Show"} Filters
                </Button>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-[#FBF8F3] rounded-md border border-border">
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Min Price (₹)</Label>
                    <Input type="number" placeholder="0" value={filters.min_price} onChange={(e) => updateFilter("min_price", e.target.value)} min="0" step="0.01" className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Max Price (₹)</Label>
                    <Input type="number" placeholder="No limit" value={filters.max_price} onChange={(e) => updateFilter("max_price", e.target.value)} min="0" step="0.01" className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Stock Status</Label>
                    <Select value={filters.in_stock} onValueChange={(v) => updateFilter("in_stock", v)}>
                      <SelectTrigger className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="true">In Stock</SelectItem>
                        <SelectItem value="false">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Min Rating</Label>
                    <Select value={filters.min_rating || "all"} onValueChange={(v) => updateFilter("min_rating", v === "all" ? "" : v)}>
                      <SelectTrigger className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"><SelectValue placeholder="Any rating" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Rating</SelectItem>
                        <SelectItem value="4.5">4.5+ Stars</SelectItem>
                        <SelectItem value="4.0">4.0+ Stars</SelectItem>
                        <SelectItem value="3.5">3.5+ Stars</SelectItem>
                        <SelectItem value="3.0">3.0+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Featured</Label>
                    <Select value={filters.featured} onValueChange={(v) => updateFilter("featured", v)}>
                      <SelectTrigger className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Featured Only</SelectItem>
                        <SelectItem value="false">Non-Featured</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Best Seller</Label>
                    <Select value={filters.best_seller} onValueChange={(v) => updateFilter("best_seller", v)}>
                      <SelectTrigger className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Best Sellers Only</SelectItem>
                        <SelectItem value="false">Non-Best Sellers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">New Arrival</Label>
                    <Select value={filters.new_arrival} onValueChange={(v) => updateFilter("new_arrival", v)}>
                      <SelectTrigger className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">New Arrivals Only</SelectItem>
                        <SelectItem value="false">Older Products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Sort By</Label>
                    <Select value={filters.sort_by} onValueChange={(v) => updateFilter("sort_by", v)}>
                      <SelectTrigger className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="price_low">Price: Low to High</SelectItem>
                        <SelectItem value="price_high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Filter by Sizes</Label>
                    <Input placeholder="e.g., S, M, L" value={filters.sizes} onChange={(e) => updateFilter("sizes", e.target.value)} className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                    <p className="text-xs text-muted-foreground">Comma-separated</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Filter by Colors</Label>
                    <Input placeholder="e.g., Red, Blue" value={filters.colors} onChange={(e) => updateFilter("colors", e.target.value)} className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                    <p className="text-xs text-muted-foreground">Comma-separated</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-[13px] text-muted-foreground">
                  {products.length} product{products.length !== 1 ? "s" : ""} found
                  {hasActiveFilters && <span className="ml-2 text-maroon font-semibold">(filtered)</span>}
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters} className="rounded-sm text-[12px]">
                    <X className="h-4 w-4 mr-1.5" /> Clear All
                  </Button>
                )}
              </div>
            </div>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-border rounded-md overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso">Products Catalog</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-[12.5px] text-muted-foreground font-medium">Per page:</Label>
                  <Select value={pageLimit.toString()} onValueChange={(v) => { setPageLimit(parseInt(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20 h-8 bg-white rounded-sm border-border text-[12.5px] focus:border-maroon focus:ring-0 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="h-8 px-3 text-[12.5px] rounded-[5px] border-border text-espresso hover:bg-[#FBF8F3] hover:text-espresso">
                    <ChevronLeft className="h-4 w-4 mr-1" />Previous
                  </Button>
                  <div className="text-[12.5px] text-muted-foreground font-medium min-w-[100px] text-center">
                    Page {currentPage} {totalPages > 1 ? `of ${totalPages}` : ''}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={products.length < pageLimit || loading} className="h-8 px-3 text-[12.5px] rounded-[5px] border-border text-espresso hover:bg-[#FBF8F3] hover:text-espresso">
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            {selectedIds.size > 0 && (
              <div className="mx-4 mb-3 flex flex-wrap items-center gap-2.5 rounded-sm border border-border bg-[#FBF8F3] px-4 py-2.5">
                <span className="text-[13px] font-semibold text-espresso">{selectedIds.size} selected</span>
                <Button
                  size="sm"
                  onClick={() => setVisibility([...selectedIds], false)}
                  disabled={visibilityBusy}
                  className="h-8 rounded-[5px] bg-espresso px-3 text-[12px] uppercase tracking-[0.08em] text-ivory hover:bg-espresso/85"
                >
                  <EyeOff className="mr-1.5 h-3.5 w-3.5" />Hide from store
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVisibility([...selectedIds], true)}
                  disabled={visibilityBusy}
                  className="h-8 rounded-[5px] border-border px-3 text-[12px] uppercase tracking-[0.08em] text-espresso hover:bg-white"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />Show on store
                </Button>
                <Button
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                  disabled={visibilityBusy || bulkDeleteLoading}
                  className="h-8 rounded-[5px] bg-sale px-3 text-[12px] uppercase tracking-[0.08em] text-ivory hover:bg-sale/90"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete selected
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-auto text-[12px] text-muted-foreground underline underline-offset-2 hover:text-espresso"
                >
                  Clear selection
                </button>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FBF8F3] hover:bg-[#FBF8F3] border-border">
                  <TableHead className="h-auto w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all products on this page"
                      className="h-4 w-4 cursor-pointer accent-maroon"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap">Product</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap">Category</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap text-right">Price</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap">Rating</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap">Stock</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap">Status</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <AdminLoading label="products" />
                    </TableCell>
                  </TableRow>
                ) : products.length > 0 ? (
                  products.map((p) => {
                    const images = Array.isArray(p.images) ? (p.images as string[])
                      : typeof p.images === "string" && p.images
                        ? (() => { try { const parsed = JSON.parse(p.images); return Array.isArray(parsed) ? parsed : [p.images as string]; } catch { return [p.images as string]; } })()
                        : [];
                    const firstImage = images[0];
                    const hasRating = Number.isFinite(Number(p.rating));
                    const ratingValue = hasRating ? Number(p.rating) : null;
                    const hasReviews = Number.isFinite(Number(p.reviews));
                    const reviewsValue = hasReviews ? Number(p.reviews) : null;

                    return (
                      <TableRow
                        key={p.id}
                        className={`hover:bg-[#FBF8F3] border-border transition-colors ${p.is_active === false ? "opacity-60" : ""}`}
                      >
                        <TableCell className="w-10 px-3 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${p.name}`}
                            className="h-4 w-4 cursor-pointer accent-maroon"
                            checked={selectedIds.has(Number(p.id))}
                            onChange={() => toggleSelect(Number(p.id))}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-3 text-[13px]">
                          <div className="flex items-center gap-3">
                            {firstImage ? (
                              <img src={getImageUrl(firstImage)} alt={p.name} className="w-[38px] h-[46px] object-cover rounded border border-border flex-none" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="w-[38px] h-[46px] bg-[#FBF8F3] rounded border border-border flex items-center justify-center flex-none">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-espresso">{p.name}</div>
                              <div className="text-[11.5px] text-muted-foreground">{p.description?.substring(0, 60)}{p.description && p.description.length > 60 ? "..." : ""}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* ✅ FIX #5: Category/Subcategory display — use Number() for map lookup */}
                        <TableCell className="px-3 py-3 text-[13px]">
                          <div className="font-medium text-espresso">
                            {p.category || categoryMap[Number(p.category_id)] || (p.category_id ? `Cat #${p.category_id}` : "N/A")}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {p.subcategory || subcategoryMap[Number(p.subcategory_id)] || ""}
                          </div>
                        </TableCell>

                        <TableCell className="px-3 py-3 text-[13px] text-right">
                          <div className="font-semibold text-espresso">₹{p.price ?? "-"}</div>
                          {p.discount_price && p.discount_price > 0 && <div className="text-[11.5px] text-muted-foreground line-through">₹{p.discount_price}</div>}
                        </TableCell>

                        <TableCell className="px-3 py-3 text-[13px]">
                          {hasRating ? (
                            <div className="flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                              <span className="font-semibold text-espresso">{ratingValue!.toFixed(1)}</span>
                              {hasReviews && <span className="text-[11.5px] text-muted-foreground ml-1">({reviewsValue})</span>}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>

                        <TableCell className="px-3 py-3 text-[13px]">
                          <StatusChip
                            tint={p.in_stock ? "bg-green-700/10 text-green-800" : "bg-sale/10 text-sale"}
                            label={p.in_stock ? "In Stock" : "Out of Stock"}
                          />
                        </TableCell>

                        <TableCell className="px-3 py-3 text-[13px]">
                          <div className="flex gap-1.5 flex-wrap">
                            {p.is_active === false && <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] rounded-[3px] px-1.5 py-0.5 bg-espresso/10 text-espresso">Hidden</span>}
                            {p.featured && <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] rounded-[3px] px-1.5 py-0.5 bg-maroon/10 text-maroon">Featured</span>}
                            {p.best_seller && <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] rounded-[3px] px-1.5 py-0.5 bg-espresso text-ivory">Bestseller</span>}
                            {p.new_arrival && <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] rounded-[3px] px-1.5 py-0.5 bg-gold/20 text-[#8a6414]">New</span>}
                          </div>
                        </TableCell>

                        <TableCell className="px-3 py-3 text-[13px] text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              title={p.is_active === false ? "Show on storefront" : "Hide from storefront"}
                              onClick={() => setVisibility([Number(p.id)], p.is_active === false)}
                              disabled={visibilityBusy}
                              className={`w-7 h-7 border rounded-[5px] inline-flex items-center justify-center bg-white transition-colors disabled:opacity-50 ${
                                p.is_active === false
                                  ? "border-espresso/40 text-espresso hover:bg-espresso/5"
                                  : "border-border text-muted-foreground hover:text-espresso hover:border-espresso"
                              }`}
                            >
                              {p.is_active === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              title="Edit product"
                              onClick={() => openEdit(p)}
                              className="w-7 h-7 border border-border rounded-[5px] inline-flex items-center justify-center text-muted-foreground bg-white hover:text-espresso hover:border-espresso transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="Delete product"
                              onClick={() => { setDeleteTargetId(p.id); setDeleteDialogOpen(true); }}
                              className="w-7 h-7 border border-sale/35 rounded-[5px] inline-flex items-center justify-center text-sale bg-white hover:bg-sale/5 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-espresso/5 rounded-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-espresso font-semibold">{hasActiveFilters ? "No products match your filters" : "No products found"}</p>
                        <p className="text-[13px] text-muted-foreground">{hasActiveFilters ? "Try adjusting your filters" : "Create your first product"}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Bottom Pagination */}
            {products.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-border bg-[#FBF8F3]">
                <div className="text-[12.5px] text-muted-foreground">
                  Showing {((currentPage - 1) * pageLimit) + 1} to {((currentPage - 1) * pageLimit) + products.length}
                  {totalProducts > products.length ? ` of ${totalProducts}+` : ` of ${totalProducts}`} products
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading} className="h-8 w-8 p-0 rounded-[5px] border-border text-espresso bg-white hover:bg-[#FBF8F3] hover:text-espresso"><ChevronsLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="h-8 w-8 p-0 rounded-[5px] border-border text-espresso bg-white hover:bg-[#FBF8F3] hover:text-espresso"><ChevronLeft className="h-4 w-4" /></Button>
                  <div className="flex items-center gap-1.5">
                    {totalPages > 1 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} disabled={loading}
                          className={`w-8 h-8 p-0 text-[12.5px] rounded-[5px] ${currentPage === pageNum ? "bg-maroon text-ivory hover:bg-terracotta" : "border-border text-espresso bg-white hover:bg-[#FBF8F3] hover:text-espresso"}`}>
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={products.length < pageLimit || loading} className="h-8 w-8 p-0 rounded-[5px] border-border text-espresso bg-white hover:bg-[#FBF8F3] hover:text-espresso"><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading || totalPages === 0} className="h-8 w-8 p-0 rounded-[5px] border-border text-espresso bg-white hover:bg-[#FBF8F3] hover:text-espresso"><ChevronsRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Product Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
            <div className="bg-[#FBF8F3] border-b border-border p-6">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl md:text-2xl font-medium text-espresso flex items-center gap-2">
                  <Plus className="h-5 w-5 text-maroon" />Create New Product
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-[13px]">Add a new product to your catalog</DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-6">
              {submitError && (
                <div className="bg-sale/5 border border-sale/30 rounded-md p-4">
                  <p className="text-sale text-sm font-medium">{submitError}</p>
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-maroon" />Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Product Name <span className="text-red-500">*</span></Label>
                    <Input id="name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="Enter product name" required className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>

                  {/* ✅ FIX #6: Create form category — properly reset subcategory */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Category <span className="text-red-500">*</span></Label>
                    <Select
                      value={form.category_id}
                      onValueChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          category_id: value,
                          subcategory_id: "", // ✅ Always reset
                        }));
                      }}
                    >
                      <SelectTrigger className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ✅ FIX #7: Create form subcategory — better UX with count & empty message */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                      Subcategory
                      {form.category_id && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({filteredSubcategories.length} available)
                        </span>
                      )}
                    </Label>
                    <Select
                      value={form.subcategory_id}
                      onValueChange={(value) => updateForm("subcategory_id", value)}
                      disabled={!form.category_id || filteredSubcategories.length === 0}
                    >
                      <SelectTrigger className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <SelectValue placeholder={
                          !form.category_id
                            ? "Select a category first"
                            : filteredSubcategories.length === 0
                              ? "No subcategories for this category"
                              : "Select Subcategory"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                        ))}
                        {filteredSubcategories.length === 0 && form.category_id && (
                          <div className="px-3 py-2 text-sm text-muted-foreground italic">
                            No subcategories found for this category
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Price (₹) <span className="text-red-500">*</span></Label>
                    <Input type="number" step="0.01" value={form.price} onChange={(e) => updateForm("price", e.target.value)} placeholder="0.00" required className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Discount Price (₹)</Label>
                    <Input type="number" step="0.01" value={form.discount_price} onChange={(e) => updateForm("discount_price", e.target.value)} placeholder="0.00" className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Sizes</Label>
                    <Input value={form.sizes} onChange={(e) => updateForm("sizes", e.target.value)} placeholder="S, M, L, XL" className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Colors</Label>
                    <Input value={form.colors} onChange={(e) => updateForm("colors", e.target.value)} placeholder="Red, Blue, Green" className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Product Description</Label>
                  <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Enter detailed product description..." rows={4} className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-maroon" />Additional Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Details</Label>
                    <Textarea value={form.details} onChange={(e) => updateForm("details", e.target.value)} placeholder="Product details..." rows={3} className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Specifications</Label>
                    <Textarea value={form.specifications} onChange={(e) => updateForm("specifications", e.target.value)} placeholder="Technical specifications..." rows={3} className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Highlights</Label>
                    <Textarea value={form.highlights} onChange={(e) => updateForm("highlights", e.target.value)} placeholder="Key highlights, comma-separated..." rows={3} className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div>
                <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso mb-4 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-maroon" />Product Media
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Product Images</Label>
                    <div className="border-2 border-dashed border-sand rounded-md p-8 text-center bg-ivory hover:border-gold transition-colors">
                      <Input type="file" multiple accept="image/*" onChange={(e) => onFileChange(e.target.files)} className="hidden" id="image-upload" />
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-10 w-10 mx-auto mb-3 text-maroon" />
                        <p className="text-sm font-semibold text-espresso mb-1">Click to upload images</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB each</p>
                      </Label>
                    </div>
                    {localPreviews.length > 0 && (
                      <div className="grid grid-cols-5 gap-3 mt-3">
                        {localPreviews.map((preview, i) => <img key={i} src={preview} alt={`Preview ${i + 1}`} className="w-full h-24 object-cover rounded-md border border-border" />)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Product Video</Label>
                    <div className="border-2 border-dashed border-sand rounded-md p-8 text-center bg-ivory hover:border-gold transition-colors">
                      <Input type="file" accept="video/*" onChange={(e) => onVideoChange(e.target.files?.[0] || null)} className="hidden" id="video-upload" />
                      <Label htmlFor="video-upload" className="cursor-pointer">
                        <Play className="h-10 w-10 mx-auto mb-3 text-maroon" />
                        <p className="text-sm font-semibold text-espresso mb-1">Click to upload video</p>
                        <p className="text-xs text-muted-foreground">Max 50MB (MP4, MKV, WEBM)</p>
                      </Label>
                    </div>
                    {videoPreviewUrl && <video src={videoPreviewUrl} controls className="max-w-xs rounded-md border border-border mt-3" />}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Product PDF</Label>
                    <div className="border-2 border-dashed border-sand rounded-md p-8 text-center bg-ivory hover:border-gold transition-colors">
                      <Input type="file" accept=".pdf" onChange={(e) => onPdfChange(e.target.files?.[0] || null)} className="hidden" id="pdf-upload" />
                      <Label htmlFor="pdf-upload" className="cursor-pointer">
                        <FileText className="h-10 w-10 mx-auto mb-3 text-maroon" />
                        <p className="text-sm font-semibold text-espresso mb-1">Click to upload PDF</p>
                        <p className="text-xs text-muted-foreground">Max 10MB</p>
                      </Label>
                    </div>
                    {form.pdf && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-espresso font-medium">
                        <FileText className="h-4 w-4 text-maroon" /><span>{form.pdf.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Flags */}
              <div>
                <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-maroon" />Product Flags
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: "in_stock", label: "In Stock", icon: Package, color: "text-green-800" },
                    { key: "featured", label: "Featured", icon: Star, color: "text-maroon" },
                    { key: "best_seller", label: "Best Seller", icon: Award, color: "text-[#8a6414]" },
                    { key: "new_arrival", label: "New Arrival", icon: Sparkles, color: "text-[#5C6B8A]" },
                  ].map(flag => (
                    <div key={flag.key} className="flex items-center space-x-3 p-3 bg-[#FBF8F3] rounded-md border border-border">
                      <Switch checked={(form as any)[flag.key]} onCheckedChange={(checked) => updateForm(flag.key, checked)} />
                      <Label className={`flex items-center gap-2 text-[13px] font-medium text-espresso cursor-pointer`}>
                        <flag.icon className={`h-4 w-4 ${flag.color}`} />{flag.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratings */}
              <div>
                <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-espresso mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-maroon" />Ratings & Reviews
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Rating (0–5)</Label>
                    <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => updateForm("rating", e.target.value)} placeholder="e.g. 4.5" className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Reviews Count</Label>
                    <Input type="number" value={form.reviews} onChange={(e) => updateForm("reviews", e.target.value)} placeholder="e.g. 123" className="bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1 rounded-sm uppercase text-[11px] tracking-[0.12em]">Cancel</Button>
                <Button type="submit" disabled={formLoading} className="flex-1 bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-terracotta">
                  {formLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Check className="h-4 w-4 mr-2" />Create Product</>}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-xl font-medium text-espresso">
                <Trash2 className="h-5 w-5 text-sale" />Delete Product
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-[13px] text-muted-foreground mb-6">Are you sure? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading} className="bg-sale text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-sale/90">
                  {deleteLoading ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Deleting...</> : <><Trash2 className="h-4 w-4 mr-2" />Delete</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk delete confirmation */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl font-medium text-espresso">
              <Trash2 className="h-5 w-5 text-sale" />Delete {selectedIds.size} selected
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-[13px] text-muted-foreground mb-6">
              Products that appear in past orders are archived (hidden from the
              store) instead of deleted, so order history stays safe. The rest
              are removed permanently — this cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmBulkDelete} disabled={bulkDeleteLoading} className="bg-sale text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-sale/90">
                {bulkDeleteLoading ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Deleting...</> : <><Trash2 className="h-4 w-4 mr-2" />Delete selection</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <AdminEditProductForm
        open={isEditOpen}
        onOpenChange={(val) => { setIsEditOpen(val); if (!val) setEditingProduct(null); }}
        product={editingProduct}
        axiosInstance={axiosInstance}
        categories={categories}
        subcategories={subcategories}
        onSaved={async (updated) => {
          if (updated) setProducts((prev) => prev.map((p) => (String(p.id) === String(updated.id) ? updated : p)));
          await fetchProducts();
          setIsEditOpen(false);
          setEditingProduct(null);
        }}
        formatAxiosError={formatAxiosError}
        endpoints={ENDPOINTS}
        getImageUrl={getImageUrl}
      />
    </AdminLayout>
  );
}