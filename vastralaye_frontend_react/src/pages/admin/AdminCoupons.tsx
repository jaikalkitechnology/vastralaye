// AdminCoupons.tsx
import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Filter,
  Copy,
  Calendar,
  Tag,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BASE_URL } from '@/config';

// ----------------- Zod schema -----------------
const couponSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be less than 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens, and underscores')
    .transform(val => val.toUpperCase().trim()),
  description: z.string()
    .min(5, 'Description must be at least 5 characters')
    .max(200, 'Description must be less than 200 characters')
    .transform(val => val.trim()),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.union([
    z.string().min(1, 'Discount value is required'),
    z.number().min(1, 'Discount must be at least 1')
  ]).transform(val => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    }
    return val;
  }).pipe(
    z.number()
      .min(1, 'Discount must be at least 1')
      .max(100000, 'Discount value is too high')
  ),
  minimum_purchase: z.union([
    z.string().min(1, 'Minimum purchase is required'),
    z.number().min(0, 'Minimum purchase cannot be negative')
  ]).transform(val => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    }
    return val;
  }).pipe(
    z.number()
      .min(0, 'Minimum purchase cannot be negative')
      .max(1000000, 'Minimum purchase value is too high')
  ),
  valid_from: z.string()
    .min(1, 'Start date is required')
    .refine(date => !isNaN(new Date(date).getTime()), 'Invalid start date'),
  valid_to: z.string()
    .min(1, 'End date is required')
    .refine(date => !isNaN(new Date(date).getTime()), 'Invalid end date'),
  max_uses: z.union([
    z.string().min(1, 'Max uses is required'),
    z.number().min(1, 'Max uses must be at least 1')
  ]).transform(val => {
    if (typeof val === 'string') {
      const num = parseInt(val);
      return isNaN(num) ? 1 : num;
    }
    return val;
  }).pipe(
    z.number()
      .min(1, 'Max uses must be at least 1')
      .max(1000000, 'Max uses value is too high')
  ),
  active: z.boolean().default(true),
})
.refine(
  (data) => {
    if (data.discount_type === 'percentage') {
      return data.discount_value <= 100;
    }
    return true;
  },
  {
    message: 'Percentage discount cannot exceed 100%',
    path: ['discount_value'],
  }
)
.refine(
  (data) => {
    const startDate = new Date(data.valid_from);
    const endDate = new Date(data.valid_to);
    return startDate < endDate;
  },
  {
    message: "End date must be after start date",
    path: ["valid_to"],
  }
)
.refine(
  (data) => {
    const startDate = new Date(data.valid_from);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate >= today;
  },
  {
    message: "Start date cannot be in the past",
    path: ["valid_from"],
  }
);

type CouponFormValues = z.infer<typeof couponSchema>;

// ----------------- Types -----------------
interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase: number;
  validFrom: string;
  validTo: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

type FilterType = 'all' | 'active' | 'inactive' | 'expired' | 'upcoming';

// Status chip pill (admin_design.md §3.4)
const StatusChip = ({ tint, label }: { tint: string; label: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap ${tint}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {label}
  </span>
);
type SortField = 'code' | 'validTo' | 'discountValue' | 'usedCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

// ----------------- Component -----------------
const AdminCoupons = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Coupon | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const itemsPerPage = 10;

  // ----------------- Helpers -----------------
  const getAuthToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    '';

  const authJsonHeaders = (token: string) => ({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  });

  const authFormHeaders = (token: string) => ({
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Bearer ${token}`,
  });

  // Convert input date (YYYY-MM-DD or ISO) -> ISO date-time (UTC)
  const toISODateTime = (s: string) => {
    if (!s) return new Date().toISOString();
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch (e) {}
    return new Date(`${s}T00:00:00Z`).toISOString();
  };

  // Convert YYYY-MM-DD or ISO -> YYYY-MM-DD
  const toDateOnly = (s: string) => {
    if (!s) return new Date().toISOString().split('T')[0];
    return s.includes('T') ? s.split('T')[0] : s;
  };

  // normalize server field -> form field (camelCase -> snake_case)
  const normalizeServerFieldToFormField = (f: string) =>
    f.replace(/([A-Z])/g, '_$1').toLowerCase();

  // Robust server validation extractor
  const extractServerValidation = (responseData: any) => {
    const serverErrors: Record<string, string> = {};
    try {
      if (!responseData) return serverErrors;

      // FastAPI array of errors
      if (Array.isArray(responseData.detail)) {
        responseData.detail.forEach((err: any) => {
          const loc = err?.loc;
          const msg = err?.msg || err?.detail || 'Invalid value';
          if (Array.isArray(loc)) {
            const filtered = loc.filter((l: any) => l !== 'body' && l !== 'query' && l !== 'path' && typeof l !== 'number');
            const field = (filtered.length ? filtered[0] : loc[loc.length - 1]) || null;
            if (field) serverErrors[String(field)] = String(msg);
          } else if (err?.type && err?.msg) {
            serverErrors[err.type] = String(err.msg);
          }
        });
        return serverErrors;
      }

      // FastAPI detail as object { field: [ "error" ] }
      if (responseData.detail && typeof responseData.detail === 'object') {
        Object.entries(responseData.detail).forEach(([k, v]: any) => {
          const message = Array.isArray(v) ? v.join(' ') : String(v);
          serverErrors[k] = message;
        });
        return serverErrors;
      }

      // Generic errors object
      if (responseData.errors && typeof responseData.errors === 'object') {
        Object.entries(responseData.errors).forEach(([k, v]: any) => {
          serverErrors[k] = Array.isArray(v) ? v.join(' ') : String(v);
        });
      }
    } catch (e) {
      // ignore
    }
    return serverErrors;
  };

  // Basic extra validation
  const validateCouponData = (data: CouponFormValues): Record<string, string> => {
    const errors: Record<string, string> = {};

    const existingCoupon = coupons.find(coupon =>
      coupon.code.toUpperCase() === data.code.toUpperCase() &&
      coupon.id !== currentCoupon?.id
    );
    if (existingCoupon) {
      errors.code = 'Coupon code already exists';
    }

    if (data.discount_type === 'fixed' && Number(data.discount_value) > 10000) {
      errors.discount_value = 'Fixed discount amount seems too high';
    }

    if (Number(data.minimum_purchase) > 100000) {
      errors.minimum_purchase = 'Minimum purchase amount seems too high';
    }

    return errors;
  };

  // ----------------- Fetch coupons -----------------
  const fetchCoupons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');

      const res = await fetch(`${BASE_URL}/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }

      if (!res.ok) {
        if (res.status === 401) throw new Error('Authentication failed. Please login again.');
        throw new Error(data?.detail || `Failed to fetch coupons (${res.status})`);
      }

      if (!Array.isArray(data)) throw new Error('Invalid response format');

      const mapped = data.map((coupon: any): Coupon => ({
        id: coupon.id ?? String(Math.random()),
        code: (coupon.code ?? '').toString(),
        description: (coupon.description ?? '').toString(),
        discountType: (coupon.discount_type ?? coupon.discountType ?? 'percentage') as any,
        discountValue: Number(coupon.discount_value ?? coupon.discountValue ?? 0),
        minimumPurchase: Number(coupon.minimum_purchase ?? coupon.minimumPurchase ?? 0),
        validFrom: coupon.valid_from ?? coupon.validFrom ?? new Date().toISOString(),
        validTo: coupon.valid_to ?? coupon.validTo ?? new Date().toISOString(),
        maxUses: Number(coupon.max_uses ?? coupon.maxUses ?? 1),
        usedCount: Number(coupon.used_count ?? coupon.usedCount ?? 0),
        active: typeof coupon.active === 'boolean' ? coupon.active : Boolean(coupon.is_active ?? false),
        createdAt: coupon.created_at ?? coupon.createdAt ?? new Date().toISOString(),
      }));

      setCoupons(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load coupons';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // ----------------- Filtering & Sorting -----------------
  const filteredAndSortedCoupons = useMemo(() => {
    const now = new Date();
    let filtered = coupons.filter(coupon => {
      const code = (coupon.code ?? '').toString();
      const description = (coupon.description ?? '').toString();
      const matchesSearch = (code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            description.toLowerCase().includes(searchTerm.toLowerCase()));

      const validTo = new Date(coupon.validTo ?? coupon.createdAt ?? now.toISOString());
      const validFrom = new Date(coupon.validFrom ?? coupon.createdAt ?? now.toISOString());

      let matchesFilter = true;
      switch (filterType) {
        case 'active':
          matchesFilter = coupon.active && validTo > now && validFrom <= now && (coupon.usedCount ?? 0) < (coupon.maxUses ?? Infinity);
          break;
        case 'inactive':
          matchesFilter = !coupon.active;
          break;
        case 'expired':
          matchesFilter = validTo < now;
          break;
        case 'upcoming':
          matchesFilter = validFrom > now;
          break;
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case 'code':
          aValue = (a.code ?? '').toString().toLowerCase();
          bValue = (b.code ?? '').toString().toLowerCase();
          break;
        case 'validTo':
          aValue = new Date(a.validTo ?? a.createdAt);
          bValue = new Date(b.validTo ?? b.createdAt);
          break;
        case 'discountValue':
          aValue = Number(a.discountValue ?? 0);
          bValue = Number(b.discountValue ?? 0);
          break;
        case 'usedCount':
          aValue = Number(a.usedCount ?? 0);
          bValue = Number(b.usedCount ?? 0);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [coupons, searchTerm, filterType, sortField, sortOrder]);

  // Pagination
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCoupons.slice(start, start + itemsPerPage);
  }, [filteredAndSortedCoupons, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCoupons.length / itemsPerPage));

  // Status helper
  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validFrom = new Date(coupon.validFrom);
    const validTo = new Date(coupon.validTo);

    validFrom.setHours(0, 0, 0, 0);
    validTo.setHours(0, 0, 0, 0);

    if (!coupon.active) {
      return { label: "Inactive", variant: "secondary" as const, icon: XCircle, tint: "bg-espresso/5 text-muted-foreground" };
    }

    if (validTo < today) {
      return { label: "Expired", variant: "destructive" as const, icon: Clock, tint: "bg-espresso/5 text-muted-foreground" };
    }

    if (validFrom > today) {
      return { label: "Upcoming", variant: "outline" as const, icon: Calendar, tint: "bg-[#5C6B8A]/10 text-[#5C6B8A]" };
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return { label: "Used Up", variant: "secondary" as const, icon: XCircle, tint: "bg-amber-500/10 text-amber-700" };
    }

    return { label: "Active", variant: "default" as const, icon: CheckCircle2, tint: "bg-green-700/10 text-green-800" };
  };

  // ----------------- Forms -----------------
  const addForm = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      minimum_purchase: 0,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      max_uses: 100,
      active: true,
    },
    mode: 'onChange',
  });

  const editForm = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      minimum_purchase: 0,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      max_uses: 100,
      active: true,
    },
    mode: 'onChange',
  });

  // Helper: url-encode payload (numbers/booleans => strings)
  const encodeFormPayload = (obj: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (typeof v === 'boolean') params.append(k, v ? 'true' : 'false');
      else params.append(k, String(v));
    });
    return params.toString();
  };

  // ----------------- Handlers -----------------
  const handleAddCoupon = async (data: CouponFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});

    const localValidationErrors = validateCouponData(data);
    if (Object.keys(localValidationErrors).length > 0) {
      setValidationErrors(localValidationErrors);
      Object.entries(localValidationErrors).forEach(([k, v]) => {
        try { addForm.setError(k as any, { type: 'manual', message: v }); } catch(e) {}
      });
      setIsSubmitting(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      const msg = 'Authentication token not found (check localStorage)';
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
      return;
    }

    const payloadObj = {
      code: (data.code || '').toString().toUpperCase().trim(),
      description: (data.description || '').toString().trim(),
      discount_type: data.discount_type,
      discount_value: Number(data.discount_value),
      minimum_purchase: Number(data.minimum_purchase || 0),
      valid_from: toISODateTime(data.valid_from),
      valid_to: toISODateTime(data.valid_to),
      max_uses: parseInt(String(data.max_uses), 10),
      active: Boolean(data.active),
    };

    const body = encodeFormPayload(payloadObj);

    try {
      const res = await fetch(`${BASE_URL}/admin/create`, {
        method: 'POST',
        headers: authFormHeaders(token),
        body,
      });

      const text = await res.text();
      let responseData: any;
      try { responseData = JSON.parse(text); } catch { responseData = { raw: text }; }

      if (!res.ok) {
        if (res.status === 422 || res.status === 400) {
          const serverErrors = extractServerValidation(responseData);
          if (Object.keys(serverErrors).length) {
            setValidationErrors(serverErrors);
            Object.entries(serverErrors).forEach(([field, msg]) => {
              const normalized = normalizeServerFieldToFormField(field);
              try { addForm.setError(normalized as any, { type: 'server', message: msg }); } catch(e) {}
            });
            toast.error('Please fix the highlighted fields');
            setIsSubmitting(false);
            return;
          }
          setError(responseData?.raw || responseData?.detail || 'Validation error from server');
          toast.error('Validation error from server');
          setIsSubmitting(false);
          return;
        }

        if (res.status === 401) throw new Error('Authentication failed. Please login again.');
        throw new Error(responseData?.detail || `Failed to add coupon (${res.status})`);
      }

      toast.success(`Coupon "${payloadObj.code}" added successfully`);
      setIsAddDialogOpen(false);
      addForm.reset();
      setValidationErrors({});
      await fetchCoupons();
    } catch (err) {
      console.error('Add coupon error', err);
      const message = err instanceof Error ? err.message : 'Failed to add coupon';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCoupon = async (data: CouponFormValues) => {
    if (!currentCoupon) {
      setError('No coupon selected for editing');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});

    const localValidationErrors = validateCouponData(data);
    if (Object.keys(localValidationErrors).length > 0) {
      setValidationErrors(localValidationErrors);
      Object.entries(localValidationErrors).forEach(([k, v]) => {
        try { editForm.setError(k as any, { type: 'manual', message: v }); } catch(e) {}
      });
      setIsSubmitting(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      const msg = 'Authentication token not found (check localStorage)';
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
      return;
    }

    const payloadObj = {
      code: (data.code || '').toString().toUpperCase().trim(),
      description: (data.description || '').toString().trim(),
      discount_type: data.discount_type,
      discount_value: Number(data.discount_value),
      minimum_purchase: Number(data.minimum_purchase || 0),
      valid_from: toISODateTime(data.valid_from),
      valid_to: toISODateTime(data.valid_to),
      max_uses: parseInt(String(data.max_uses), 10),
      active: Boolean(data.active),
    };

    const body = encodeFormPayload(payloadObj);

    try {
      const couponId = Number(currentCoupon.id);
      const res = await fetch(`${BASE_URL}/admin/update/${couponId}`, {
        method: 'PUT',
        headers: authFormHeaders(token),
        body,
      });

      const text = await res.text();
      let responseData: any;
      try { responseData = JSON.parse(text); } catch { responseData = { raw: text }; }

      if (!res.ok) {
        if (res.status === 422 || res.status === 400) {
          const serverErrors = extractServerValidation(responseData);
          if (Object.keys(serverErrors).length) {
            setValidationErrors(serverErrors);
            Object.entries(serverErrors).forEach(([field, msg]) => {
              const normalized = normalizeServerFieldToFormField(field);
              try { editForm.setError(normalized as any, { type: 'server', message: msg }); } catch(e) {}
            });
            toast.error('Please fix the highlighted fields');
            setIsSubmitting(false);
            return;
          }
          setError(responseData?.raw || responseData?.detail || 'Validation error from server');
          toast.error('Validation error from server');
          setIsSubmitting(false);
          return;
        }

        if (res.status === 401) throw new Error('Authentication failed. Please login again.');
        if (res.status === 404) throw new Error('Coupon not found');

        throw new Error(responseData?.detail || `Failed to update coupon (${res.status})`);
      }

      toast.success(`Coupon "${payloadObj.code}" updated successfully`);
      setIsEditDialogOpen(false);
      setCurrentCoupon(null);
      setValidationErrors({});
      await fetchCoupons();
    } catch (err) {
      console.error('Edit coupon error', err);
      const message = err instanceof Error ? err.message : 'Failed to update coupon';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!currentCoupon) return;
    setIsSubmitting(true);
    const token = getAuthToken();

    if (!token) {
      toast.error('Authentication token not found');
      setIsSubmitting(false);
      return;
    }

    try {
      const couponId = Number(currentCoupon.id);
      const res = await fetch(`${BASE_URL}/admin/delete/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }

      if (!res.ok) {
        if (res.status === 404) throw new Error('Coupon not found');
        if (res.status === 401) throw new Error('Authentication failed. Please login again.');
        throw new Error(data?.detail || `Failed to delete coupon (${res.status})`);
      }

      toast.success(`Coupon "${currentCoupon.code}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setCurrentCoupon(null);
      await fetchCoupons();
    } catch (err) {
      console.error('Delete coupon error', err);
      const message = err instanceof Error ? err.message : 'Failed to delete coupon';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Coupon code copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy coupon code');
    });
  };

  const handleEditClick = (coupon: Coupon) => {
    setCurrentCoupon(coupon);
    editForm.reset({
      code: coupon.code ?? '',
      description: coupon.description ?? '',
      discount_type: (coupon.discountType ?? 'percentage') as any,
      discount_value: coupon.discountValue ?? 0,
      minimum_purchase: coupon.minimumPurchase ?? 0,
      valid_from: (coupon.validFrom ?? '').split('T')[0] || new Date().toISOString().split('T')[0],
      valid_to: (coupon.validTo ?? '').split('T')[0] || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      max_uses: coupon.maxUses ?? 1,
      active: Boolean(coupon.active),
    });
    setValidationErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setCurrentCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
    setCurrentPage(1);
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    addForm.setValue('code', result, { shouldValidate: true });
  };

  useEffect(() => {
    if (!isAddDialogOpen) {
      setValidationErrors({});
      setError(null);
    }
  }, [isAddDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setValidationErrors({});
      setError(null);
      setCurrentCoupon(null);
    }
  }, [isEditDialogOpen]);

  // ----------------- Render -----------------
  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-medium text-espresso">Coupons</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Create and manage discount coupons to boost sales
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Coupon
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-maroon/10 text-maroon flex items-center justify-center mb-3">
              <Tag className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Total Coupons</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{coupons.length}</p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-green-700/10 text-green-800 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Active Coupons</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">
              {coupons.filter(c => getCouponStatus(c).label === 'Active').length}
            </p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center mb-3">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Expired</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">
              {coupons.filter(c => getCouponStatus(c).label === 'Expired').length}
            </p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-[#5C6B8A]/10 text-[#5C6B8A] flex items-center justify-center mb-3">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Total Usage</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">
              {coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search coupons by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <Select value={filterType} onValueChange={(value: FilterType) => { setFilterType(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-[200px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coupons</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="flex justify-between items-center">
            <p className="text-[12.5px] text-muted-foreground">
              Showing <span className="text-espresso font-semibold">{paginatedCoupons.length}</span> of{' '}
              <span className="text-espresso font-semibold">{filteredAndSortedCoupons.length}</span> coupons
            </p>
          </div>
        )}

        {/* Coupons Table */}
        <div className="bg-white border border-border rounded-md overflow-hidden">
          <div>
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 flex-1 rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FBF8F3] hover:bg-[#FBF8F3] border-border">
                        <TableHead
                          className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap cursor-pointer hover:text-espresso transition-colors"
                          onClick={() => handleSort('code')}
                        >
                          <div className="flex items-center gap-2">
                            Code {sortField === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap">Description</TableHead>
                        <TableHead
                          className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap cursor-pointer hover:text-espresso transition-colors"
                          onClick={() => handleSort('discountValue')}
                        >
                          <div className="flex items-center gap-2 justify-end">
                            Discount {sortField === 'discountValue' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap text-right">Min. Purchase</TableHead>
                        <TableHead
                          className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap cursor-pointer hover:text-espresso transition-colors"
                          onClick={() => handleSort('validTo')}
                        >
                          <div className="flex items-center gap-2">
                            Valid Until {sortField === 'validTo' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap">Usage</TableHead>
                        <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap">Status</TableHead>
                        <TableHead className="h-auto px-3 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold whitespace-nowrap text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedCoupons.length > 0 ? (
                        paginatedCoupons.map((coupon) => {
                          const status = getCouponStatus(coupon);
                          const StatusIcon = status.icon;
                          return (
                            <TableRow key={coupon.id} className="hover:bg-purple-50/50 transition-colors border-b border-gray-100">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <code className="font-mono font-bold text-purple-700 text-base bg-purple-50 px-3 py-1.5 rounded-lg">
                                    {coupon.code}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-purple-100"
                                    onClick={() => handleCopyCode(coupon.code)}
                                    title="Copy code"
                                  >
                                    <Copy className="h-4 w-4 text-purple-600" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[250px]">
                                <p className="text-gray-700 truncate">{coupon.description}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg ${
                                    coupon.discountType === 'percentage' 
                                      ? 'bg-green-100' 
                                      : 'bg-blue-100'
                                  }`}>
                                    {coupon.discountType === 'percentage' ? (
                                      <Percent className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <DollarSign className="h-4 w-4 text-blue-600" />
                                    )}
                                  </div>
                                  <span className="font-bold text-gray-900">
                                    {coupon.discountValue}
                                    {coupon.discountType === 'percentage' ? '%' : '₹'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-700">
                                  {coupon.minimumPurchase > 0 ? `₹${coupon.minimumPurchase.toLocaleString()}` : '—'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-700">
                                    {new Date(coupon.validTo).toLocaleDateString()}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all ${
                                          coupon.usedCount >= coupon.maxUses
                                            ? 'bg-red-500'
                                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                        }`}
                                        style={{
                                          width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                                    {coupon.usedCount}/{coupon.maxUses}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={status.variant}
                                  className="flex items-center gap-1 w-fit font-semibold"
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditClick(coupon)}
                                    className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                                  >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteClick(coupon)}
                                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-16">
                            <div className="flex flex-col items-center justify-center gap-4">
                              <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-full">
                                <Tag className="h-16 w-16 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-gray-900 mb-1">No coupons found</p>
                                <p className="text-sm text-gray-500">
                                  {searchTerm || filterType !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first coupon'}
                                </p>
                              </div>
                              {!searchTerm && filterType === 'all' && (
                                <Button
                                  onClick={() => setIsAddDialogOpen(true)}
                                  className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                  <Plus className="mr-2 h-4 w-4" /> Create First Coupon
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t p-4 bg-gray-50">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>

                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={currentPage === pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Coupon Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Create New Coupon
            </DialogTitle>
            <p className="text-sm text-gray-600">Add a new discount coupon for your customers. All fields marked with * are required.</p>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddCoupon)} className="space-y-5">
              {/* code + generate */}
              <div className="flex gap-3">
                <FormField
                  control={addForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-sm font-semibold text-gray-700">Coupon Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SUMMER2024"
                          {...field}
                          className={`h-11 font-mono ${validationErrors.code ? 'border-red-500' : ''}`}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                        />
                      </FormControl>
                      {validationErrors.code && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.code}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateCouponCode}
                  className="mt-8 h-11 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200"
                  title="Generate random code"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>

              {/* description */}
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">Description *</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer sale discount" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* discount type & value */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Discount Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Percentage (%)
                            </div>
                          </SelectItem>
                          <SelectItem value="fixed">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Fixed Amount (₹)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="discount_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Discount Value *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="20"
                          {...field}
                          className={`h-11 ${validationErrors.discount_value ? 'border-red-500' : ''}`}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
                      {validationErrors.discount_value && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.discount_value}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* minimum purchase & max uses */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="minimum_purchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Minimum Purchase (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          className={`h-11 ${validationErrors.minimum_purchase ? 'border-red-500' : ''}`}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
                      {validationErrors.minimum_purchase && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.minimum_purchase}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="max_uses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Max Uses *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          {...field}
                          className="h-11"
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="valid_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Valid From *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="h-11"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="valid_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Valid To *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="h-11"
                          min={addForm.watch('valid_from') || new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* active */}
              <FormField
                control={addForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 p-4 bg-gray-50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold">Active</FormLabel>
                      <p className="text-sm text-gray-500">Enable this coupon for immediate use</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                  className="h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Coupon
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Pencil className="h-6 w-6 text-purple-600" />
              Edit Coupon
            </DialogTitle>
            <p className="text-sm text-gray-600">Modify the coupon details below.</p>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditCoupon)} className="space-y-5">
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">Coupon Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SUMMER2024"
                        {...field}
                        className={`h-11 font-mono ${validationErrors.code ? 'border-red-500' : ''}`}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    </FormControl>
                    {validationErrors.code && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {validationErrors.code}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">Description *</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer sale discount" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Discount Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Percentage (%)
                            </div>
                          </SelectItem>
                          <SelectItem value="fixed">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Fixed Amount (₹)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="discount_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Discount Value *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="20"
                          {...field}
                          className={`h-11 ${validationErrors.discount_value ? 'border-red-500' : ''}`}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
                      {validationErrors.discount_value && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.discount_value}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="minimum_purchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Minimum Purchase (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          className={`h-11 ${validationErrors.minimum_purchase ? 'border-red-500' : ''}`}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
                      {validationErrors.minimum_purchase && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.minimum_purchase}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="max_uses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Max Uses *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          {...field}
                          className="h-11"
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="valid_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Valid From *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="valid_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Valid To *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="h-11"
                          min={editForm.watch('valid_from')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 p-4 bg-gray-50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold">Active</FormLabel>
                      <p className="text-sm text-gray-500">Enable this coupon for immediate use</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                  className="h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Delete Coupon?
            </AlertDialogTitle>
            <p className="text-sm text-gray-600 pt-2">
              This action cannot be undone. This will permanently delete the coupon <span className="font-mono font-bold text-purple-700">"{currentCoupon?.code}"</span> and remove it from our servers.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCoupon}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Coupon
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCoupons;