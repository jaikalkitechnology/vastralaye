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
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="border border-gray-200/50 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">User Management</h1>
            <p className="text-gray-600 text-base">Manage and monitor all user accounts across the platform</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                fetchUsers();
                fetchStats();
              }}
              className="gap-2 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="default" className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 opacity-70" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100 mb-1">Total Users</p>
                <p className="text-4xl font-bold tracking-tight">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <UserCheck className="h-6 w-6" />
                </div>
                <Activity className="h-5 w-5 opacity-70" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-100 mb-1">Active Users</p>
                <p className="text-4xl font-bold tracking-tight">{stats.active}</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Users */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Shield className="h-6 w-6" />
                </div>
                <CheckCircle className="h-5 w-5 opacity-70" />
              </div>
              <div>
                <p className="text-sm font-medium text-violet-100 mb-1">Administrators</p>
                <p className="text-4xl font-bold tracking-tight">{stats.admins}</p>
              </div>
            </CardContent>
          </Card>

          {/* Inactive Users */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <UserX className="h-6 w-6" />
                </div>
                <XCircle className="h-5 w-5 opacity-70" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-100 mb-1">Inactive Users</p>
                <p className="text-4xl font-bold tracking-tight">{stats.inactive}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-11 h-11 border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                  <SelectTrigger className="w-[160px] h-10 border-gray-300">
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
                  <SelectTrigger className="w-[160px] h-10 border-gray-300">
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
                  <SelectTrigger className="w-[160px] h-10 border-gray-300">
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
                    <Button variant="outline" className="h-10 border-gray-300 gap-2">
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
                  <SelectTrigger className="w-[160px] h-10 border-gray-300">
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
                  <SelectTrigger className="w-[140px] h-10 border-gray-300">
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
                  <SelectTrigger className="w-[140px] h-10 border-gray-300">
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
                    className="h-10 gap-2 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Active Filters:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchTerm}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                    </Badge>
                  )}
                  {roleFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Role: {roleFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter('all')} />
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {statusFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                    </Badge>
                  )}
                  {verifiedFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Verified: {verifiedFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setVerifiedFilter('all')} />
                    </Badge>
                  )}
                  {dateFrom && (
                    <Badge variant="secondary" className="gap-1">
                      From: {formatDate(dateFrom)}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFrom('')} />
                    </Badge>
                  )}
                  {dateTo && (
                    <Badge variant="secondary" className="gap-1">
                      To: {formatDate(dateTo)}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setDateTo('')} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        {loading ? (
          <SkeletonLoader />
        ) : users.length === 0 ? (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "We couldn't find any users matching your search criteria. Try adjusting your filters."
                  : "There are no users in the system yet. Users will appear here once they register."}
              </p>
              {hasActiveFilters && (
                <Button 
                  onClick={clearAllFilters}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Users Cards */}
            <div className="space-y-4">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className="border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="p-6">
                    {/* User Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className={`h-14 w-14 ring-4 ${
                            user.role === 'admin' 
                              ? 'ring-violet-100 bg-gradient-to-br from-violet-500 to-violet-700' 
                              : 'ring-blue-100 bg-gradient-to-br from-blue-500 to-blue-700'
                          } shadow-lg`}>
                            <AvatarFallback className="bg-transparent text-white font-semibold text-lg">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                            user.is_active ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-gray-900 text-lg">
                              {getFullName(user)}
                            </h3>
                            <Badge
                              className={`${
                                user.role === 'admin' 
                                  ? 'bg-violet-100 text-violet-700 border-violet-200' 
                                  : 'bg-blue-100 text-blue-700 border-blue-200'
                              } border font-semibold px-3 py-1`}
                            >
                              {user.role.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 font-medium">
                            User ID: #{user.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right bg-gray-50 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-1.5 text-gray-900 font-medium text-sm mb-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {formatDate(user.created_at)}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          {formatTime(user.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm mb-4 sm:mb-0">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium truncate max-w-[200px]">
                            {user.email || "No email"}
                          </span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                              <Phone className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="text-gray-700 font-medium">{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${user.is_active ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {user.is_active ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <span className={`font-semibold text-sm ${user.is_active ? 'text-emerald-700' : 'text-red-700'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="default"
                          className="gap-2 hover:bg-gray-50 border-gray-300"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          size="default"
                          className={`gap-2 ${
                            user.is_active 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          } shadow-sm`}
                          onClick={() => handleToggleStatus(user)}
                        >
                          <Power className="h-4 w-4" />
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 font-medium">
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {(currentPage - 1) * usersPerPage + 1} - {Math.min(currentPage * usersPerPage, totalCount)}
                  </span>{" "}
                  of <span className="font-bold text-gray-900">{totalCount}</span> users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="gap-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className={`w-10 h-10 p-0 ${
                            currentPage === pageNum 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                              : 'border-gray-300 hover:bg-gray-50'
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
                    className="gap-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <DialogTitle className="flex items-center gap-2.5 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-700" />
                </div>
                User Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Profile Section */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="relative">
                    <Avatar className={`h-16 w-16 ring-4 ${
                      selectedUser.role === 'admin' 
                        ? 'ring-violet-100 bg-gradient-to-br from-violet-500 to-violet-700' 
                        : 'ring-blue-100 bg-gradient-to-br from-blue-500 to-blue-700'
                    } shadow-lg`}>
                      <AvatarFallback className="bg-transparent text-white text-xl font-bold">
                        {getInitials(selectedUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm ${
                      selectedUser.is_active ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1.5">{getFullName(selectedUser)}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={`${
                        selectedUser.role === 'admin' 
                          ? 'bg-violet-100 text-violet-700 border-violet-200' 
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      } border font-semibold`}>
                        {selectedUser.role.toUpperCase()}
                      </Badge>
                      <Badge className={`${
                        selectedUser.is_active 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                          : 'bg-red-100 text-red-700 border-red-200'
                      } border font-semibold`}>
                        {selectedUser.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">User ID</p>
                    <p className="font-bold text-gray-900 text-lg">#{selectedUser.id}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Joined On</p>
                    <p className="font-bold text-gray-900">{formatDate(selectedUser.created_at)}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(selectedUser.created_at)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Address</p>
                    <p className="font-medium text-gray-900 truncate">{selectedUser.email || "—"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone Number</p>
                    <p className="font-medium text-gray-900">{selectedUser.phone || "—"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                    <p className={`font-bold ${selectedUser.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                  <Button
                    className={`gap-2 ${
                      selectedUser.is_active 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    } text-white shadow-sm`}
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