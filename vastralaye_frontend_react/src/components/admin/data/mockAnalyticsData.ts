// ------------------------------------------------------------------
// FALLBACK DATA ONLY.
// The admin dashboard & analytics pages fetch live numbers from the
// backend (/admin/admin_stats, /admin/analytics/*). These samples are
// rendered only when a live endpoint is unreachable, so the pages
// never break. Do not treat these values as real store data.
// ------------------------------------------------------------------

// Sample monthly sales/orders
export const monthlySales = [
  { month: 'Jan', sales: 4000, orders: 24 },
  { month: 'Feb', sales: 3000, orders: 18 },
  { month: 'Mar', sales: 5000, orders: 32 },
  { month: 'Apr', sales: 8000, orders: 43 },
  { month: 'May', sales: 6000, orders: 35 },
  { month: 'Jun', sales: 9000, orders: 54 },
  { month: 'Jul', sales: 11000, orders: 68 },
  { month: 'Aug', sales: 7000, orders: 46 },
  { month: 'Sep', sales: 10000, orders: 62 },
  { month: 'Oct', sales: 12000, orders: 73 },
  { month: 'Nov', sales: 15000, orders: 82 },
  { month: 'Dec', sales: 20000, orders: 95 },
];

// Sample category share
export const categorySales = [
  { name: 'Sarees', value: 18000 },
  { name: 'Suit Sets', value: 15000 },
  { name: 'Kurtas', value: 12000 },
  { name: 'Men', value: 10000 },
  { name: 'Kids & Other', value: 8000 },
];

// Sample customer split
export const customerData = [
  { name: 'New Customers', value: 120 },
  { name: 'Returning Customers', value: 85 },
];

// Sample daily sales for the last week
export const dailySales = [
  { day: 'Monday', sales: 1200 },
  { day: 'Tuesday', sales: 1400 },
  { day: 'Wednesday', sales: 1100 },
  { day: 'Thursday', sales: 1600 },
  { day: 'Friday', sales: 2200 },
  { day: 'Saturday', sales: 2600 },
  { day: 'Sunday', sales: 1800 },
];

// Admin chart series palette (admin_design.md §3.5) — fixed order, never cycled
export const COLORS = ['#7A1F2B', '#C99A45', '#5C6B8A', '#3E6B4F', '#B85C38'];
