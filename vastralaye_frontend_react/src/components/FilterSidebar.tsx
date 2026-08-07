import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  X, ChevronDown, Filter, Tag, IndianRupee,
  Sparkles, Zap, Star, Package,
} from "lucide-react";
import { Product } from "@/types";
import { BASE_URL } from "@/config";

// ═══════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onFilterChange: (filters: any) => void;
  className?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

const DEFAULT_PRICE: [number, number] = [0, 5000];

// ═══════════════════════════════════════════════
//  FIELD-NAME-SAFE ID EXTRACTORS
//  Handles every possible API field name variant
// ═══════════════════════════════════════════════

const getProductSubcategoryId = (product: Product): string | null => {
  const p = product as any;

  const raw =
    p.subcategory_id ??
    p.sub_category_id ??
    p.subcategoryId ??
    p.sub_categoryId ??
    p.subcategory?.id ??
    p.sub_category?.id ??
    p.subcategory ??
    null;

  if (raw === null || raw === undefined) return null;

  return String(raw);
};

const getProductCategoryId = (product: Product): string | null => {
  const p = product as any;

  const raw =
    p.category_id ??
    p.categoryId ??
    p.category?.id ??
    p.category ??
    null;

  if (raw === null || raw === undefined) return null;

  return String(raw);
};

// ═══════════════════════════════════════════════
//  PRICE RANGE FILTER
// ═══════════════════════════════════════════════

const PriceRangeFilter = ({
  priceRange,
  onPriceRangeChange,
}: {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}) => {
  const [minInput, setMinInput] = useState(priceRange[0].toString());
  const [maxInput, setMaxInput] = useState(priceRange[1].toString());

  const handleInputChange = (type: "min" | "max", value: string) => {
    const numValue = parseInt(value) || 0;
    if (type === "min") {
      setMinInput(value);
      if (numValue <= priceRange[1]) onPriceRangeChange([numValue, priceRange[1]]);
    } else {
      setMaxInput(value);
      if (numValue >= priceRange[0]) onPriceRangeChange([priceRange[0], numValue]);
    }
  };

  const handleBlur = () => {
    let min = parseInt(minInput) || 0;
    let max = parseInt(maxInput) || 5000;
    if (min < 0)    min = 0;
    if (max > 5000) max = 5000;
    if (min > max)  [min, max] = [max, min];
    setMinInput(min.toString());
    setMaxInput(max.toString());
    onPriceRangeChange([min, max]);
  };

  useEffect(() => {
    setMinInput(priceRange[0].toString());
    setMaxInput(priceRange[1].toString());
  }, [priceRange]);

  return (
    <div className="space-y-6">
      {/* Price display row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#E97A48]/10 to-[#E97A48]/20
                          rounded-lg flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-[#E97A48]" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              ₹{priceRange[0]} – ₹{priceRange[1]}
            </div>
            <div className="text-xs text-gray-500">Price range</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPriceRangeChange(DEFAULT_PRICE)}
          className="text-xs text-gray-500 hover:text-[#E97A48]"
        >
          Reset
        </Button>
      </div>

      {/* Slider */}
      <div className="px-2 pt-4">
        <Slider
          min={0}
          max={5000}
          step={100}
          value={priceRange}
          onValueChange={(v) => onPriceRangeChange(v as [number, number])}
          className="[&>span]:bg-[#E97A48] [&>span]:border-[#E97A48]"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>₹0</span>
          <span>₹2500</span>
          <span>₹5000</span>
        </div>
      </div>

      {/* Min / Max inputs */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        {(["min", "max"] as const).map((type) => (
          <div key={type} className="space-y-2">
            <label className="text-xs font-medium text-gray-700 capitalize">
              {type} Price
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg
                            overflow-hidden bg-white">
              <span className="px-3 py-2.5 bg-gray-50 border-r border-gray-300
                               text-gray-600 font-medium">₹</span>
              <input
                type="number"
                value={type === "min" ? minInput : maxInput}
                onChange={(e) => handleInputChange(type, e.target.value)}
                onBlur={handleBlur}
                className="w-full pl-3 pr-3 py-2.5 text-sm focus:outline-none bg-transparent"
                min={0}
                max={5000}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  APPLIED FILTERS BANNER
// ═══════════════════════════════════════════════

const AppliedFilters = ({
  filters,
  onRemove,
  categories,
  subcategories,
}: {
  filters: any;
  onRemove: (type: string, value?: any) => void;
  categories: Category[];
  subcategories: Subcategory[];
}) => {
  const getFilterLabel = useCallback(
    (type: string, value: any): string => {
      switch (type) {
        case "category_id":
          return categories.find((c) => c.id === value)?.name ?? `Category ${value}`;
        case "subcategory_id":
          return subcategories.find((s) => s.id === value)?.name ?? `Subcategory ${value}`;
        case "priceRange":
          return `₹${filters.min_price} – ₹${filters.max_price}`;
        case "in_stock":    return "In Stock Only";
        case "featured":    return "Featured";
        case "best_seller": return "Best Seller";
        case "new_arrival": return "New Arrival";
        default:            return String(value);
      }
    },
    [categories, subcategories, filters],
  );

  const iconMap: Record<string, JSX.Element> = {
    category_id:    <Tag         className="w-3 h-3" />,
    subcategory_id: <Tag         className="w-3 h-3" />,
    priceRange:     <IndianRupee className="w-3 h-3" />,
    in_stock:       <Package     className="w-3 h-3" />,
    featured:       <Sparkles    className="w-3 h-3" />,
    best_seller:    <Star        className="w-3 h-3" />,
    new_arrival:    <Zap         className="w-3 h-3" />,
  };

  const activeFilters: { type: string; value: any }[] = [];
  if (filters.category_id)    activeFilters.push({ type: "category_id",    value: filters.category_id });
  if (filters.subcategory_id) activeFilters.push({ type: "subcategory_id", value: filters.subcategory_id });
  if (
    filters.min_price !== DEFAULT_PRICE[0] ||
    filters.max_price !== DEFAULT_PRICE[1]
  ) activeFilters.push({ type: "priceRange", value: "priceRange" });
  if (filters.in_stock)    activeFilters.push({ type: "in_stock",    value: true });
  if (filters.featured)    activeFilters.push({ type: "featured",    value: true });
  if (filters.best_seller) activeFilters.push({ type: "best_seller", value: true });
  if (filters.new_arrival) activeFilters.push({ type: "new_arrival", value: true });

  if (activeFilters.length === 0) return null;

  return (
    <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-white
                    rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#E97A48]/10 to-[#E97A48]/20
                          rounded-lg flex items-center justify-center">
            <Filter className="w-4 h-4 text-[#E97A48]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Active Filters</h3>
            <p className="text-xs text-gray-500">{activeFilters.length} applied</p>
          </div>
        </div>
        <button
          onClick={() => onRemove("all")}
          className="text-sm font-medium text-[#E97A48] hover:text-[#d86a38]
                     px-3 py-1.5 rounded-lg hover:bg-[#E97A48]/5 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeFilters.map((f, idx) => (
          <div
            key={`${f.type}-${idx}`}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white
                       border border-gray-200 rounded-lg text-sm shadow-sm
                       hover:shadow transition-all"
          >
            <span className="text-[#E97A48]">{iconMap[f.type]}</span>
            <span className="text-gray-800 font-medium">
              {getFilterLabel(f.type, f.value)}
            </span>
            <button
              onClick={() => onRemove(f.type, f.value)}
              className="ml-1 text-gray-400 hover:text-red-500
                         p-0.5 rounded hover:bg-red-50 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  COLLAPSIBLE SECTION
// ═══════════════════════════════════════════════

const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4
                   bg-gradient-to-r from-gray-50 to-white
                   hover:from-gray-100 hover:to-gray-50
                   border border-gray-200 rounded-xl shadow-sm
                   hover:shadow transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 bg-gradient-to-br from-[#5E9F50]/10 to-[#5E9F50]/20
                            rounded-lg flex items-center justify-center
                            group-hover:scale-105 transition-transform">
              <Icon className="w-4 h-4 text-[#5E9F50]" />
            </div>
          )}
          <h3 className="font-semibold text-gray-900 text-left">{title}</h3>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-500 group-hover:text-gray-700
                      transition-transform duration-200
                      ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 px-2 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════
//  MAIN FILTER SIDEBAR
// ═══════════════════════════════════════════════

const FilterSidebar = ({
  isOpen,
  onClose,
  products,
  onFilterChange,
  className,
}: FilterSidebarProps) => {
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [dataReady,     setDataReady]     = useState(false);

  const [filters, setFilters] = useState({
    category_id:    null as number | null,
    subcategory_id: null as number | null,
    min_price:      DEFAULT_PRICE[0] as number,
    max_price:      DEFAULT_PRICE[1] as number,
    in_stock:       null as boolean | null,
    featured:       null as boolean | null,
    best_seller:    null as boolean | null,
    new_arrival:    null as boolean | null,
  });

  // ── Fetch categories + subcategories ──
  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          axios.get(`${BASE_URL}/fronted/products/categories`),
          axios.get(`${BASE_URL}/fronted/products/subcategories`),
        ]);
        setCategories(catRes.data || []);
        setSubcategories(subRes.data || []);
        setDataReady(true);
      } catch (err) {
        console.error("Category load error:", err);
        setCategories([]);
        setSubcategories([]);
      }
    };
    load();
  }, []);

  // ── Debug: runs once when both products + subcategories are ready ──
  useEffect(() => {
    if (!dataReady || products.length === 0 || subcategories.length === 0) return;

    console.group("🔍 FilterSidebar — Subcategory Count Debug");
    const sample = products[0] as any;
    console.log("📦 First product fields:", Object.keys(sample));
    console.log("📦 First product raw:", sample);

    // Find which key holds subcategory info
    const subKey = Object.keys(sample).find((k) =>
      k.toLowerCase().includes("sub"),
    );
    console.log("🔑 Detected sub-key:", subKey ?? "NOT FOUND");

    // All unique subcategory IDs in products
    const uniqueSubIds = [
      ...new Set(products.map((p) => getProductSubcategoryId(p))),
    ];
    console.log("📊 Unique subcategory IDs in products:", uniqueSubIds);
    console.log(
      "📋 Subcategory IDs from API:",
      subcategories.map((s) => ({ id: s.id, name: s.name })),
    );

    // Per-subcategory count
    subcategories.forEach((sub) => {
      const count = products.filter(
        (p) => String(getProductSubcategoryId(p)) === String(sub.id),
      ).length;
      console.log(`  ✅ "${sub.name}" (id=${sub.id}) → ${count} products`);
    });
    console.groupEnd();
  }, [dataReady, products.length, subcategories.length]);

  // ── Notify parent ──
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // ── ✅ FIXED: category count — String comparison to avoid type mismatch ──
  const getCategoryProductCount = useCallback(
    (categoryId: number): number =>
      products.filter(
        (p) => String(getProductCategoryId(p)) === String(categoryId),
      ).length,
    [products],
  );

  // ── ✅ FIXED: subcategory count — String comparison ──
  const getSubcategoryProductCount = useCallback(
    (subcategoryId: number): number =>
      products.filter(
        (p) => String(getProductSubcategoryId(p)) === String(subcategoryId),
      ).length,
    [products],
  );

  // ── Remove one filter or all ──
  const removeFilter = useCallback((type: string) => {
    if (type === "all") {
      setFilters({
        category_id:    null,
        subcategory_id: null,
        min_price:      DEFAULT_PRICE[0],
        max_price:      DEFAULT_PRICE[1],
        in_stock:       null,
        featured:       null,
        best_seller:    null,
        new_arrival:    null,
      });
      return;
    }
    if (type === "priceRange") {
      setFilters((prev) => ({
        ...prev,
        min_price: DEFAULT_PRICE[0],
        max_price: DEFAULT_PRICE[1],
      }));
    } else {
      setFilters((prev) => ({ ...prev, [type]: null }));
    }
  }, []);

  const resetFilters = useCallback(() => removeFilter("all"), [removeFilter]);

  const handleCategoryChange = useCallback((categoryId: number) => {
    setFilters((prev) => ({
      ...prev,
      category_id:    prev.category_id === categoryId ? null : categoryId,
      subcategory_id: null,
    }));
  }, []);

  const handleSubcategoryChange = useCallback((subcategoryId: number) => {
    setFilters((prev) => ({
      ...prev,
      subcategory_id: prev.subcategory_id === subcategoryId ? null : subcategoryId,
    }));
  }, []);

  const quickFilters = [
    { id: "in_stock",    label: "In Stock Only",    icon: Package,  checked: filters.in_stock    === true },
    { id: "featured",    label: "Featured Products", icon: Sparkles, checked: filters.featured    === true },
    { id: "best_seller", label: "Best Sellers",      icon: Star,     checked: filters.best_seller === true },
    { id: "new_arrival", label: "New Arrivals",      icon: Zap,      checked: filters.new_arrival === true },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-80
                  bg-gradient-to-b from-white to-gray-50
                  shadow-xl transition-transform duration-300 ease-out
                  ${isOpen ? "translate-x-0" : "-translate-x-full"}
                  md:sticky md:top-0 md:h-screen md:translate-x-0
                  overflow-y-auto border-r border-gray-200
                  ${className || ""}`}
    >
      {/* Top colour strip */}
      <div className="absolute top-0 left-0 right-0 h-1
                      bg-gradient-to-r from-[#E97A48] via-[#5E9F50] to-[#4F90E8]" />

      <div className="p-6">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E97A48] to-[#E97A48]/80
                              rounded-xl flex items-center justify-center shadow-md">
                <Filter className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#5E9F50] rounded-full
                              border-2 border-white flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{categories.length}</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
              <p className="text-sm text-gray-500 mt-0.5">Refine your search</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden hover:bg-gray-100 rounded-lg"
          >
            <X size={22} className="text-gray-600" />
          </Button>
        </div>

        {/* ── APPLIED FILTERS ── */}
        <AppliedFilters
          filters={filters}
          onRemove={removeFilter}
          categories={categories}
          subcategories={subcategories}
        />

        {/* ── RESET BUTTON ── */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="w-full border-gray-300 text-gray-700 hover:border-gray-400
                       hover:bg-gray-50 py-3 rounded-xl font-medium"
          >
            <X size={16} className="mr-2" />
            Reset All Filters
          </Button>
        </div>

        {/* ── CATEGORIES + SUBCATEGORIES ── */}
        {categories.length > 0 && (
          <CollapsibleSection title="Categories" icon={Tag} defaultOpen>
            <div className="space-y-3">
              {categories.map((cat) => {
                const catCount   = getCategoryProductCount(cat.id);
                const catSubs    = subcategories.filter((s) => s.category_id === cat.id);
                const isSelected = filters.category_id === cat.id;

                return (
                  <div key={cat.id} className="space-y-1">

                    {/* Category row */}
                    <div
                      className={`flex items-center justify-between gap-2 p-3 rounded-lg
                                  transition-colors cursor-pointer select-none
                                  ${isSelected ? "bg-[#5E9F50]/8" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                          id={`cat-${cat.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleCategoryChange(cat.id)}
                          className="data-[state=checked]:bg-[#5E9F50]
                                     data-[state=checked]:border-[#5E9F50]
                                     w-5 h-5 rounded-md flex-shrink-0"
                        />
                        <Label
                          htmlFor={`cat-${cat.id}`}
                          className="cursor-pointer font-semibold text-gray-800 truncate"
                        >
                          {cat.name}
                        </Label>
                      </div>

                      {/* ✅ Category count */}
                      <span
                        className={`flex-shrink-0 text-xs font-bold px-2.5 py-1
                                    rounded-full min-w-[32px] text-center
                                    transition-colors
                                    ${isSelected
                                      ? "bg-[#5E9F50] text-white"
                                      : "bg-gray-100 text-gray-600"}`}
                      >
                        {catCount}
                      </span>
                    </div>

                    {/* ✅ Subcategories — ALWAYS visible (not gated on category selection) */}
                    {catSubs.length > 0 && (
                      <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-0.5 pb-1">
                        {catSubs.map((sub) => {
                          // ✅ String-coerced comparison fixes "0" bug
                          const subCount      = getSubcategoryProductCount(sub.id);
                          const isSubSelected = filters.subcategory_id === sub.id;

                          return (
                            <div
                              key={sub.id}
                              className={`flex items-center justify-between gap-2 p-2.5
                                          rounded-lg transition-colors cursor-pointer select-none
                                          ${isSubSelected
                                            ? "bg-[#5E9F50]/8"
                                            : "hover:bg-gray-50"}`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <Checkbox
                                  id={`sub-${sub.id}`}
                                  checked={isSubSelected}
                                  onCheckedChange={() => handleSubcategoryChange(sub.id)}
                                  className="data-[state=checked]:bg-[#5E9F50]
                                             data-[state=checked]:border-[#5E9F50]
                                             w-4 h-4 flex-shrink-0"
                                />
                                <Label
                                  htmlFor={`sub-${sub.id}`}
                                  className="cursor-pointer text-sm text-gray-700 truncate"
                                >
                                  {sub.name}
                                </Label>
                              </div>

                              {/* ✅ Subcategory count badge — always shows real number */}
                              <span
                                className={`flex-shrink-0 text-xs font-bold px-2 py-0.5
                                            rounded-full min-w-[28px] text-center
                                            transition-colors
                                            ${isSubSelected
                                              ? "bg-[#5E9F50] text-white"
                                              : subCount > 0
                                                ? "bg-gray-100 text-gray-600"
                                                : "bg-gray-50 text-gray-400"}`}
                              >
                                {subCount}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* ── PRICE RANGE ── */}
        <CollapsibleSection title="Price Range" icon={IndianRupee} defaultOpen>
          <PriceRangeFilter
            priceRange={[filters.min_price, filters.max_price]}
            onPriceRangeChange={(r) =>
              setFilters((f) => ({ ...f, min_price: r[0], max_price: r[1] }))
            }
          />
        </CollapsibleSection>

        {/* ── QUICK FILTERS ── */}
        <CollapsibleSection title="Quick Filters" defaultOpen>
          <div className="space-y-2">
            {quickFilters.map((f) => (
              <div
                key={f.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors
                            ${f.checked ? "bg-[#5E9F50]/5" : "hover:bg-gray-50"}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center
                              flex-shrink-0 transition-colors
                              ${f.checked
                                ? "bg-[#5E9F50] text-white"
                                : "bg-gray-100 text-gray-600"}`}
                >
                  <f.icon className="w-4 h-4" />
                </div>
                <Label
                  htmlFor={f.id}
                  className="flex-1 cursor-pointer font-medium text-gray-800"
                >
                  {f.label}
                </Label>
                <Checkbox
                  id={f.id}
                  checked={f.checked}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({
                      ...prev,
                      [f.id]: checked ? true : null,
                    }))
                  }
                  className="data-[state=checked]:bg-[#5E9F50]
                             data-[state=checked]:border-[#5E9F50]"
                />
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── RESULTS COUNT ── */}
        <div className="mt-10 p-5 bg-gradient-to-br from-gray-50 to-white
                        rounded-2xl border border-gray-200 shadow-sm text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16
                          bg-gradient-to-br from-[#E97A48] to-[#E97A48]/80 rounded-full">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {products.length}
            </div>
            <p className="text-sm text-gray-600">Products matching your filters</p>
          </div>
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#E97A48] to-[#E97A48]/90
                       hover:from-[#d86a38] hover:to-[#d86a38]
                       rounded-xl py-3 font-semibold"
          >
            Show Results
          </Button>
        </div>

        {/* Footer note */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Filters update in real-time as you make selections
          </p>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;