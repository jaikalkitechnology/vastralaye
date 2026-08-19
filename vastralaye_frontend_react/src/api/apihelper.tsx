// /src/api/apihelper.tsx
import axios from "axios";
import {
  Product,
  User,
  Category,
  Coupon,
  WishlistItem,
  LoginResponse,
  // import other types you have (Order, Review, etc.)
} from "../types";

import { BASE_URL, BOOT_TIMEOUT_MS } from "@/config";

import { Invoice, InvoicesResponse, InvoiceFilters } from "@/types/index";

// Base URLs


// Always the real API — never a relative path. In dev this used to be '/api',
// which routed through the Vite proxy to a different host than the rest of the
// app used, so sign-up and forgot-password 502'd while everything else worked.
const API_BASE = BASE_URL;

export const ADMIN_BASE = `${API_BASE}/admin`;


// Generate auth header with token
export const getAuthHeaders = (): { Authorization?: string } => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ------------------------------------------------------------------
// PUBLIC / USER APIs
// ------------------------------------------------------------------

// Users - auth & profile
axios.defaults.headers.post['Content-Type'] = 'application/json';

export const signUp = async (payload: FormData): Promise<any> => {
  try {
    const res = await axios.post(`${API_BASE}/users/signUp`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error: any) {
    console.error('SignUp API Error:', error);
    throw error;
  }
};

// Update other API functions similarly...
export const login = async (payload: { email: string; password: string }): Promise<any> => {
  const formData = new URLSearchParams();
  formData.append('username', payload.email);
  formData.append('password', payload.password);

  const res = await axios.post(`${BASE_URL}/users/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return res.data;
};

export const getUserMe = async (): Promise<any> => {
  const res = await axios.get(`${BASE_URL}/users/me`, { timeout: BOOT_TIMEOUT_MS });
  return res.data;
};


export const changePassword = async (payload: { old_password: string; new_password: string }) => {
  const res = await axios.post(`${API_BASE}/users/change-password`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const forgotPassword = async (payload: { email: string }) => {
  const res = await axios.post(`${API_BASE}/users/forgot-password`, payload);
  return res.data;
};

export const resetPassword = async (payload: { token: string; password: string }) => {
  const res = await axios.post(`${API_BASE}/users/reset-password`, payload);
  return res.data;
};


export const deleteAccount = async () => {
  const res = await axios.delete(`${API_BASE}/users/delete`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};


// Profile
export const getProfile = async () => {
  const res = await axios.get(`${BASE_URL}/users/get_profile`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// export const updateProfile = async (payload: any): Promise<User> => {
//   const res = await axios.put<User>(`${API_BASE}/users/update_profile`, payload, {
//     headers: getAuthHeaders(),
//   });
//   return res.data;
// };

export const updateProfile = async (formData: FormData): Promise<User> => {
  const res = await axios.put<User>(`${BASE_URL}/users/update_profile`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      // ❌ do NOT set 'Content-Type': 'application/json'
    },
  });
  return res.data;
};


export const uploadAvatar = async (formData: FormData) => {
  const res = await axios.post(`${API_BASE}/users/upload-avatar`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Wishlist
export const getWishlist = async (): Promise<WishlistItem[]> => {
  const res = await axios.get<WishlistItem[]>(`${BASE_URL}/users/wishlist`, {
    headers: getAuthHeaders(),
    timeout: BOOT_TIMEOUT_MS,
  });
  return res.data;
};

export const addWishlistItem = async (payload: { product_id: number | string }) => {
  const res = await axios.post(`${BASE_URL}/users/wishlist`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteWishlistItem = async (product_id: number | string) => {
  const res = await axios.delete(`${BASE_URL}/users/wishlist/${product_id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Checkout / Orders
export const checkout = async (payload: any) => {
  const res = await axios.post(`${API_BASE}/users/checkout`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getOrderHistory = async () => {
  const res = await axios.get(`${API_BASE}/users/history`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getOrderTracking = async (order_id: number | string) => {
  const res = await axios.get(`${API_BASE}/users/orders/${order_id}/tracking`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const cancelOrder = async (order_id: number | string) => {
  const res = await axios.put(`${API_BASE}/users/orders/${order_id}/cancel`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Reviews & Support
export const addProductReview = async (product_id: number | string, payload: any) => {
  const res = await axios.post(`${API_BASE}/users/product/${product_id}/review`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const submitSupport = async (payload: any) => {
  const res = await axios.post(`${API_BASE}/users/support`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ------------------------------------------------------------------
// ADMIN APIs (auth + management)
// ------------------------------------------------------------------

// Admin auth
export const adminLogin = async (payload: { email: string; password: string }): Promise<LoginResponse> => {
  const params = new URLSearchParams();
  params.append('username', payload.email); // or append('username', payload.username) if you use username
  params.append('password', payload.password);

  try {
    const res = await axios.post<LoginResponse>(`${BASE_URL}/admin/token`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return res.data;
  } catch (err: any) {
    // helpful debug log
    console.error('adminLogin error', err.response?.status, err.response?.data);
    throw err;
  }
};

export const adminMe = async () => {
  const res = await axios.get(`${BASE_URL}/admin/me`, {
    headers: getAuthHeaders(),
    timeout: BOOT_TIMEOUT_MS,
  });
  return res.data;
};

// Admin - users
export const adminGetAllUsers = async () => {
  const res = await axios.get(`${ADMIN_BASE}/users`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Categories & Subcategories
export const createCategory = async (payload: any) => {
  const res = await axios.post(`${ADMIN_BASE}/cat/create`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon?: string;
  display_order: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}
export const listCategories = async () => {
  const res = await axios.get(`${BASE_URL}/fronted/products/categories`, {
    headers: getAuthHeaders(),
    // Feeds the navbar menus and category sections — give up fast.
    timeout: BOOT_TIMEOUT_MS,
  });
  return res.data as Category[];
};

export const updateCategory = async (category_id: number | string, payload: any) => {
  const res = await axios.put(`${ADMIN_BASE}/cat/update/${category_id}`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteCategory = async (category_id: number | string) => {
  const res = await axios.delete(`${ADMIN_BASE}/cat/delete/${category_id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Subcategory
export const createSubcategory = async (payload: any) => {
  const res = await axios.post(`${ADMIN_BASE}/cat/subcategory/create`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const listSubcategories = async (): Promise<Category[]> => {
  const res = await axios.get(`${BASE_URL}/fronted/products/subcategories`, {
    headers: getAuthHeaders(),
  });
  return res.data as Category[];
};

export const updateSubcategory = async (sub_id: number | string, payload: any) => {
  const res = await axios.put(`${ADMIN_BASE}/cat/sub/update/${sub_id}`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteSubcategory = async (sub_id: number | string) => {
  const res = await axios.delete(`${ADMIN_BASE}/cat/sub/delete/${sub_id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ------------------------------------------------------------------
// ADMIN Product management (incl. new-arrival endpoints)
// ------------------------------------------------------------------

export const createNewArrivalProduct = async (formData: FormData) => {
  const res = await axios.post(`${ADMIN_BASE}/product/create-new-arrival`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const getNewArrivals = async () => {
  const res = await axios.get(`${ADMIN_BASE}/product/new-arrivals`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const createProduct = async (formData: FormData) => {
  const res = await axios.post(`${ADMIN_BASE}/product/create`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const listProducts = async () => {
  const res = await axios.get(`${BASE_URL}/fronted/products/products`, {
    headers: getAuthHeaders(),
  });
  return res.data as Product[];
};

export const getProduct = async (product_id: number | string) => {
  const res = await axios.get(`${ADMIN_BASE}/product/${product_id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const updateProduct = async (product_id: number | string, formData: FormData) => {
  const res = await axios.put(`${ADMIN_BASE}/product/update/${product_id}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// ------------------------------------------------------------------
// ADMIN Analytics & Coupons
// ------------------------------------------------------------------

export const getMonthlyOrders = async () => {
  const res = await axios.get(`${ADMIN_BASE}/analytics/monthly-orders`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getDailyOrders = async () => {
  const res = await axios.get(`${ADMIN_BASE}/analytics/daily-orders`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getTopCustomers = async () => {
  const res = await axios.get(`${ADMIN_BASE}/analytics/top-customers`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Coupons
export const createCoupon = async (payload: any) => {
  const res = await axios.post(`${ADMIN_BASE}/create`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const listCoupons = async () => {
  const res = await axios.get(`${ADMIN_BASE}/list`, {
    headers: getAuthHeaders(),
  });
  return res.data as Coupon[];
};

export const updateCoupon = async (coupon_id: number | string, payload: any) => {
  const res = await axios.put(`${ADMIN_BASE}/update/${coupon_id}`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteCoupon = async (coupon_id: number | string) => {
  const res = await axios.delete(`${ADMIN_BASE}/delete/${coupon_id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ------------------------------------------------------------------
// ADMIN DASHBOARD
// ------------------------------------------------------------------

export const getAdminDashboardStats = async () => {
  const res = await axios.get(`${ADMIN_BASE}/dashboard/stats`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const listAllOrders = async () => {
  const res = await axios.get(`${ADMIN_BASE}/dashboard/orders`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// export const updateOrderStatus = async (order_id: number | string, payload: any) => {
//   const res = await axios.put(`${ADMIN_BASE}/dashboard/orders/${order_id}/status`, payload, {
//     headers: getAuthHeaders(),
//   });
//   return res.data;
// };

export const listSupportMessages = async () => {
  const res = await axios.get(`${ADMIN_BASE}/dashboard/support`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const replySupportMessage = async (message_id: number | string, payload: any) => {
  const res = await axios.post(`${ADMIN_BASE}/dashboard/support/reply/${message_id}`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ------------------------------------------------------------------
// Convenience: existing public product/coupon functions (kept for compatibility)
// ------------------------------------------------------------------
export const productsPublic = async (): Promise<Product[]> => {
  const res = await axios.get<Product[]>(`${BASE_URL}/fronted/products/products`, {
    timeout: BOOT_TIMEOUT_MS,
  });
  return res.data;
};

export const couponsPublic = async (): Promise<Coupon[]> => {
  const res = await axios.get<Coupon[]>(`${BASE_URL}/users/list`, {
    timeout: BOOT_TIMEOUT_MS,
  });
  return res.data;
};


  


// Cart API functions
export const getCart = async (): Promise<any[]> => {
  const response = await axios.get(`${BASE_URL}/users/get-cart`);
  return response.data;
};

export const addToCart = async (payload: { product_id: number; quantity: number }): Promise<any> => {
  const response = await axios.post(`${BASE_URL}/users/add_cart`, payload);
  return response.data;
};

export const updateCartItem = async (cartItemId: number, payload: { quantity: number }): Promise<any> => {
  const response = await axios.put(`${BASE_URL}/users/${cartItemId}`, payload);
  return response.data;
};

export const removeCartItem = async (cartItemId: number): Promise<any> => {
  const response = await axios.delete(`${BASE_URL}/users/${cartItemId}`);
  return response.data;
};

export const clearCart = async (): Promise<any> => {
  const response = await axios.delete(`${BASE_URL}/users/clear/all`);
  return response.data;
};


// ═══════════════════════════════════════════════════════════
//                    AUTH HELPER
// ═══════════════════════════════════════════════════════════

// api/invoiceApi.ts





// Create axios instance with default config
// const axios = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// Request interceptor to add auth token
// axios.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('accessToken'); // or however you store your token
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

/**
 * Get invoice for a specific order. Auto-creates if doesn't exist.
 * @param orderId - The order ID
 * @returns Promise with invoice data
 */
export const getOrderInvoice = async (orderId: number): Promise<Invoice> => {
  try {
    const response = await axios.get<Invoice>(`/users/orders/${orderId}/invoice`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order invoice:', error);
    throw error;
  }
};

/**
 * Get printable HTML invoice for an order
 * @param orderId - The order ID
 * @returns Promise with HTML string
 */
export const getOrderInvoiceHtml = async (orderId: number): Promise<string> => {
  try {
    const response = await axios.get<string>(`/users/orders/${orderId}/invoice/html`, {
      headers: {
        'Accept': 'text/html'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice HTML:', error);
    throw error;
  }
};

/**
 * Get invoice by invoice number
 * @param invoiceNumber - The invoice number (e.g., "INV-2026-EAD0CA")
 * @returns Promise with invoice data
 */
export const getInvoiceByNumber = async (invoiceNumber: string): Promise<Invoice> => {
  try {
    const response = await axios.get<Invoice>(`/users/invoices/${invoiceNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice by number:', error);
    throw error;
  }
};

/**
 * Get all invoices for the current user with optional filters
 * @param filters - Filter options (status, page, limit)
 * @returns Promise with paginated invoices response
 */
export const getUserInvoices = async (filters?: InvoiceFilters): Promise<InvoicesResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await axios.get<InvoicesResponse>('/users/invoices', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching user invoices:', error);
    throw error;
  }
};

/**
 * Open invoice in a new window for printing
 * @param orderId - The order ID
 */
export const printOrderInvoice = async (orderId: number): Promise<void> => {
  try {
    const html = await getOrderInvoiceHtml(orderId);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      console.error('Popup blocked. Please allow popups for this site.');
    }
  } catch (error) {
    console.error('Error printing invoice:', error);
    throw error;
  }
};

/**
 * Download invoice as PDF (opens print dialog)
 * @param orderId - The order ID
 */
export const downloadInvoiceAsPdf = async (orderId: number): Promise<void> => {
  await printOrderInvoice(orderId);
};

/**
 * Get invoice by order ID (alias for getOrderInvoice)
 * @param orderId - The order ID
 */
export const getInvoiceByOrderId = getOrderInvoice;






export const deleteOrder = async (orderId: number): Promise<string> => {
  try {
    const response = await axios.delete(`/admin/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};


export const updateOrderStatus = async (
  orderId: number,
  status: string
): Promise<string> => {
  try {
    const response = await axios.put(
      `/admin/orders/${orderId}/status`,
      null,
      {
        params: { status }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};