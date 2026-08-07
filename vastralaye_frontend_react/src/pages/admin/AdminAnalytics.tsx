import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  DollarSign,
  Package,
  Calendar
} from 'lucide-react';

const AdminAnalytics = () => {
  // Mock data - replace with actual API data
  const analyticsData = {
    totalSales: 1250000,
    totalOrders: 1247,
    averageOrderValue: 1002,
    monthlyGrowth: 12.5,
    activeCustomers: 892,
    newCustomers: 45,
    conversionRate: 3.2,
    topCategories: [
      { name: 'Electronics', value: 35, sales: 437500 },
      { name: 'Fashion', value: 25, sales: 312500 },
      { name: 'Home & Kitchen', value: 20, sales: 250000 },
      { name: 'Books', value: 12, sales: 150000 },
      { name: 'Others', value: 8, sales: 100000 },
    ],
    monthlySales: [
      { month: 'Jan', sales: 98000, orders: 98 },
      { month: 'Feb', sales: 102000, orders: 104 },
      { month: 'Mar', sales: 115000, orders: 112 },
      { month: 'Apr', sales: 108000, orders: 105 },
      { month: 'May', sales: 125000, orders: 124 },
      { month: 'Jun', sales: 132000, orders: 128 },
      { month: 'Jul', sales: 118000, orders: 115 },
      { month: 'Aug', sales: 127000, orders: 122 },
      { month: 'Sep', sales: 135000, orders: 130 },
      { month: 'Oct', sales: 142000, orders: 138 },
      { month: 'Nov', sales: 128000, orders: 125 },
      { month: 'Dec', sales: 148000, orders: 145 },
    ]
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your store performance and key metrics</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.totalSales)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <p className="text-xs text-green-600 font-medium">
                +{analyticsData.monthlyGrowth}% this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(analyticsData.totalOrders)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(analyticsData.activeCustomers)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">
                +{analyticsData.newCustomers} new this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Order Value</CardTitle>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Package className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.averageOrderValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per order average
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
          <TabsTrigger 
            value="sales" 
            className="data-[state=active]:bg-[#1A2456] data-[state=active]:text-white rounded-md"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Sales Overview
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="data-[state=active]:bg-[#1A2456] data-[state=active]:text-white rounded-md"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="customers" 
            className="data-[state=active]:bg-[#1A2456] data-[state=active]:text-white rounded-md"
          >
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Monthly Sales Performance
                </CardTitle>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Last 12 months</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analyticsData.monthlySales.map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium text-gray-900">{month.month}</div>
                      <div className="w-48 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-[#1A2456] h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(month.sales / 150000) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(month.sales)}</div>
                      <div className="text-sm text-gray-500">{month.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Sales by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analyticsData.topCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-24 text-sm font-medium text-gray-900">{category.name}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${category.value}%`,
                            backgroundColor: `hsl(${index * 60}, 70%, 45%)`
                          }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm text-gray-600">{category.value}%</div>
                    </div>
                    <div className="w-24 text-right font-semibold text-gray-900">
                      {formatCurrency(category.sales)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Customer Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Customers</span>
                    <span className="font-bold text-blue-600">{formatNumber(analyticsData.activeCustomers)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">New This Month</span>
                    <span className="font-bold text-green-600">+{analyticsData.newCustomers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                    <span className="font-bold text-purple-600">{analyticsData.conversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Customer Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Repeat Customers</span>
                    <span className="font-semibold text-gray-900">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Session Duration</span>
                    <span className="font-semibold text-gray-900">4.2 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cart Abandonment</span>
                    <span className="font-semibold text-gray-900">22%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Satisfaction</span>
                    <span className="font-semibold text-gray-900">4.8/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminAnalytics;