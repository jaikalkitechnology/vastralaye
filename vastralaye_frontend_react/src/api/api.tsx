import axios from "axios";
import { BASE_URL } from "@/config";
import { toast } from "sonner";

/* ================= TOKEN HELPERS ================= */

const readJSON = (k: string) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAuthToken = (): string => {
  const direct =
    localStorage.getItem("access_token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token");

  if (direct) return direct;

  const adminUser = readJSON("adminUser");
  if (adminUser?.access_token) return adminUser.access_token;
  if (adminUser?.token) return adminUser.token;

  return "";
};

export const isAdminUser = (): boolean => {
  const adminUser = readJSON("adminUser");
  return (
    adminUser?.role === "admin" ||
    adminUser?.is_admin === true ||
    adminUser?.user?.role === "admin"
  );
};

/* ================= AXIOS INSTANCE ================= */

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

/* Attach JWT token */
api.interceptors.request.use((config) => {
  let token = getAuthToken();

  if (token) {
    token = token.replace(/^Bearer\s+/i, "");
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

/* Handle expired token globally */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");

      localStorage.clear();
      sessionStorage.clear();

      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
