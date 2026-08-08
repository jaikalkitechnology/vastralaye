import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IoAdd, IoSearchSharp } from "react-icons/io5";
import { BiPencil, BiTrash } from "react-icons/bi";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { MdImage, MdFolder, MdSubdirectoryArrowRight } from "react-icons/md";
import { HiOutlinePhotograph } from "react-icons/hi";
import { BASE_URL, BASE_IMG } from "@/config";

/* ======================= Types ======================= */
interface Subcategory {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  subcategory_id?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  subcategories?: Subcategory[];
}

/* ======================= Auth helpers ======================= */
const readJSON = (k: string) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readJSONSession = (k: string) => {
  try {
    const raw = sessionStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

/* ======================= Image helpers ======================= */
const buildImageUrl = (imagePath?: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/")) return `${BASE_IMG}${imagePath}`;
  if (imagePath.includes("categories/")) {
    const clean = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${BASE_IMG}${clean}`;
  }
  return `${BASE_IMG}/static/categories/${imagePath}`;
};

const ImageWithFallback: React.FC<{
  src?: string | null;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);
  const url = useMemo(() => buildImageUrl(src), [src]);

  if (failed || !url) {
    return (
      <div className={`bg-sand flex items-center justify-center ${className || ""}`}>
        <HiOutlinePhotograph className="text-muted-foreground h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

/* ======================= Friendly error mapper ======================= */
const friendlyError = (raw: string, status?: number) => {
  const s = (raw || "").toLowerCase();

  if (
    status === 409 ||
    /foreign key|integrity|constraint|cannot delete|parent row|category has|products exist|violates/.test(s)
  ) {
    return "Cannot delete: Please delete associated products first";
  }

  if (/failed to fetch|networkerror|net::err|cors/.test(s)) {
    return "Network error: Please check your connection";
  }

  return raw || "Something went wrong";
};

/* ======================= Component ======================= */
const AdminCategories: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [subcategoryMode, setSubcategoryMode] = useState<"add" | "edit">("add");

  const [catForm, setCatForm] = useState<{
    id: string;
    name: string;
    slug: string;
    image: File | null;
    imagePreview: string | null;
  }>({
    id: "",
    name: "",
    slug: "",
    image: null,
    imagePreview: null,
  });

  const [subForm, setSubForm] = useState<{
    id: string;
    name: string;
    slug: string;
    category_id: string;
  }>({
    id: "",
    name: "",
    slug: "",
    category_id: "",
  });

  /* ========== Fetch categories ========== */
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/admin/cat/list`, { headers });
      const text = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!res.ok) {
        const msg = typeof data === "object" && data && (data as any).detail
          ? (data as any).detail
          : `Failed to fetch: ${res.status} ${res.statusText}`;
        throw new Error(String(msg));
      }

      let categoriesData: Category[] = [];
      if (Array.isArray(data)) {
        categoriesData = data as Category[];
      } else if (data && typeof data === "object" && Array.isArray((data as any).data)) {
        categoriesData = (data as any).data as Category[];
      } else if (data && typeof data === "object" && Array.isArray((data as any).categories)) {
        categoriesData = (data as any).categories as Category[];
      } else {
        categoriesData = [];
      }

      setCategories(categoriesData);
    } catch (err: any) {
      console.error("fetchCategories error:", err);
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  const onCatInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCatForm((s) => ({ ...s, [name]: value }));
  };

  const onCatImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCatForm((s) => ({
      ...s,
      image: file,
      imagePreview: file ? URL.createObjectURL(file) : null,
    }));
  };

  const openAddCategory = () => {
    setCatForm({ id: "", name: "", slug: "", image: null, imagePreview: null });
    setIsAddCategoryOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setCatForm({
      id: String(cat.id),
      name: cat.name,
      slug: cat.slug,
      image: null,
      imagePreview: buildImageUrl(cat.image),
    });
    setIsEditCategoryOpen(true);
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!catForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!catForm.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!catForm.image) {
      toast.error("Image is required for creating a category");
      return;
    }

    setFormLoading(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication required");

      const fd = new FormData();
      fd.append("name", catForm.name.trim());
      fd.append("slug", catForm.slug.trim());
      fd.append("image", catForm.image);

      const res = await fetch(`${BASE_URL}/admin/cat/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        const msg = friendlyError(data?.detail || data?.message || text || `Failed (${res.status})`, res.status);
        throw new Error(String(msg));
      }

      toast.success("Category created successfully!");
      setIsAddCategoryOpen(false);
      setCatForm({ id: "", name: "", slug: "", image: null, imagePreview: null });
      await fetchCategories();
    } catch (err: any) {
      console.error("createCategory error:", err);
      toast.error(friendlyError(err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const updateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!catForm.id) {
      toast.error("Missing category id");
      return;
    }
    if (!catForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!catForm.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setFormLoading(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication required");

      const fd = new FormData();
      fd.append("name", catForm.name.trim());
      fd.append("slug", catForm.slug.trim());
      if (catForm.image) fd.append("image", catForm.image);

      const res = await fetch(`${BASE_URL}/admin/cat/update/${catForm.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        const msg = friendlyError(data?.detail || data?.message || text || `Failed (${res.status})`, res.status);
        throw new Error(String(msg));
      }

      toast.success("Category updated successfully!");
      setIsEditCategoryOpen(false);
      await fetchCategories();
    } catch (err: any) {
      console.error("updateCategory error:", err);
      toast.error(friendlyError(err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) return;

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication required");

      const res = await fetch(`${BASE_URL}/admin/cat/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = text || `Failed (${res.status})`;
        try {
          const j = JSON.parse(text);
          msg = j.detail || j.message || msg;
        } catch {}
        msg = friendlyError(msg, res.status);
        throw new Error(String(msg));
      }

      toast.success("Category deleted successfully!");
      await fetchCategories();
    } catch (err: any) {
      const msg = friendlyError(err?.message || "Failed to delete category");
      console.error("deleteCategory error:", err);
      toast.error(msg);
    }
  };

  const openAddSub = (cat: Category) => {
    setSubcategoryMode("add");
    setSubForm({ id: "", name: "", slug: "", category_id: String(cat.id) });
    setIsSubcategoryDialogOpen(true);
  };

  const openEditSub = (sub: Subcategory) => {
    setSubcategoryMode("edit");
    setSubForm({
      id: String(sub.id),
      name: sub.name,
      slug: sub.slug,
      category_id: String(sub.category_id),
    });
    setIsSubcategoryDialogOpen(true);
  };

  const saveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!subForm.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (subcategoryMode === "add" && !subForm.category_id) {
      toast.error("Category is required");
      return;
    }

    setFormLoading(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication required");

      if (subcategoryMode === "add") {
        const payload = {
          name: subForm.name.trim(),
          slug: subForm.slug.trim(),
          category_id: Number(subForm.category_id),
        };
        const res = await fetch(`${BASE_URL}/admin/cat/subcategory/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        if (!res.ok) {
          let msg = text || `Failed (${res.status})`;
          try {
            const j = JSON.parse(text);
            msg = j.detail || j.message || msg;
          } catch {}
          throw new Error(String(friendlyError(msg, res.status)));
        }
        toast.success("Subcategory created successfully!");
      } else {
        const payload = {
          name: subForm.name.trim(),
          slug: subForm.slug.trim(),
        };
        const res = await fetch(`${BASE_URL}/admin/cat/sub/update/${subForm.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        if (!res.ok) {
          let msg = text || `Failed (${res.status})`;
          try {
            const j = JSON.parse(text);
            msg = j.detail || j.message || msg;
          } catch {}
          throw new Error(String(friendlyError(msg, res.status)));
        }
        toast.success("Subcategory updated successfully!");
      }

      setIsSubcategoryDialogOpen(false);
      setSubForm({ id: "", name: "", slug: "", category_id: "" });
      await fetchCategories();
    } catch (err: any) {
      console.error("saveSubcategory error:", err);
      toast.error(friendlyError(err?.message || "Failed to save subcategory"));
    } finally {
      setFormLoading(false);
    }
  };

  const deleteSubcategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subcategory? This action cannot be undone.")) return;

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication required");

      const res = await fetch(`${BASE_URL}/admin/cat/sub/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = text || `Failed (${res.status})`;
        try {
          const j = JSON.parse(text);
          msg = j.detail || j.message || msg;
        } catch {}
        throw new Error(String(friendlyError(msg, res.status)));
      }

      toast.success("Subcategory deleted successfully!");
      await fetchCategories();
    } catch (err: any) {
      console.error("deleteSubcategory error:", err);
      toast.error(friendlyError(err?.message || "Failed to delete subcategory"));
    }
  };

  /* ======================= UI ======================= */
  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-medium text-espresso">Categories</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              {categories.length} categories · {categories.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0)} subcategories
            </p>
          </div>
          <Button
            onClick={openAddCategory}
            disabled={loading}
            className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta"
          >
            <IoAdd className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <IoSearchSharp className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="bg-white border border-border rounded-md p-16 text-center">
            <div className="w-10 h-10 border-2 border-sand border-t-maroon rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[13px] font-medium text-espresso">Loading categories...</p>
            <p className="text-xs text-muted-foreground mt-1">Please wait a moment</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white border border-border rounded-md p-16 text-center">
            <div className="bg-espresso/5 p-5 rounded-full inline-flex mb-4">
              <MdFolder className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="font-serif text-lg font-medium text-espresso mb-1">
              {categories.length === 0
                ? "No categories yet"
                : "No categories match your search"}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {categories.length === 0
                ? "Get started by creating your first category"
                : "Try adjusting your search terms"}
            </p>
            {categories.length === 0 && (
              <Button onClick={openAddCategory} className="mt-5 bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta">
                <IoAdd className="mr-2 h-4 w-4" /> Create First Category
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="bg-white border border-border rounded-md overflow-hidden flex flex-col">
                <ImageWithFallback
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-24 object-cover"
                />
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-espresso truncate">{cat.name}</h3>
                      <p className="text-[11.5px] text-muted-foreground truncate">/{cat.slug}</p>
                    </div>
                    <div className="flex gap-1.5 flex-none">
                      <button
                        type="button"
                        title="Edit category"
                        onClick={() => openEditCategory(cat)}
                        className="w-7 h-7 border border-border rounded-[5px] inline-flex items-center justify-center text-muted-foreground bg-white hover:text-espresso hover:border-espresso transition-colors"
                      >
                        <BiPencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete category"
                        onClick={() => deleteCategory(cat.id)}
                        className="w-7 h-7 border border-sale/35 rounded-[5px] inline-flex items-center justify-center text-sale bg-white hover:bg-sale/5 transition-colors"
                      >
                        <BiTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategory chips */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(cat.subcategories || []).map((sub) => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-ivory border border-border rounded-full pl-2.5 pr-1 py-0.5"
                      >
                        <button
                          type="button"
                          title="Edit subcategory"
                          onClick={() => openEditSub(sub)}
                          className="hover:text-maroon transition-colors"
                        >
                          {sub.name}
                        </button>
                        <button
                          type="button"
                          title="Delete subcategory"
                          onClick={() => deleteSubcategory(sub.id)}
                          className="w-4 h-4 rounded-full inline-flex items-center justify-center leading-none hover:text-sale hover:bg-sale/10 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      title="Add subcategory"
                      onClick={() => openAddSub(cat)}
                      className="inline-flex items-center gap-1 text-[11px] text-maroon border border-dashed border-maroon/40 rounded-full px-2.5 py-0.5 hover:bg-maroon/5 transition-colors"
                    >
                      <IoAdd className="h-3 w-3" /> Add
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 text-[11.5px] text-muted-foreground">
                    <span className="font-mono">#{cat.id}</span>
                    <span>
                      {cat.subcategories?.length || 0}{" "}
                      {(cat.subcategories?.length || 0) === 1 ? "subcategory" : "subcategories"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-medium text-espresso">Add New Category</DialogTitle>
            <p className="text-[13px] text-muted-foreground">Create a new product category with an image</p>
          </DialogHeader>
          <form onSubmit={createCategory} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                Category Name <span className="text-sale">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={catForm.name}
                onChange={onCatInput}
                placeholder="e.g., Women's Dresses"
                required
                className="h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                Slug <span className="text-sale">*</span>
              </Label>
              <Input
                id="slug"
                name="slug"
                value={catForm.slug}
                onChange={onCatInput}
                placeholder="e.g., womens-dresses"
                required
                className="h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
              />
              <p className="text-xs text-muted-foreground">URL-friendly version (lowercase, hyphens)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                Category Image <span className="text-sale">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={onCatImage}
                  required
                  className="flex-1 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {catForm.imagePreview && (
                <div className="mt-4 p-4 bg-[#FBF8F3] rounded-md border border-border">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-3">Preview:</p>
                  <img
                    src={catForm.imagePreview}
                    alt="preview"
                    className="w-40 h-40 object-cover rounded-md border border-border"
                  />
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCategoryOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-terracotta"
              >
                {formLoading ? (
                  <>
                    <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IoAdd className="h-4 w-4 mr-2" />
                    Create Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-medium text-espresso">Edit Category</DialogTitle>
            <p className="text-[13px] text-muted-foreground">Update category information</p>
          </DialogHeader>
          <form onSubmit={updateCategory} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                Category Name <span className="text-sale">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={catForm.name}
                onChange={onCatInput}
                required
                className="h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                Slug <span className="text-sale">*</span>
              </Label>
              <Input
                id="edit-slug"
                name="slug"
                value={catForm.slug}
                onChange={onCatInput}
                required
                className="h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">Category Image</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={onCatImage}
              />
              {catForm.imagePreview && (
                <div className="mt-4 p-4 bg-[#FBF8F3] rounded-md border border-border">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-3">
                    {catForm.image ? "New Image Preview:" : "Current Image:"}
                  </p>
                  <img
                    src={catForm.imagePreview}
                    alt="current"
                    className="w-40 h-40 object-cover rounded-md border border-border"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">Leave empty to keep the current image</p>
            </div>
            <DialogFooter className="gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditCategoryOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-terracotta"
              >
                {formLoading ? (
                  <>
                    <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <BiPencil className="h-4 w-4 mr-2" />
                    Update Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-medium text-espresso">
              {subcategoryMode === "add" ? "Add Subcategory" : "Edit Subcategory"}
            </DialogTitle>
            <p className="text-[13px] text-muted-foreground">
              {subcategoryMode === "add" ? "Create a new subcategory" : "Update subcategory information"}
            </p>
          </DialogHeader>
          <form onSubmit={saveSubcategory} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="sub-name" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                Subcategory Name <span className="text-sale">*</span>
              </Label>
              <Input
                id="sub-name"
                name="name"
                value={subForm.name}
                onChange={(e) => setSubForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g., Summer Dresses"
                required
                className="h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-slug" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                Slug <span className="text-sale">*</span>
              </Label>
              <Input
                id="sub-slug"
                name="slug"
                value={subForm.slug}
                onChange={(e) => setSubForm((s) => ({ ...s, slug: e.target.value }))}
                placeholder="e.g., summer-dresses"
                required
                className="h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
              />
              <p className="text-xs text-muted-foreground">URL-friendly version (lowercase, hyphens)</p>
            </div>
            {subcategoryMode === "add" && (
              <div className="space-y-2">
                <Label htmlFor="sub-category" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  Parent Category ID <span className="text-sale">*</span>
                </Label>
                <Input
                  id="sub-category"
                  name="category_id"
                  value={subForm.category_id}
                  onChange={(e) => setSubForm((s) => ({ ...s, category_id: e.target.value }))}
                  placeholder="Category ID"
                  required
                  disabled
                  className="h-10 bg-sand/30 rounded-sm border-border text-[13px] font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled from parent category
                </p>
              </div>
            )}
            <DialogFooter className="gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubcategoryDialogOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-terracotta"
              >
                {formLoading ? (
                  <>
                    <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin mr-2" />
                    {subcategoryMode === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    {subcategoryMode === "add" ? (
                      <>
                        <IoAdd className="h-4 w-4 mr-2" />
                        Create Subcategory
                      </>
                    ) : (
                      <>
                        <BiPencil className="h-4 w-4 mr-2" />
                        Update Subcategory
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;