import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../components/ui/use-toast.js";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw,
  Search,
  Eye,
  Edit,
  Plus,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Globe,
  CreditCard,
  Building
} from "lucide-react";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";

// Chart components (we'll use Recharts)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// API Service
import { 
  getRevenueData, 
  getExpensesData, 
  updatePaymentAmount,
  getRevenueChartData,
  getExpenseChartData,
  getPnlData,
  mockRevenueData,
  mockExpensesData
} from '../lib/reportsApi';

export default function Reports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("revenue");
  const [filters, setFilters] = useState({
    dateRange: "all",
    visaType: "all",
    nationality: "all",
    source: "all",
    startDate: "",
    endDate: ""
  });

  // Payment Update Modal
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    application: null,
    newAmount: 0
  });

  // Queries for data fetching
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue, error: revenueError } = useQuery({
    queryKey: ['revenue-data', filters],
    queryFn: () => getRevenueData(filters),
    refetchOnWindowFocus: false,
  });

  const { data: expensesData, isLoading: expensesLoading, refetch: refetchExpenses, error: expensesError } = useQuery({
    queryKey: ['expenses-data', filters],
    queryFn: () => getExpensesData(filters),
    refetchOnWindowFocus: false,
  });

  const { data: revenueChartData, isLoading: revenueChartLoading, error: revenueChartError } = useQuery({
    queryKey: ['revenue-chart', filters],
    queryFn: () => getRevenueChartData(filters),
    refetchOnWindowFocus: false,
  });

  const { data: expenseChartData, isLoading: expenseChartLoading, error: expenseChartError } = useQuery({
    queryKey: ['expense-chart', filters],
    queryFn: () => getExpenseChartData(filters),
    refetchOnWindowFocus: false,
  });

  const { data: pnlData, isLoading: pnlLoading, error: pnlError } = useQuery({
    queryKey: ['pnl-data', filters],
    queryFn: () => getPnlData(filters),
    refetchOnWindowFocus: false,
  });

  // Extract data from queries
  const revenueItems = revenueData?.data || mockRevenueData;
  const expensesItems = expensesData?.data || mockExpensesData;
  const chartData = revenueChartData?.data || [];
  const expenseChartItems = expenseChartData?.data || [];
  const pnlItems = pnlData?.data?.pnlData || [];
  const pnlSummary = pnlData?.data?.summary || { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };

  // Calculate summary statistics
  const revenueStats = useMemo(() => {
    const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amountReceived, 0);
    const totalPending = revenueItems.reduce((sum, item) => sum + item.pendingAmount, 0);
    const totalApplications = revenueItems.length;
    const avgRevenue = totalApplications > 0 ? totalRevenue / totalApplications : 0;

    return {
      totalRevenue,
      totalPending,
      totalApplications,
      avgRevenue
    };
  }, [revenueItems]);

  const expenseStats = useMemo(() => {
    const totalExpenses = expensesItems.reduce((sum, item) => sum + item.amount, 0);
    const totalExpensesCount = expensesItems.length;
    const avgExpense = totalExpensesCount > 0 ? totalExpenses / totalExpensesCount : 0;

    return {
      totalExpenses,
      totalExpensesCount,
      avgExpense
    };
  }, [expensesItems]);

  const pnlStats = useMemo(() => {
    // Use PNL summary data if available, otherwise calculate from revenue and expenses
    if (pnlSummary.totalRevenue > 0) {
      return {
        totalRevenue: pnlSummary.totalRevenue,
        totalExpenses: pnlSummary.totalExpenses,
        netProfit: pnlSummary.netProfit
      };
    }
    
    const totalRevenue = revenueStats.totalRevenue;
    const totalExpenses = expenseStats.totalExpenses;
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit
    };
  }, [revenueStats, expenseStats, pnlSummary]);

  // Visa type chart data
  const visaTypeChartData = useMemo(() => {
    const visaTypes = {};
    revenueItems.forEach(item => {
      if (!visaTypes[item.visaType]) {
        visaTypes[item.visaType] = { revenue: 0, count: 0 };
      }
      visaTypes[item.visaType].revenue += item.amountReceived;
      visaTypes[item.visaType].count += 1;
    });

    return Object.entries(visaTypes).map(([type, data]) => ({
      type,
      revenue: data.revenue,
      count: data.count
    }));
  }, [revenueItems]);

  const handlePaymentUpdate = (application) => {
    setPaymentModal({
      isOpen: true,
      application,
      newAmount: application.amountReceived
    });
  };

  const handlePaymentSubmit = async () => {
    try {
      const response = await updatePaymentAmount(paymentModal.application.id, paymentModal.newAmount);
      
      if (response.success) {
        toast({
          title: "Payment Updated",
          description: `Payment updated for ${paymentModal.application.clientName}`,
        });
        setPaymentModal({ isOpen: false, application: null, newAmount: 0 });
        refetchRevenue(); // Refresh the data
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetchRevenue();
    refetchExpenses();
    toast({
      title: "Refreshed",
      description: "Reports data has been refreshed",
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
              <p className="text-gray-600 mt-1">Financial insights and analytics for your visa business</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              <Button 
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                disabled={revenueLoading || expensesLoading}
              >
                <RefreshCw className={`w-4 h-4 ${(revenueLoading || expensesLoading) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenueStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs opacity-90 mt-1">From {revenueStats.totalApplications} applications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${expenseStats.totalExpenses.toLocaleString()}</div>
              <p className="text-xs opacity-90 mt-1">From {expenseStats.totalExpensesCount} transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pnlStats.netProfit.toLocaleString()}</div>
              <p className="text-xs opacity-90 mt-1">
                {pnlStats.netProfit >= 0 ? '+' : ''}{pnlStats.totalRevenue > 0 ? ((pnlStats.netProfit / pnlStats.totalRevenue) * 100).toFixed(1) : '0'}% margin
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenueStats.totalPending.toLocaleString()}</div>
              <p className="text-xs opacity-90 mt-1">Outstanding payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="revenue" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Revenue Report
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <TrendingDown className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="pnl" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Profit & Loss
            </TabsTrigger>
          </TabsList>

          {/* Revenue Report Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Date Range</Label>
                    <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Visa Type</Label>
                    <Select value={filters.visaType} onValueChange={(value) => setFilters(prev => ({ ...prev, visaType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Work">Work</SelectItem>
                        <SelectItem value="Tourist">Tourist</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <Select value={filters.nationality} onValueChange={(value) => setFilters(prev => ({ ...prev, nationality: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Nationalities</SelectItem>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="Pakistani">Pakistani</SelectItem>
                        <SelectItem value="Nigerian">Nigerian</SelectItem>
                        <SelectItem value="Ghanaian">Ghanaian</SelectItem>
                        <SelectItem value="Kenyan">Kenyan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Select value={filters.source} onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="FB">Facebook Lead</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue and application trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueChartLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading chart...</span>
                      </div>
                    </div>
                  ) : revenueChartError ? (
                    <div className="flex items-center justify-center h-[300px] text-red-500">
                      <span>Error loading chart data</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
                        <Bar dataKey="applications" fill="#10B981" name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Visa Type</CardTitle>
                  <CardDescription>Revenue breakdown by visa category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={visaTypeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Table */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Details</CardTitle>
                <CardDescription>Detailed breakdown of all revenue transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading revenue data...</span>
                    </div>
                  </div>
                ) : revenueError ? (
                  <div className="flex items-center justify-center py-8 text-red-500">
                    <span>Error loading revenue data</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application ID</TableHead>
                          <TableHead>Client Name</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Visa Type</TableHead>
                          <TableHead>Application Date</TableHead>
                          <TableHead>Total Charges</TableHead>
                          <TableHead>Amount Received</TableHead>
                          <TableHead>Pending Amount</TableHead>
                          <TableHead>Payment Mode</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenueItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.clientName}</TableCell>
                            <TableCell>{item.country}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.visaType}</Badge>
                            </TableCell>
                            <TableCell>{new Date(item.applicationDate).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">${item.totalCharges.toLocaleString()}</TableCell>
                            <TableCell className="font-medium text-green-600">${item.amountReceived.toLocaleString()}</TableCell>
                            <TableCell className={item.pendingAmount > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                              ${item.pendingAmount.toLocaleString()}
                            </TableCell>
                            <TableCell>{item.paymentMode}</TableCell>
                            <TableCell>
                              <Badge variant={item.source === "FB" ? "default" : "secondary"}>
                                {item.source}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePaymentUpdate(item)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                  <CardDescription>Category-wise expense distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {expenseChartLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading chart...</span>
                      </div>
                    </div>
                  ) : expenseChartError ? (
                    <div className="flex items-center justify-center h-[300px] text-red-500">
                      <span>Error loading chart data</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={expenseChartItems}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {expenseChartItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Expenses</CardTitle>
                  <CardDescription>Expense trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { month: 'Jan', expenses: 23000 },
                      { month: 'Feb', expenses: 25000 },
                      { month: 'Mar', expenses: 22000 },
                      { month: 'Apr', expenses: 28000 },
                      { month: 'May', expenses: 24000 },
                      { month: 'Jun', expenses: 26000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="#FEE2E2" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Expenses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
                <CardDescription>Detailed breakdown of all expenses</CardDescription>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading expenses data...</span>
                    </div>
                  </div>
                ) : expensesError ? (
                  <div className="flex items-center justify-center py-8 text-red-500">
                    <span>Error loading expenses data</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Expense Name</TableHead>
                          <TableHead>Payment Type</TableHead>
                          <TableHead>Paid To</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Bank</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expensesItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.paymentType}</Badge>
                            </TableCell>
                            <TableCell>{item.paidTo}</TableCell>
                            <TableCell className="font-medium text-red-600">${item.amount.toLocaleString()}</TableCell>
                            <TableCell>{item.mode}</TableCell>
                            <TableCell>{item.bank}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit & Loss Tab */}
          <TabsContent value="pnl" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${pnlStats.totalRevenue.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${pnlStats.totalExpenses.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-r ${pnlStats.netProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600'} text-white`}>
                <CardHeader>
                  <CardTitle className="text-lg">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${pnlStats.netProfit.toLocaleString()}</div>
                  <p className="text-sm opacity-90 mt-1">
                    {pnlStats.netProfit >= 0 ? '+' : ''}{pnlStats.totalRevenue > 0 ? ((pnlStats.netProfit / pnlStats.totalRevenue) * 100).toFixed(1) : '0'}% margin
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* PNL Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Overview</CardTitle>
                <CardDescription>Revenue vs Expenses comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={[
                    { category: 'Revenue', amount: pnlStats.totalRevenue, color: '#10B981' },
                    { category: 'Expenses', amount: pnlStats.totalExpenses, color: '#EF4444' },
                    { category: 'Net Profit', amount: pnlStats.netProfit, color: pnlStats.netProfit >= 0 ? '#3B82F6' : '#EF4444' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* PNL Table */}
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Details</CardTitle>
                <CardDescription>Client-wise profit and loss breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {pnlLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading PNL data...</span>
                    </div>
                  </div>
                ) : pnlError ? (
                  <div className="flex items-center justify-center py-8 text-red-500">
                    <span>Error loading PNL data</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client Name</TableHead>
                          <TableHead>Amount Received</TableHead>
                          <TableHead>Expense Amount</TableHead>
                          <TableHead>Net Profit</TableHead>
                          <TableHead>Profit Margin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pnlItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.clientName}</TableCell>
                            <TableCell className="text-green-600 font-medium">${item.amountReceived.toLocaleString()}</TableCell>
                            <TableCell className="text-red-600 font-medium">${item.expenseAmount.toFixed(0)}</TableCell>
                            <TableCell className={`font-medium ${item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${item.netProfit.toFixed(0)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.profitMargin >= 0 ? "default" : "destructive"}>
                                {item.profitMargin.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Update Modal */}
      <Dialog open={paymentModal.isOpen} onOpenChange={(open) => setPaymentModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Amount</DialogTitle>
            <DialogDescription>
              Update the received amount for {paymentModal.application?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Amount Received</Label>
              <Input
                value={`$${paymentModal.application?.amountReceived.toLocaleString()}`}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>New Amount Received</Label>
              <Input
                type="number"
                value={paymentModal.newAmount}
                onChange={(e) => setPaymentModal(prev => ({ ...prev, newAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter new amount"
              />
            </div>
            <div>
              <Label>Pending Amount</Label>
              <Input
                value={`$${(paymentModal.application?.totalCharges - paymentModal.newAmount).toLocaleString()}`}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModal({ isOpen: false, application: null, newAmount: 0 })}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit}>
              Update Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  