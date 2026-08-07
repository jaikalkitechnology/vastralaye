
export type Product = {
  [x: string]: any;
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  discountPrice?: number; // Keep both for compatibility
  images: string[];
  category: string;
  category_id?: number; // Add category_id from API
  subcategory: string;
  subcategory_id?: number; // Add subcategory_id from API
  colors: string[];
  sizes: string[];
  in_stock: boolean;
  stock: number;
  rating: number;
  reviews: number;
  featured?: boolean;
  new_arrival?: boolean; // API field
  newArrival?: boolean; // Keep both for compatibility
  best_seller?: boolean; // API field
  bestSeller?: boolean; // Keep both for compatibility
  created_at: string; // API field
  createdAt: string; // Keep both for compatibility
  
  // Media fields
  video?: string | null;
  pdf?: string | null;
  
  // Additional fields
  images_by_color?: string;
  highlights?: string[] | string;
  specifications?: Record<string, string> | string;
  details?: string;
  tags?: string[];
};


export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  avatar?: string;
  addresses: Address[];
  phone?: string; // Added phone property
  createdAt: string;
  token?: string;
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
export type Address = {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  default: boolean;
}

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  color: string;
  size: string;
  product: Product;
  
}

export type WishlistItem = {
  id: string;
  productId: string;
  
}

export type Category = {
  [x: string]: any;
  id: string;
  name: string;
  slug: string;
  description?: string; // Added description property
  image?: string; // Added image property
  productCount?: number; // Added productCount property
  subcategories?: Category[];
}

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase?: number;
  validFrom: string;
  validTo: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
}




export interface PaginatedCategoryResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
}

type ApiResponse = {
  data: Category[];
  total: number;
  page: number;
  limit: number;
}


/* ================= TYPES ================= */


// types/invoice.types.ts

export interface InvoiceItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  product_description: string;
  product_sku: string | null;
  unit_price: number;
  quantity: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  user_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  payment_method_label: string;
  payment_status: string;
  status: 'generated' | 'sent' | 'paid' | 'cancelled';
  notes: string | null;
  invoice_date: string;
  due_date: string;
  paid_date: string | null;
  created_at: string;
  items: InvoiceItem[];
  total_items: number;
  total_products: number;
}

export interface InvoicePreviewItem {
  product_name: string;
  product_image: string;
  quantity: number;
  total: number;
}

export interface InvoiceListItem {
  id: number;
  invoice_number: string;
  order_id: number;
  customer_name: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_method_label: string;
  payment_status: string;
  status: string;
  invoice_date: string;
  total_items: number;
  total_products: number;
  items_preview: InvoicePreviewItem[];
}

export interface InvoicesResponse {
  invoices: InvoiceListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface InvoiceFilters {
  status?: string;
  page?: number;
  limit?: number;
}