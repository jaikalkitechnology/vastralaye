import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Search,
  Filter,
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Power,
  Download,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  X
} from 'lucide-react';
import { BASE_URL } from '@/config';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  role: string;
  created_at: string | null;
  phone?: string;
  deleted_at?: string | null;
  active_at?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
}

// Status chip pill (admin_design.md §3.4)
const StatusChip = ({ tint, label }: { tint: string; label: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap ${tint}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {label}
  </span>
);

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Stats (calculated from all users, not paginated)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0
  });

  const getAuthToken = () =>
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    '';

  const getFullName = (user: User) => `${user.first_name} ${user.last_name}`.trim();

  const getInitials = (user: User) =>
    `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '—';
    }
  };

  const fetchUsers = async () => {
    const token = getAuthToken();
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      // Add optional filters
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter === 'active') params.append('is_active', 'true');
      if (statusFilter === 'inactive') params.append('is_active', 'false');
      if (verifiedFilter === 'verified') params.append('is_verified', 'true');
      if (verifiedFilter === 'unverified') params.append('is_verified', 'false');
      if (dateFrom) params.append('created_after', dateFrom);
      if (dateTo) params.append('created_before', dateTo);

      const response = await axios.get(`${BASE_URL}/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle different response structures
      if (response.data.data) {
        // Backend returns { data: [], total: 100 }
        const raw = response.data.data;
        setUsers(raw.map((u: any) => ({
          ...u,
          is_active: u.deleted_at === null
        })));
        setTotalCount(response.data.total || raw.length);
      } else {
        // Backend returns array directly
        const raw = Array.isArray(response.data) ? response.data : [];
        setUsers(raw.map((u: any) => ({
          ...u,
          is_active: u.deleted_at === null
        })));
        setTotalCount(raw.length);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = getAuthToken();
    try {
      const response = await axios.get(`${BASE_URL}/admin/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data) {
        setStats(response.data);
      }
    } catch {
      // If stats endpoint doesn't exist, calculate from users
      const allUsersResponse = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const allUsers = Array.isArray(allUsersResponse.data) 
        ? allUsersResponse.data 
        : allUsersResponse.data.data || [];
      
      setStats({
        total: allUsers.length,
        active: allUsers.filter((u: any) => u.deleted_at === null).length,
        inactive: allUsers.filter((u: any) => u.deleted_at !== null).length,
        admins: allUsers.filter((u: any) => u.role === 'admin').length,
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, usersPerPage, searchTerm, roleFilter, statusFilter, verifiedFilter, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []);

  const activateUser = async (id: number) => {
    try {
      await axios.put(`${BASE_URL}/admin/user/${id}/activate`, {}, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      toast.success("User activated successfully! ✅");
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Activation failed");
    }
  };

  const deactivateUser = async (id: number) => {
    try {
      await axios.put(`${BASE_URL}/admin/user/${id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      toast.success("User deactivated successfully! ❌");
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Deactivation failed");
    }
  };

  const handleToggleStatus = (user: User) => {
    user.is_active ? deactivateUser(user.id) : activateUser(user.id);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setVerifiedFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || 
                          verifiedFilter !== 'all' || dateFrom || dateTo || 
                          sortBy !== 'created_at' || sortOrder !== 'desc';

  const totalPages = Math.ceil(totalCount / usersPerPage);

  const SkeletonLoader = () => (
    <div className="bg-white border border-border rounded-md overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-3 border-b border-border last:border-b-0">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-medium text-espresso">Users</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Manage and monitor all user accounts across the platform</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                fetchUsers();
                fetchStats();
              }}
              className="gap-2 uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button className="gap-2 bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-maroon/10 text-maroon flex items-center justify-center mb-3">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Total Users</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{stats.total}</p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-green-700/10 text-green-800 flex items-center justify-center mb-3">
              <UserCheck className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Active Users</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{stats.active}</p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-gold/15 text-[#8a6414] flex items-center justify-center mb-3">
              <Shield className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Administrators</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{stats.admins}</p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-espresso/5 text-muted-foreground flex items-center justify-center mb-3">
              <UserX className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Inactive Users</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{stats.inactive}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-border rounded-md">
          <div className="p-5">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Search by name, email, or phone number..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap gap-3">
                {/* Role Filter */}
                <Select value={roleFilter} onValueChange={(value) => {
                  setRoleFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[160px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[160px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {/* Verified Filter */}
                <Select value={verifiedFilter} onValueChange={(value) => {
                  setVerifiedFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[160px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 rounded-sm text-[12.5px] gap-2">
                      <Calendar className="h-4 w-4" />
                      Date Range
                      {(dateFrom || dateTo) && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                          {dateFrom && dateTo ? '2' : '1'}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="date-from">From Date</Label>
                        <Input
                          id="date-from"
                          type="date"
                          value={dateFrom}
                          onChange={(e) => {
                            setDateFrom(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date-to">To Date</Label>
                        <Input
                          id="date-to"
                          type="date"
                          value={dateTo}
                          onChange={(e) => {
                            setDateTo(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full"
                        />
                      </div>
                      {(dateFrom || dateTo) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDateFrom('');
                            setDateTo('');
                            setCurrentPage(1);
                          }}
                          className="w-full"
                        >
                          Clear Dates
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[160px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Select value={sortOrder} onValueChange={(value) => {
                  setSortOrder(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[140px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                {/* Per Page */}
                <Select
                  value={String(usersPerPage)}
                  onValueChange={(value) => {
                    setUsersPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Show 10</SelectItem>
                    <SelectItem value="25">Show 25</SelectItem>
                    <SelectItem value="50">Show 50</SelectItem>
                    <SelectItem value="100">Show 100</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear All Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={clearAllFilters}
                    className="h-10 gap-2 rounded-sm text-[12.5px] border-sale/40 text-sale hover:bg-sale hover:text-ivory"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <span className="text-[12.5px] font-medium text-muted-foreground">Active Filters:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1 rounded-full text-[11px] font-semibold bg-espresso/5 text-muted-foreground hover:bg-espresso/10">
                      Search: {searchTerm}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                    </Badge>
                  )}
                  {roleFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1 rounded-full text-[11px] font-semibold bg-espresso/5 text-muted-foreground hover:bg-espresso/10">
                      Role: {roleFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter('all')} />
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1 rounded-full text-[11px] font-semibold bg-espresso/5 text-muted-foreground hover:bg-espresso/10">
                      Status: {statusFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                    </Badge>
                  )}
                  {verifiedFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1 rounded-full text-[11px] font-semibold bg-espresso/5 text-muted-foreground hover:bg-espresso/10">
                      Verified: {verifiedFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setVerifiedFilter('all')} />
                    </Badge>
                  )}
                  {dateFrom && (
                    <Badge variant="secondary" className="gap-1 rounded-full text-[11px] font-semibold bg-espresso/5 text-muted-foreground hover:bg-espresso/10">
                      From: {formatDate(dateFrom)}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFrom('')} />
                    </Badge>
                  )}
                  {dateTo && (
                    <Badge variant="secondary" className="gap-1 rounded-full text-[11px] font-semibold bg-espresso/5 text-muted-foreground hover:bg-espresso/10">
                      To: {formatDate(dateTo)}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setDateTo('')} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <SkeletonLoader />
        ) : users.length === 0 ? (
          <div className="bg-white border border-border rounded-md p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-espresso/5 mb-6">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso mb-2">No Users Found</h3>
              <p className="text-[13px] text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "We couldn't find any users matching your search criteria. Try adjusting your filters."
                  : "There are no users in the system yet. Users will appear here once they register."}
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={clearAllFilters}
                  className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta"
                >
                  Clear All Filters
                </Button>
              )}
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="bg-white border border-border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">User</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Phone</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Joined</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Role</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Status</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:last-child>td]:border-b-0">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FBF8F3] transition-colors">
                        <td className="px-3 py-3 border-b border-border text-[13px]">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback
                                className={`text-[11px] font-semibold ${
                                  user.role === 'admin'
                                    ? 'bg-maroon text-ivory'
                                    : 'bg-espresso/10 text-espresso'
                                }`}
                              >
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-espresso truncate max-w-[200px]">{getFullName(user)}</p>
                              <p className="text-[11.5px] text-muted-foreground truncate max-w-[200px]">{user.email || "No email"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 border-b border-border text-[13px] whitespace-nowrap">
                          {user.phone || "—"}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-[13px] whitespace-nowrap">
                          {formatDate(user.created_at)}
                          <span className="block text-[11.5px] text-muted-foreground">{formatTime(user.created_at)}</span>
                        </td>
                        <td className="px-3 py-3 border-b border-border text-[13px] whitespace-nowrap">
                          <StatusChip
                            tint={user.role === 'admin' ? 'bg-maroon/10 text-maroon' : 'bg-espresso/5 text-muted-foreground'}
                            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          />
                        </td>
                        <td className="px-3 py-3 border-b border-border text-[13px] whitespace-nowrap">
                          <StatusChip
                            tint={user.is_active ? 'bg-green-700/10 text-green-800' : 'bg-espresso/5 text-muted-foreground'}
                            label={user.is_active ? 'Active' : 'Inactive'}
                          />
                        </td>
                        <td className="px-3 py-3 border-b border-border text-[13px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="View details"
                              className="w-7 h-7 border border-border rounded-[5px] inline-flex items-center justify-center text-muted-foreground bg-white hover:text-espresso hover:border-espresso transition-colors"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-7 gap-1.5 px-2.5 text-[11px] rounded-[5px] ${
                                user.is_active
                                  ? 'border-sale/40 text-sale hover:bg-sale hover:text-ivory'
                                  : 'border-green-800/40 text-green-800 hover:bg-green-800 hover:text-ivory'
                              }`}
                              onClick={() => handleToggleStatus(user)}
                            >
                              <Power className="h-3 w-3" />
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <p className="text-[12.5px] text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-espresso">
                    {(currentPage - 1) * usersPerPage + 1} - {Math.min(currentPage * usersPerPage, totalCount)}
                  </span>{" "}
                  of <span className="font-semibold text-espresso">{totalCount}</span> users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="gap-2 h-8 px-3 text-[12.5px] rounded-[5px] border-border text-espresso hover:bg-[#FBF8F3] hover:text-espresso disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="default"
                          className={`w-8 h-8 p-0 text-[12.5px] rounded-[5px] ${
                            currentPage === pageNum
                              ? 'bg-maroon text-ivory hover:bg-terracotta'
                              : 'border-border text-espresso hover:bg-[#FBF8F3] hover:text-espresso'
                          }`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="gap-2 h-8 px-3 text-[12.5px] rounded-[5px] border-border text-espresso hover:bg-[#FBF8F3] hover:text-espresso disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* User Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 font-serif text-xl font-medium text-espresso">
                <div className="p-2 bg-maroon/10 rounded-md">
                  <User className="h-5 w-5 text-maroon" />
                </div>
                User Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Profile Section */}
                <div className="flex items-center gap-4 p-4 bg-[#FBF8F3] border border-border rounded-md">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback
                      className={`text-lg font-semibold ${
                        selectedUser.role === 'admin' ? 'bg-maroon text-ivory' : 'bg-espresso/10 text-espresso'
                      }`}
                    >
                      {getInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-espresso text-[15px] mb-1.5">{getFullName(selectedUser)}</h3>
                    <div className="flex items-center gap-2">
                      <StatusChip
                        tint={selectedUser.role === 'admin' ? 'bg-maroon/10 text-maroon' : 'bg-espresso/5 text-muted-foreground'}
                        label={selectedUser.role.toUpperCase()}
                      />
                      <StatusChip
                        tint={selectedUser.is_active ? 'bg-green-700/10 text-green-800' : 'bg-espresso/5 text-muted-foreground'}
                        label={selectedUser.is_active ? 'ACTIVE' : 'INACTIVE'}
                      />
                    </div>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-border rounded-md">
                    <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">User ID</p>
                    <p className="font-serif font-medium text-espresso text-lg">#{selectedUser.id}</p>
                  </div>
                  <div className="p-4 bg-white border border-border rounded-md">
                    <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">Joined On</p>
                    <p className="font-semibold text-espresso text-[13px]">{formatDate(selectedUser.created_at)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTime(selectedUser.created_at)}</p>
                  </div>
                  <div className="p-4 bg-white border border-border rounded-md col-span-2">
                    <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">Email Address</p>
                    <p className="font-medium text-espresso text-[13px] truncate">{selectedUser.email || "—"}</p>
                  </div>
                  <div className="p-4 bg-white border border-border rounded-md">
                    <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">Phone Number</p>
                    <p className="font-medium text-espresso text-[13px]">{selectedUser.phone || "—"}</p>
                  </div>
                  <div className="p-4 bg-white border border-border rounded-md">
                    <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">Status</p>
                    <p className={`font-semibold text-[13px] ${selectedUser.is_active ? 'text-green-800' : 'text-muted-foreground'}`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className={`gap-2 uppercase text-[11px] tracking-[0.12em] rounded-sm ${
                      selectedUser.is_active
                        ? 'bg-sale hover:bg-sale/90'
                        : 'bg-green-800 hover:bg-green-900'
                    } text-ivory`}
                    onClick={() => {
                      handleToggleStatus(selectedUser);
                      setIsDialogOpen(false);
                    }}
                  >
                    <Power className="h-4 w-4" />
                    {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;