import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  X, ChevronDown,
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

/** Square 15px checkbox — maroon fill when checked (design.md §5.10). */
const checkboxClasses =
  "h-[15px] w-[15px] shrink-0 rounded-[1px] border-border bg-white " +
  "data-[state=checked]:bg-maroon data-[state=checked]:border-maroon " +
  "data-[state=checked]:text-ivory [&_svg]:h-3 [&_svg]:w-3";

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
    <div className="space-y-4">
      {/* Minimal slider — track thin, maroon fill via tokens */}
      <div className="px-1 pt-2">
        <Slider
          min={0}
          max={5000}
          step={100}
          value={priceRange}
          onValueChange={(v) => onPriceRangeChange(v as [number, number])}
          className="[&>span:first-child]:h-[2px] [&>span:first-child]:rounded-none
                     [&>span:first-child]:bg-border
                     [&_[role=slider]]:h-3 [&_[role=slider]]:w-3
                     [&_[role=slider]]:border-2 [&_[role=slider]]:border-maroon
                     [&_[role=slider]]:bg-white"
        />
        <div className="flex justify-between text-[13px] text-muted-foreground mt-3">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      {/* Min / Max inputs */}
      <div className="grid grid-cols-2 gap-3">
        {(["min", "max"] as const).map((type) => (
          <div key={type}>
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-1.5 capitalize">
              {type}
            </label>
            <div className="flex items-center border border-border rounded-sm bg-white
                            focus-within:border-maroon transition-colors">
              <span className="pl-3 pr-1 text-[13px] text-muted-foreground">₹</span>
              <input
                type="number"
                value={type === "min" ? minInput : maxInput}
                onChange={(e) => handleInputChange(type, e.target.value)}
                onBlur={handleBlur}
                className="w-full pr-2 py-2 text-[13px] text-espresso bg-transparent focus:outline-none"
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
//  APPLIED FILTERS — small espresso pills
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
    <div className="pb-4">
      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.map((f, idx) => (
          <button
            key={`${f.type}-${idx}`}
            type="button"
            onClick={() => onRemove(f.type, f.value)}
            className="inline-flex items-center gap-1.5 bg-espresso text-ivory
                       text-[12px] leading-none pl-3 pr-2 py-1.5 rounded-full
                       hover:bg-maroon transition-colors"
          >
            {getFilterLabel(f.type, f.value)}
            <X size={12} aria-hidden="true" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => onRemove("all")}
          className="text-[12px] text-muted-foreground underline underline-offset-4
                     hover:text-espresso transition-colors"
        >
          Clear all
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  COLLAPSIBLE SECTION — flat accordion group
// ═══════════════════════════════════════════════

const CollapsibleSection = ({
  title,
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
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-espresso">
          {title}
        </h3>
        <ChevronDown
          size={15}
          className={`text-gold transition-transform duration-200
                      ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && <div className="pb-5">{children}</div>}
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
        setCategories((catRes.data as Category[]) || []);
        setSubcategories((subRes.data as Subcategory[]) || []);
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
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px]
                  bg-background transition-transform duration-300 ease-out
                  ${isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}
                  lg:sticky lg:top-24 lg:z-0
                  lg:max-h-[calc(100vh-7rem)] lg:translate-x-0 lg:shadow-none
                  lg:bg-transparent overflow-y-auto
                  ${className || ""}`}
    >
      <div className="p-6 lg:p-0">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between pb-5">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-espresso">
            Filter
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12px] text-muted-foreground underline underline-offset-4
                         hover:text-espresso transition-colors"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden text-espresso hover:text-maroon transition-colors"
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── APPLIED FILTERS ── */}
        <AppliedFilters
          filters={filters}
          onRemove={removeFilter}
          categories={categories}
          subcategories={subcategories}
        />

        {/* ── CATEGORIES + SUBCATEGORIES ── */}
        {categories.length > 0 && (
          <CollapsibleSection title="Category" defaultOpen>
            <div className="space-y-2.5">
              {categories.map((cat) => {
                const catCount   = getCategoryProductCount(cat.id);
                const catSubs    = subcategories.filter((s) => s.category_id === cat.id);
                const isSelected = filters.category_id === cat.id;

                return (
                  <div key={cat.id}>

                    {/* Category row */}
                    <div className="flex items-center justify-between gap-2 cursor-pointer select-none">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Checkbox
                          id={`cat-${cat.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleCategoryChange(cat.id)}
                          className={checkboxClasses}
                        />
                        <Label
                          htmlFor={`cat-${cat.id}`}
                          className={`cursor-pointer text-sm truncate font-normal
                                      ${isSelected
                                        ? "text-espresso font-medium"
                                        : "text-muted-foreground hover:text-espresso"}`}
                        >
                          {cat.name}
                        </Label>
                      </div>

                      {/* ✅ Category count */}
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        ({catCount})
                      </span>
                    </div>

                    {/* ✅ Subcategories — ALWAYS visible (not gated on category selection) */}
                    {catSubs.length > 0 && (
                      <div className="ml-[7px] mt-1.5 pl-4 border-l border-border space-y-1.5 pb-1">
                        {catSubs.map((sub) => {
                          // ✅ String-coerced comparison fixes "0" bug
                          const subCount      = getSubcategoryProductCount(sub.id);
                          const isSubSelected = filters.subcategory_id === sub.id;

                          return (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between gap-2 cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <Checkbox
                                  id={`sub-${sub.id}`}
                                  checked={isSubSelected}
                                  onCheckedChange={() => handleSubcategoryChange(sub.id)}
                                  className={checkboxClasses}
                                />
                                <Label
                                  htmlFor={`sub-${sub.id}`}
                                  className={`cursor-pointer text-[13px] truncate font-normal
                                              ${isSubSelected
                                                ? "text-espresso font-medium"
                                                : "text-muted-foreground hover:text-espresso"}`}
                                >
                                  {sub.name}
                                </Label>
                              </div>

                              {/* ✅ Subcategory count — always shows real number */}
                              <span
                                className={`flex-shrink-0 text-xs
                                            ${subCount > 0
                                              ? "text-muted-foreground"
                                              : "text-muted-foreground/50"}`}
                              >
                                ({subCount})
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
        <CollapsibleSection title="Price" defaultOpen>
          <PriceRangeFilter
            priceRange={[filters.min_price, filters.max_price]}
            onPriceRangeChange={(r) =>
              setFilters((f) => ({ ...f, min_price: r[0], max_price: r[1] }))
            }
          />
        </CollapsibleSection>

        {/* ── QUICK FILTERS ── */}
        <CollapsibleSection title="Shop By" defaultOpen>
          <div className="space-y-2.5">
            {quickFilters.map((f) => (
              <div key={f.id} className="flex items-center gap-2.5">
                <Checkbox
                  id={f.id}
                  checked={f.checked}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({
                      ...prev,
                      [f.id]: checked ? true : null,
                    }))
                  }
                  className={checkboxClasses}
                />
                <Label
                  htmlFor={f.id}
                  className={`flex-1 cursor-pointer text-sm font-normal
                              ${f.checked
                                ? "text-espresso font-medium"
                                : "text-muted-foreground hover:text-espresso"}`}
                >
                  {f.label}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── RESULTS COUNT ── */}
        <div className="border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-espresso">{products.length}</span>{" "}
            products match your filters
          </p>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden mt-4 w-full bg-maroon text-ivory text-xs font-semibold
                       uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm
                       hover:bg-terracotta transition-colors"
          >
            Show Results
          </button>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
