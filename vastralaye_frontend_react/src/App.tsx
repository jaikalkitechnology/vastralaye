import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { StoreProvider, useStore } from "@/contexts/StoreContext";
import { lazy, Suspense } from "react";
import GlobalLoader from "@/components/GlobalLoader";
import WhatsAppFloat from "@/components/WhatsAppFloat";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/pages/ScrollToTop";
import ScrollToTopButton from "@/pages/ScrollToTopButton";

/* ALL YOUR PAGE IMPORTS (UNCHANGED) */
import Index from "@/pages/Index";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CategoryPage from "@/pages/CategoryPage";
import AllCategoriesPage from "@/pages/AllCategoriesPage";
import CartPage from "@/pages/CartPage";
import WishlistPage from "@/pages/WishlistPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "@/pages/NotFound";
import About from "@/pages/About";
import ForgotPasswordPage from "@/pages/user/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/user/ResetPasswordPage";
import ProfilePage from "@/pages/user/ProfilePage";
import OrdersPage from "@/pages/user/OrdersPage";
import AccountSettingsPage from "@/pages/user/AccountSettingsPage";
import Newarrival from "@/components/user/Newarrival";
import BestSellers from "@/components/user/BestSeller";
import AdminLayout from "@/components/admin/AdminLayout";

/* Admin pages are code-split — they load only when an admin visits /admin/* */
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminCoupons = lazy(() => import("@/pages/admin/AdminCoupons"));
const AdminAnalytics = lazy(() => import("@/pages/admin/AdminAnalytics"));
const AdminOrder = lazy(() => import("@/pages/admin/AdminOrder"));
const AdminReels = lazy(() => import("@/pages/admin/AdminReels"));
const Reviews = lazy(() => import("@/pages/admin/CustomerReviews"));
import PrivacyPolicy from "@/pages/policy/PrivacyPolicy";
import TermsAndConditions from "@/pages/policy/TermsConditions";
import RefundPolicy from "@/pages/policy/RefundPolicy";
import Contact from "@/pages/Contact";
import TrackOrder from "@/pages/TrackOrder";
import FAQ from "@/pages/FAQ";
import ReturnsExchanges from "@/pages/policy/ReturnsAndExchanges";
import ShippingandDeliveryPolicy from "@/pages/policy/ShippingandDeliveryPolicy";
import DataRetentionPolicy from "@/pages/policy/DataRetentionPolicy";
import OrderDetailPage from "@/pages/OrderDetailPage"


import InvoicesPage from "@/pages/InvoiceDetailPage";
import InvoiceDetailPage from "@/pages/InvoiceDetailPage";
import OrderConfirmation from "./pages/OrderConfirmation"; // <--- Import this

// import Checkout from "@/pages/Checkout";

const queryClient = new QueryClient();

/* 🔹 THIS WRAPPER READS STORE LOADING */
const AppContent = () => {
  const { state } = useStore();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {state.loading && <GlobalLoader />}

      <Suspense fallback={<GlobalLoader />}>
      <Routes>
        {/* 🔥 YOUR EXISTING ROUTES — UNCHANGED */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
        <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
        <Route path="/admin/coupons" element={<AdminLayout><AdminCoupons /></AdminLayout>} />
        <Route path="/admin/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
        <Route path="/admin/orders" element={<AdminLayout><AdminOrder /></AdminLayout>} />
        <Route path="/admin/reviews" element={<AdminLayout><Reviews /></AdminLayout>} />
        <Route path="/admin/reels" element={<AdminLayout><AdminReels /></AdminLayout>} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/" element={<><NavBar /><main><Index /></main><Footer /></>} />
        <Route path="/products" element={<><NavBar /><main><ProductsPage /></main><Footer /></>} />
        <Route path="/product/:id" element={<><NavBar /><main><ProductDetailPage /></main><Footer /></>} />
        <Route path="/category/:slug" element={<><NavBar /><main><CategoryPage /></main><Footer /></>} />
        <Route path="/cart" element={<><NavBar /><main><CartPage /></main><Footer /></>} />
        <Route path="/wishlist" element={<><NavBar /><main><WishlistPage /></main><Footer /></>} />
        <Route path="/login" element={<><NavBar /><main><LoginPage /></main><Footer /></>} />
        <Route path="/register" element={<><NavBar /><main><RegisterPage /></main><Footer /></>} />
        <Route path="/new-arrivals" element={<><NavBar /><main><Newarrival /></main><Footer /></>} />
        <Route path="/best-sellers" element={<><NavBar /><main><BestSellers /></main><Footer /></>} />
        <Route path="/categories" element={<><NavBar /><main><AllCategoriesPage /></main><Footer /></>} />
                <Route path="/about" element={<><NavBar /><main><About /></main><Footer /></>} />
                <Route path="*" element={<><NavBar /><main><NotFound /></main><Footer /></>} />


          {/* User Account routes */}
            <Route
              path="/account/profile"
              element={
                <>
                  <NavBar />
                  <main>
                    <ProfilePage />
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/account/orders"
              element={
                <>
                  <NavBar />
                  <main>
                    <OrdersPage />
                  </main>
                  <Footer />
                </>
              }
            />

            <Route path="/orders/:orderId" element={<OrderDetailPage />} />

            <Route
              path="/account/settings"
              element={
                <>
                  <NavBar />
                  <main>
                    <AccountSettingsPage />
                  </main>
                  <Footer />
                </>
              }
            />



              <Route
              path="/privacy-policy"
              element={
                <>
                  <NavBar />
                  <main>
                    <PrivacyPolicy />
                  </main>
                  <Footer />
                </>
              }
            />
                <Route
              path="/terms-conditions"
              element={
                <>
                  <NavBar />
                  <main>
                    <TermsAndConditions />
                  </main>
                  <Footer />
                </>
              }
            />

                   
            <Route
              path="/refund-policy"
              element={
                <>
                  <NavBar />
                  <main>
                    <RefundPolicy />
                  </main>
                  <Footer />
                </>
              }
            />
                    <Route
              path="/shipping-delivery-policy"
              element={
                <>
                  <NavBar />
                  <main>
                    <ShippingandDeliveryPolicy />
                  </main>
                  <Footer />
                </>
              }
            />

                        <Route
              path="/data-retention-policy"
              element={
                <>
                  <NavBar />
                  <main>
                    <DataRetentionPolicy />
                  </main>
                  <Footer />
                </>
              }
            />

                         <Route
              path="/contact-us"
              element={
                <>
                  <NavBar />
                  <main>
                    <Contact />
                  </main>
                  <Footer />
                </>
              }
            />


            <Route path="/account/invoices" element={<InvoicesPage />} />

<Route path="/account/invoices/:orderId" element={<InvoiceDetailPage />} />


             {/* <Route
              path="/checkout"
              element={
                <>
                  <NavBar />
                  <main>
                    <Checkout />
                  </main>
                  <Footer />
                </>
              }
            /> */}


               <Route path="/order-confirmation" element={<OrderConfirmation />} />

      </Routes>
      </Suspense>

      {!isAdminRoute && <WhatsAppFloat />}
      <ScrollToTop />
      <ScrollToTopButton />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </StoreProvider>
  </QueryClientProvider>
);

export default App;
