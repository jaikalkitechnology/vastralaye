import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  Search,
  X,
  LogOut,
  Crown,
  ChevronDown,
  Home,
  Tag,
  ArrowRight,
  Package,
  Sparkles,
  Truck,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { listCategories } from "@/api/apihelper";
import { useSiteSettings } from "@/hooks/use-site-settings";

/** What the strip says until an admin changes it. One short line — the USP
 *  strip under the hero already carries returns and quality, so the top bar
 *  leads with shipping alone, the way the reference design does. */
export const DEFAULT_TOP_BAR_TEXT = "Free shipping on orders above ₹999";

/**
 * Render the strip, picking out *starred* phrases in gold.
 *
 * The line it replaced had one phrase highlighted, and losing that flattened
 * the whole bar — but the admin types into a plain text box, and rendering
 * their HTML would be an injection hole for the sake of one colour. Stars are
 * the whole vocabulary, and they become spans, never markup.
 *
 * Plain runs render as spans too, not Fragments — the lovable-tagger dev
 * plugin stamps data-lov-id on every JSX element, and Fragments reject
 * unknown props with a console warning on each render.
 */
export const renderTopBar = (text: string): React.ReactNode[] =>
  text.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
      <span key={i} className="text-gold font-semibold">
        {part.slice(1, -1)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );

/**
 * The maroon announcement strip: a delivery truck beside the message, the
 * pair centred between two hairline separators. Shared with the admin
 * panel's live preview so the two renders can never drift apart.
 */
export const TopBarStrip = ({ text }: { text: string }) => (
  <div className="bg-maroon px-4 py-2 text-ivory">
    <div className="flex items-center justify-center gap-4 md:gap-6">
      <span aria-hidden className="hidden sm:block h-3.5 w-px bg-ivory/25" />
      <span className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] md:text-xs">
        <Truck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="text-center">{renderTopBar(text)}</span>
      </span>
      <span aria-hidden className="hidden sm:block h-3.5 w-px bg-ivory/25" />
    </div>
  </div>
);

/**
 * Categories kept out of the navbar menus (SHOP dropdown and the mobile
 * Categories list). They stay live everywhere else — the All Categories
 * page, their own /category/<slug> URL, search and admin — this only trims
 * the menu. Matched against slug and name, case-insensitively.
 */
const NAV_HIDDEN_CATEGORIES = ["bracelet"];

const isNavHidden = (cat: { name?: string; slug?: string }) =>
  NAV_HIDDEN_CATEGORIES.includes((cat?.slug ?? "").trim().toLowerCase()) ||
  NAV_HIDDEN_CATEGORIES.includes((cat?.name ?? "").trim().toLowerCase());

const NavBar = () => {
  const { state, dispatch, logout } = useStore();
  const settings = useSiteSettings();
  const { cart = [], isLoggedIn, currentUser } = state;
  const wishlistState = state.wishlist || [];

  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const megaRef = useRef(null);
  const triggerRef = useRef(null);

  /* HEADER SHADOW ON SCROLL */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* FETCH CATEGORIES */
  useEffect(() => {
    (async () => {
      try {
        const data = await listCategories();
        if (Array.isArray(data)) setCategories(data.filter((cat) => !isNavHidden(cat)));
      } catch (err) {
        console.error("Category fetch failed:", err);
      }
    })();
  }, []);

  /* CLOSE MEGA MENU ON OUTSIDE CLICK */
  useEffect(() => {
    const onClick = (e) => {
      if (
        megaMenuOpen &&
        megaRef.current &&
        !megaRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setMegaMenuOpen(false);
      }
    };
    if (megaMenuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [megaMenuOpen]);

  /* LOCK SCROLL WHEN MOBILE MENU OPEN */
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  /* WISHLIST COUNT */
  const getWishId = (item) => {
    if (typeof item === "number" || typeof item === "string") return Number(item);
    if (item?.product_id) return Number(item.product_id);
    if (item?.productId) return Number(item.productId);
    if (item?.product?.id) return Number(item.product.id);
    return null;
  };

  const totalWishlist = useMemo(() => {
    const ids = wishlistState.map(getWishId).filter(Boolean);
    return new Set(ids).size;
  }, [wishlistState]);

  /* CART COUNT */
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cart]
  );

  /* SEARCH */
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchValue.trim()) {
      dispatch({ type: "SET_SEARCH_QUERY", payload: searchValue });
      navigate(`/products?search=${searchValue}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  /* MOBILE MENU FUNCTIONS */
  const openMobileMenu = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  /* LOGOUT */
  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate("/");
  };

  const popularCategories = categories.slice(0, 10);
  const featuredCategories = categories.slice(0, 6);

  /* Announcement strip. Admin › Categories owns both the copy and the switch;
     an untouched store keeps the line the site shipped with, and clearing the
     text hides the strip just as the switch does — an empty maroon band is
     never what anyone wanted. */
  const topBarText = (settings.topbar_text ?? '').trim() || DEFAULT_TOP_BAR_TEXT;
  const showTopBar = settings.topbar_enabled !== 'false' && Boolean(topBarText);

  return (
    <header className={`sticky top-0 z-50 bg-white border-b border-border transition-all ${isScrolled ? "shadow-sm" : "shadow-none"}`}>
      {/* ANNOUNCEMENT BAR — text and on/off from Admin › Categories */}
      {showTopBar && <TopBarStrip text={topBarText} />}
      {/* HEADER */}
      <div className="container flex items-center h-16 px-4">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src="/logo_vas.png"
            alt=""
            aria-hidden
            className="h-11 w-11 object-contain"
          />
          <span className="font-serif text-2xl md:text-[26px] font-semibold leading-none text-espresso">
            Vastra<span className="text-maroon">liya</span>
          </span>
        </Link>


        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-7 ml-10">
          <Link
            to="/"
            className="py-2 text-[13px] uppercase tracking-[0.1em] font-medium text-espresso border-b-2 border-transparent hover:border-gold transition-colors"
          >
            Home
          </Link>

          {/* DESKTOP MEGA MENU */}
          <div className="relative">
            <button
              ref={triggerRef}
              onMouseEnter={() => setMegaMenuOpen(true)}
              className={`flex items-center gap-1 py-2 text-[13px] uppercase tracking-[0.1em] font-medium text-espresso border-b-2 transition-colors ${megaMenuOpen ? "border-gold" : "border-transparent hover:border-gold"}`}
            >
              Shop
              <ChevronDown className={`w-3.5 h-3.5 transition ${megaMenuOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
            </button>

            {megaMenuOpen && (
              <div
                ref={megaRef}
                className="absolute top-full left-0 w-96 bg-white border border-border shadow-lg rounded-sm p-5"
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <div className="space-y-4">
                  {/* POPULAR CATEGORIES */}
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.22em] text-gold font-semibold mb-3">Popular Categories</h3>
                    <div className="space-y-1">
                      {popularCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.slug}`}
                          className="flex items-center justify-between px-1 py-1.5 group"
                        >
                          <span className="text-[13px] text-espresso group-hover:text-maroon transition-colors">
                            {cat.name}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-maroon transition-all" strokeWidth={1.5} />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* FEATURED */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-xs uppercase tracking-[0.22em] text-gold font-semibold mb-3">Featured</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/new-arrivals"
                        className="flex items-center gap-2 px-1 py-1.5 group"
                      >
                        <Sparkles className="w-4 h-4 text-gold" strokeWidth={1.5} />
                        <span className="text-[13px] text-espresso group-hover:text-maroon transition-colors">
                          New Arrivals
                        </span>
                      </Link>
                      <Link
                        to="/best-sellers"
                        className="flex items-center gap-2 px-1 py-1.5 group"
                      >
                        <Package className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                        <span className="text-[13px] text-espresso group-hover:text-maroon transition-colors">
                          Best Sellers
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ALL CATEGORIES LINK */}
          <Link
            to="/categories"
            className="py-2 text-[13px] uppercase tracking-[0.1em] font-medium text-espresso border-b-2 border-transparent hover:border-gold transition-colors"
          >
            All Categories
          </Link>
          <Link
            to="/products"
            className="py-2 text-[13px] uppercase tracking-[0.1em] font-medium text-espresso border-b-2 border-transparent hover:border-gold transition-colors"
          >
            All Products
          </Link>
        </nav>

        {/* DESKTOP SEARCH BAR */}
        <div className="hidden lg:flex mx-6 flex-1 max-w-md">
          <form onSubmit={handleSearch} className="flex w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <Input
                placeholder="Search products..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 pr-4 h-11 w-full bg-white border-border border-r-0 rounded-lg rounded-r-none focus-visible:ring-1 focus-visible:ring-maroon focus-visible:ring-offset-0 focus-visible:border-maroon"
              />
            </div>
            <Button
              type="submit"
              className="h-11 bg-maroon hover:bg-terracotta text-ivory text-[13px] uppercase tracking-[0.1em] rounded-lg rounded-l-none px-6"
            >
              Search
            </Button>
          </form>
        </div>

        {/* DESKTOP RIGHT ICONS */}
        <div className="ml-auto hidden lg:flex items-center gap-1">
          {/* USER MENU */}
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-blush text-maroon flex items-center justify-center border border-maroon/20 font-serif font-semibold">
                    {currentUser?.first_name?.charAt(0)}
                  </div>
                  <span className="text-[13px] font-medium text-espresso">{currentUser?.first_name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-espresso/60" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <div className="font-semibold text-espresso">{currentUser?.first_name} {currentUser?.last_name}</div>
                  <div className="text-xs text-muted-foreground">{currentUser?.email}</div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {currentUser?.role === "user" && (
                  <DropdownMenuItem asChild>
                    <Link to="/account/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" strokeWidth={1.5} />
                      <span className="text-espresso">My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {currentUser?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Crown className="w-4 h-4 text-gold" strokeWidth={1.5} />
                      <span className="text-espresso">Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 cursor-pointer text-sale focus:text-sale"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" className="flex items-center gap-2 px-4 py-2 text-espresso hover:text-terracotta">
                <User className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-[13px] uppercase tracking-[0.1em] font-medium">Sign In</span>
              </Button>
            </Link>
          )}

          {/* Hairline between the account menu and the icons */}
          <span aria-hidden className="mx-2 h-6 w-px bg-border" />

          {/* WISHLIST — counts like the cart, visible even at zero */}
          <Link to="/wishlist">
            <Button variant="ghost" size="icon" className="relative text-espresso hover:text-terracotta">
              <Heart className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-0.5 right-0.5 bg-maroon text-ivory text-[10px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {totalWishlist}
              </span>
            </Button>
          </Link>

          {/* CART — the count stays visible even at zero */}
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative text-espresso hover:text-terracotta">
              <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-0.5 right-0.5 bg-maroon text-ivory text-[10px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {totalItems}
              </span>
            </Button>
          </Link>
        </div>

        {/* ================= MOBILE ICONS ================= */}
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          {/* Search Button — phones use the bottom nav's Search instead */}
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} className="hidden md:inline-flex text-espresso hover:text-terracotta">
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </Button>

          {/* Wishlist — reachable from the menu drawer on phones */}
          <Link to="/wishlist" className="hidden md:block">
            <Button variant="ghost" size="icon" className="relative text-espresso hover:text-terracotta">
              <Heart className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-0.5 right-0.5 bg-maroon text-ivory text-[10px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {totalWishlist}
              </span>
            </Button>
          </Link>

          {/* Cart — phones use the bottom nav's Cart tab instead */}
          <Link to="/cart" className="hidden md:block">
            <Button variant="ghost" size="icon" className="relative text-espresso hover:text-terracotta">
              <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-0.5 right-0.5 bg-maroon text-ivory text-[10px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {totalItems}
              </span>
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" onClick={openMobileMenu} className="ml-1 text-espresso hover:text-terracotta">
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* MOBILE SEARCH BAR */}
      {isSearchOpen && (
        <div className="lg:hidden bg-white border-b border-border px-4 py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <Input
                placeholder="Search products..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
                className="pl-10 pr-4 py-2 w-full bg-white border-border rounded-sm focus-visible:ring-1 focus-visible:ring-maroon focus-visible:ring-offset-0 focus-visible:border-maroon"
              />
            </div>
            <Button
              type="submit"
              className="bg-maroon hover:bg-terracotta text-ivory text-[13px] uppercase tracking-[0.1em] rounded-sm"
            >
              Go
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)} className="text-espresso hover:text-terracotta">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </form>
        </div>
      )}

      {/* ================= MOBILE DRAWER ================= */}
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeMobileMenu}
      />

      {/* SLIDE MENU */}
      <aside
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-xs bg-white shadow-xl z-50 
          transform transition-transform duration-300 ease-out 
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <div className="w-10 h-10 rounded-full bg-blush text-maroon flex items-center justify-center border border-maroon/20 font-serif font-semibold">
                {currentUser?.first_name?.charAt(0)}
              </div>
            )}
            <div>
              {isLoggedIn ? (
                <>
                  <div className="font-serif font-semibold text-espresso">{currentUser?.first_name}</div>
                  <div className="text-xs text-muted-foreground">Account</div>
                </>
              ) : (
                <div className="font-serif font-semibold text-espresso">Menu</div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="h-8 w-8 text-espresso hover:text-terracotta">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>

        {/* MENU CONTENT */}
        <div className="p-4 space-y-1 overflow-y-auto h-[calc(100%-64px)]">
          {/* HOME */}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-ivory text-espresso"
            onClick={closeMobileMenu}
          >
            <Home className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-medium">Home</span>
          </Link>

          {/* CATEGORIES */}
          <details className="group">
            <summary className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-ivory rounded-sm list-none">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-espresso" strokeWidth={1.5} />
                <span className="font-medium text-espresso">Categories</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-open:rotate-180" strokeWidth={1.5} />
            </summary>
            <div className="pl-8 pr-3 py-2 space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="flex items-center justify-between px-3 py-2 rounded-sm hover:bg-ivory text-[13px] text-espresso hover:text-maroon transition-colors"
                  onClick={closeMobileMenu}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {cat.subcategories?.length || 0}
                  </span>
                </Link>
              ))}
            </div>
          </details>

          <Link
            to="/products"
            className="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-ivory text-espresso"
            onClick={closeMobileMenu}
          >
            <Package className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-medium">Products</span>
          </Link>

          {/* NEW ARRIVALS */}
          <Link
            to="/new-arrivals"
            className="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-ivory text-espresso"
            onClick={closeMobileMenu}
          >
            <Sparkles className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <span className="font-medium">New Arrivals</span>
          </Link>

          {/* BEST SELLERS */}
          <Link
            to="/best-sellers"
            className="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-ivory text-espresso"
            onClick={closeMobileMenu}
          >
            <Package className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
            <span className="font-medium">Best Sellers</span>
          </Link>

          <div className="h-px bg-border my-3"></div>

          {/* AUTH SECTION */}
          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="block w-full text-center bg-maroon hover:bg-terracotta text-ivory py-3 rounded-sm text-[13px] uppercase tracking-[0.1em] font-medium transition-colors"
                onClick={closeMobileMenu}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block w-full text-center border border-espresso text-espresso hover:bg-espresso hover:text-ivory py-3 rounded-sm text-[13px] uppercase tracking-[0.1em] font-medium transition-colors"
                onClick={closeMobileMenu}
              >
                Create Account
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/account/profile"
                className="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-ivory text-espresso"
                onClick={closeMobileMenu}
              >
                <User className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-medium">My Profile</span>
              </Link>

              <Link
                to="/wishlist"
                className="flex items-center justify-between px-3 py-3 rounded-sm hover:bg-ivory text-espresso"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5" strokeWidth={1.5} />
                  <span className="font-medium">Wishlist</span>
                </div>
                {totalWishlist > 0 && (
                  <Badge className="bg-maroon text-ivory hover:bg-maroon">{totalWishlist}</Badge>
                )}
              </Link>

              {currentUser?.role === "admin" && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-ivory text-espresso"
                  onClick={closeMobileMenu}
                >
                  <Crown className="w-5 h-5 text-gold" strokeWidth={1.5} />
                  <span className="font-medium">Admin Panel</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 w-full text-left text-sale hover:bg-blush rounded-sm"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-medium">Logout</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </header>
  );
};

export default NavBar;