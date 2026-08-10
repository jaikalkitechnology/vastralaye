import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";
import { Product } from "@/types";
import { BASE_URL } from "@/config";

// ═══════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════

/** Shape the parent may pass to sync/clear the sidebar UI (chips row, clear-all). */
interface SidebarFilterValue {
  category_id?: number | null;
  subcategory_id?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  in_stock?: boolean | null;
  featured?: boolean | null;
  best_seller?: boolean | null;
  new_arrival?: boolean | null;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onFilterChange: (filters: any) => void;
  className?: string;
  /**
   * Optional parent-driven state. When provided, the sidebar mirrors it —
   * letting the page's chips-row "×" / "Clear all filters" reset the sidebar
   * UI without desync. Fully backward compatible when omitted.
   */
  value?: SidebarFilterValue;
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

/** 16px checkbox — gold fill + white ✓ when checked. */
const checkboxClasses =
  "h-4 w-4 shrink-0 rounded-[2px] border border-border bg-white " +
  "data-[state=checked]:bg-gold data-[state=checked]:border-gold " +
  "data-[state=checked]:text-white [&_svg]:h-3 [&_svg]:w-3";

/** Gold section overline (Refine panel section heading). */
const SectionOverline = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A6414]">
    {children}
  </div>
);

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
//  PRICE RANGE FILTER — gold slider + min/max inputs
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
    <div>
      {/* Minimal slider — thin track, gold fill */}
      <div className="px-1 pt-1">
        <Slider
          min={0}
          max={5000}
          step={100}
          value={priceRange}
          onValueChange={(v) => onPriceRangeChange(v as [number, number])}
          className="[&>span:first-child]:h-[2px] [&>span:first-child]:rounded-none
                     [&>span:first-child]:bg-border
                     [&>span:first-child>span]:bg-gold
                     [&_[role=slider]]:h-3 [&_[role=slider]]:w-3
                     [&_[role=slider]]:border-2 [&_[role=slider]]:border-gold
                     [&_[role=slider]]:bg-white"
        />
        <div className="mt-2.5 flex justify-between text-[12px] text-muted-foreground">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      {/* Min / Max inputs */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["min", "max"] as const).map((type) => (
          <div
            key={type}
            className="flex h-9 items-center rounded-[3px] border border-border bg-white px-2.5
                       transition-colors focus-within:border-gold"
          >
            <span className="pr-1 text-[13px] text-muted-foreground">₹</span>
            <input
              type="number"
              aria-label={type === "min" ? "Minimum price" : "Maximum price"}
              placeholder={type === "min" ? "Min" : "Max"}
              value={type === "min" ? minInput : maxInput}
              onChange={(e) => handleInputChange(type, e.target.value)}
              onBlur={handleBlur}
              className="w-full bg-transparent text-[13px] text-espresso focus:outline-none"
              min={0}
              max={5000}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  MAIN FILTER SIDEBAR — the "Refine" panel
// ═══════════════════════════════════════════════

const FilterSidebar = ({
  isOpen,
  onClose,
  products,
  onFilterChange,
  className,
  value,
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

  // ── Optional parent sync (chips row "×" / "Clear all filters") ──
  const valueString = value ? JSON.stringify(value) : null;
  useEffect(() => {
    if (valueString === null) return;
    const v: SidebarFilterValue = JSON.parse(valueString);
    setFilters((prev) => {
      const next = {
        category_id:    v.category_id    ?? null,
        subcategory_id: v.subcategory_id ?? null,
        min_price:      v.min_price      ?? DEFAULT_PRICE[0],
        max_price:      v.max_price      ?? DEFAULT_PRICE[1],
        in_stock:       v.in_stock       ?? null,
        featured:       v.featured       ?? null,
        best_seller:    v.best_seller    ?? null,
        new_arrival:    v.new_arrival    ?? null,
      };
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, [valueString]);

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

  // ── ✅ Category count — String comparison to avoid type mismatch ──
  const getCategoryProductCount = useCallback(
    (categoryId: number): number =>
      products.filter(
        (p) => String(getProductCategoryId(p)) === String(categoryId),
      ).length,
    [products],
  );

  // ── ✅ Subcategory count — String comparison ──
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

  const availabilityFilters = [
    { id: "in_stock", label: "In stock only", checked: filters.in_stock === true },
  ];

  const highlightFilters = [
    { id: "featured",    label: "Featured",     checked: filters.featured    === true },
    { id: "best_seller", label: "Bestsellers",  checked: filters.best_seller === true },
    { id: "new_arrival", label: "New arrivals", checked: filters.new_arrival === true },
  ];

  const renderCheckboxRow = (f: { id: string; label: string; checked: boolean }) => (
    <div key={f.id} className="flex items-center gap-2.5 py-1.5 text-[13px]">
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
        className={`flex-1 cursor-pointer text-[13px] font-normal
                    ${f.checked
                      ? "text-espresso"
                      : "text-muted-foreground hover:text-espresso"}`}
      >
        {f.label}
      </Label>
    </div>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px]
                  overflow-y-auto bg-white transition-transform duration-300 ease-out
                  ${isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}
                  lg:sticky lg:top-24 lg:z-0
                  lg:max-h-[calc(100vh-7rem)] lg:translate-x-0 lg:shadow-none
                  lg:rounded-sm lg:border lg:border-border
                  ${className || ""}`}
    >
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10 flex items-baseline justify-between border-b border-border bg-ivory px-4 py-4">
        <h2 className="font-serif text-[17px] font-medium text-espresso">Refine</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] text-maroon underline underline-offset-[3px]
                       transition-colors hover:text-terracotta"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-espresso transition-colors hover:text-maroon"
            aria-label="Close filters"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── CATEGORY ── */}
      {categories.length > 0 && (
        <div className="border-b border-border px-4 py-4">
          <SectionOverline>Category</SectionOverline>
          <div>
            {categories.map((cat) => {
              const catCount   = getCategoryProductCount(cat.id);
              const catSubs    = subcategories.filter((s) => s.category_id === cat.id);
              const isSelected = filters.category_id === cat.id;

              return (
                <div key={cat.id}>
                  {/* Category row */}
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 py-1
                                text-left text-[13px] transition-colors
                                ${isSelected
                                  ? "font-semibold text-maroon"
                                  : "text-muted-foreground hover:text-espresso"}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {isSelected && (
                        <span className="h-[5px] w-[5px] shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                      )}
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span
                      className={`shrink-0 text-[12px] font-normal
                                  ${isSelected ? "text-maroon" : "text-muted-foreground"}`}
                    >
                      {catCount}
                    </span>
                  </button>

                  {/* Subcategories — always visible under their category */}
                  {catSubs.length > 0 && (
                    <div className="mb-1 ml-[2px] mt-0.5 border-l border-border pl-3">
                      {catSubs.map((sub) => {
                        const subCount      = getSubcategoryProductCount(sub.id);
                        const isSubSelected = filters.subcategory_id === sub.id;

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSubcategoryChange(sub.id)}
                            className={`flex w-full cursor-pointer items-center justify-between gap-2 py-1
                                        text-left text-[13px] transition-colors
                                        ${isSubSelected
                                          ? "font-semibold text-maroon"
                                          : "text-muted-foreground hover:text-espresso"}`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              {isSubSelected && (
                                <span className="h-[5px] w-[5px] shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                              )}
                              <span className="truncate">{sub.name}</span>
                            </span>
                            <span
                              className={`shrink-0 text-[12px] font-normal
                                          ${isSubSelected
                                            ? "text-maroon"
                                            : subCount > 0
                                            ? "text-muted-foreground"
                                            : "text-muted-foreground/50"}`}
                            >
                              {subCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PRICE ── */}
      <div className="border-b border-border px-4 py-4">
        <SectionOverline>Price</SectionOverline>
        <PriceRangeFilter
          priceRange={[filters.min_price, filters.max_price]}
          onPriceRangeChange={(r) =>
            setFilters((f) => ({ ...f, min_price: r[0], max_price: r[1] }))
          }
        />
      </div>

      {/* ── AVAILABILITY ── */}
      <div className="border-b border-border px-4 py-4">
        <SectionOverline>Availability</SectionOverline>
        <div>{availabilityFilters.map(renderCheckboxRow)}</div>
      </div>

      {/* ── HIGHLIGHTS ── */}
      <div className="border-b border-border px-4 py-4">
        <SectionOverline>Highlights</SectionOverline>
        <div>{highlightFilters.map(renderCheckboxRow)}</div>
      </div>

      {/* ── RESULTS COUNT ── */}
      <div className="px-4 py-4">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-espresso">{products.length}</span>{" "}
          products match your filters
        </p>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden mt-4 w-full rounded-sm bg-maroon px-8 py-3.5 text-xs
                     font-semibold uppercase tracking-[0.16em] text-ivory
                     transition-colors hover:bg-terracotta"
        >
          Show Results
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;
