import { api } from "./api";

/* ================= AUTH ================= */

export const AdminAuthAPI = {
  login: (data: any) => api.post("/api/v1/admin/token", data),
  me: () => api.get("/api/v1/admin/me"),
};

/* ================= USERS ================= */

export const AdminUsersAPI = {
  list: () => api.get("/api/v1/admin/users"),
  activate: (userId: number | string) =>
    api.put(`/api/v1/admin/user/${userId}/activate`),
  deactivate: (userId: number | string) =>
    api.put(`/api/v1/admin/user/${userId}/deactivate`),
};

/* ================= CATEGORIES ================= */

export const AdminCategoryAPI = {
  create: (data: any) => api.post("/api/v1/admin/cat/create", data),
  list: () => api.get("/api/v1/admin/cat/list"),
  update: (id: number | string, data: any) =>
    api.put(`/api/v1/admin/cat/update/${id}`, data),
  delete: (id: number | string) =>
    api.delete(`/api/v1/admin/cat/delete/${id}`),
};

/* ================= SUBCATEGORIES ================= */

export const AdminSubCategoryAPI = {
  create: (data: any) =>
    api.post("/api/v1/admin/cat/subcategory/create", data),
  list: () => api.get("/api/v1/admin/cat/subcategory/list"),
  update: (id: number | string, data: any) =>
    api.put(`/api/v1/admin/cat/sub/update/${id}`, data),
  delete: (id: number | string) =>
    api.delete(`/api/v1/admin/cat/sub/delete/${id}`),
};

/* ================= PRODUCTS ================= */

export const AdminProductAPI = {
  create: (data: FormData) =>
    api.post("/api/v1/admin/product/create", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  createNewArrival: (data: FormData) =>
    api.post("/api/v1/admin/product/create-new-arrival", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  list: () => api.get("/api/v1/admin/products"),

  getById: (id: number | string) =>
    api.get(`/api/v1/admin/product/${id}`),

  update: (id: number | string, data: FormData) =>
    api.put(`/api/v1/admin/product/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  delete: (id: number | string) =>
    api.delete(`/api/v1/admin/product/${id}`),

  bestSellers: () =>
    api.get("/api/v1/admin/products/best-sellers"),

  updateBestSeller: (data: any) =>
    api.post("/api/v1/admin/products/best-seller", data),

  newArrivals: () =>
    api.get("/api/v1/admin/product/new-arrivals"),
};

/* ================= ORDERS ================= */

export const AdminOrdersAPI = {
  list: () => api.get("/api/v1/admin/admin_orders"),
  getById: (id: number | string) =>
    api.get(`/api/v1/admin/orders/${id}`),
  updateStatus: (id: number | string, data: any) =>
    api.put(`/api/v1/admin/orders/${id}/status`, data),
};

/* ================= ANALYTICS ================= */

export const AdminAnalyticsAPI = {
  monthlyOrders: () =>
    api.get("/api/v1/admin/analytics/monthly-orders"),
  dailyOrders: () =>
    api.get("/api/v1/admin/analytics/daily-orders"),
  topCustomers: () =>
    api.get("/api/v1/admin/analytics/top-customers"),
  dashboardStats: () =>
    api.get("/api/v1/admin/admin_stats"),
};

/* ================= COUPONS ================= */

export const AdminCouponAPI = {
  create: (data: any) => api.post("/api/v1/admin/create", data),
  list: () => api.get("/api/v1/admin/list"),
  update: (id: number | string, data: any) =>
    api.put(`/api/v1/admin/update/${id}`, data),
  active: () => api.get("/api/v1/admin/coupons/active"),
  apply: (params: any) => api.get("/api/v1/admin/apply", { params }),
  delete: (id: number | string) =>
    api.delete(`/api/v1/admin/delete/${id}`),
};

/* ================= SUPPORT ================= */

export const AdminSupportAPI = {
  list: () => api.get("/api/v1/admin/admin_support"),
  reply: (id: number | string, data: any) =>
    api.post(`/api/v1/admin/support/reply/${id}`, data),
};
