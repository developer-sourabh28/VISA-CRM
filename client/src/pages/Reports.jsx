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
  Building,
  ChevronDown
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
import { Separator } from "../components/ui/separator";
// import BackButton from "../components/BackButton";

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
  getPnlData
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

  // Extract data from queries with default values
  const revenueItems = revenueData?.data || [];
  const expensesItems = expensesData?.data || [];
  const chartData = revenueChartData?.data || [];
  const expenseChartItems = expenseChartData?.data || [];
  const pnlItems = pnlData?.data?.pnlData || [];
  const pnlSummary = pnlData?.data?.summary || { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };

  // Calculate summary statistics with null checks
  const revenueStats = useMemo(() => {
    const totalRevenue = revenueItems.reduce((sum, item) => sum + (item?.amountReceived || 0), 0);
    const totalPending = revenueItems.reduce((sum, item) => sum + (item?.pendingAmount || 0), 0);
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
    const totalExpenses = expensesItems.reduce((sum, item) => sum + (item?.amount || 0), 0);
    const totalExpensesCount = expensesItems.length;
    const avgExpense = totalExpensesCount > 0 ? totalExpenses / totalExpensesCount : 0;
    const categories = expensesItems.reduce((acc, item) => {
      if (item?.category) {
        acc[item.category] = (acc[item.category] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      totalExpenses,
      totalExpensesCount,
      avgExpense,
      categories
    };
  }, [expensesItems]);

  const pnlStats = useMemo(() => {
    if (pnlSummary?.totalRevenue > 0) {
      return {
        totalRevenue: pnlSummary.totalRevenue || 0,
        totalExpenses: pnlSummary.totalExpenses || 0,
        netProfit: pnlSummary.netProfit || 0
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
          title: "Success",
          description: `Payment updated for ${paymentModal.application.clientName}`,
        });
        setPaymentModal({ isOpen: false, application: null, newAmount: 0 });
        refetchRevenue();
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
      title: "Success",
      description: "Reports data has been refreshed",
    });
  };

  if (revenueLoading || expensesLoading || revenueChartLoading || expenseChartLoading || pnlLoading) {
    return (
      <div className="flex h-[450px] w-full items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (revenueError || expensesError || revenueChartError || expenseChartError || pnlError) {
    return (
      <div className="flex h-[450px] w-full items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
          <p className="font-medium">Error loading reports</p>
          <p>{revenueError || expensesError || revenueChartError || expenseChartError || pnlError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        {/* <BackButton /> */}
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Financial Reports
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-5 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={handleRefresh}
              className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            
            <Button
              className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Download className="w-5 h-5" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 dark:text-white">
          <TabsList className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-full p-1">
            <TabsTrigger value="revenue" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              <TrendingDown className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="pnl" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              P&L
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
                    <DollarSign className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{revenueStats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">+20.1% from last month</p>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Amount</h3>
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{revenueStats.totalPending.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{revenueStats.totalApplications} total applications</p>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Revenue</h3>
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{revenueStats.avgRevenue.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Per application</p>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Collection Rate</h3>
                    <PieChart className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {((revenueStats.totalRevenue / (revenueStats.totalRevenue + revenueStats.totalPending)) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Of total invoiced amount</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="group relative overflow-hidden mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Date Range</Label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                    >
                      <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Visa Type</Label>
                    <Select
                      value={filters.visaType}
                      onValueChange={(value) => setFilters({ ...filters, visaType: value })}
                    >
                      <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50">
                        <SelectValue placeholder="Select visa type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="tourist">Tourist</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Nationality</Label>
                    <Select
                      value={filters.nationality}
                      onValueChange={(value) => setFilters({ ...filters, nationality: value })}
                    >
                      <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                        <SelectItem value="all">All Nationalities</SelectItem>
                        <SelectItem value="indian">Indian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Source</Label>
                    <Select
                      value={filters.source}
                      onValueChange={(value) => setFilters({ ...filters, source: value })}
                    >
                      <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Table */}
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Details</h3>
                  <Button
                    variant="outline"
                    className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Client Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Visa Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount Received</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Pending Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueItems.map((item) => (
                        <tr 
                          key={item?._id || Math.random()}
                          className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="text-gray-900 dark:text-white py-3 px-4">{item?.clientName || 'N/A'}</td>
                          <td className="text-gray-900 dark:text-white py-3 px-4">{item?.visaType || 'N/A'}</td>
                          <td className="text-gray-900 dark:text-white py-3 px-4">₹{(item?.amountReceived || 0).toLocaleString()}</td>
                          <td className="text-gray-900 dark:text-white py-3 px-4">₹{(item?.pendingAmount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item?.status === 'Paid'
                                  ? "bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                  : "bg-yellow-100/40 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                              }`}
                            >
                              {item?.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePaymentUpdate(item)}
                                className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
                    <DollarSign className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{expenseStats.totalExpenses.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">+12.3% from last month</p>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Expense</h3>
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{expenseStats.avgExpense.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Per transaction</p>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</h3>
                    <CreditCard className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{expenseStats.totalExpensesCount}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This period</p>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expense Categories</h3>
                    <PieChart className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{Object.keys(expenseStats.categories || {}).length}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Active categories</p>
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Details</h3>
                  <Button
                    variant="outline"
                    className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesItems.map((item) => (
                        <tr 
                          key={item?._id || Math.random()}
                          className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="text-gray-900 dark:text-white py-3 px-4">{item?.description || 'N/A'}</td>
                          <td className="text-gray-900 dark:text-white py-3 px-4">{item?.category || 'N/A'}</td>
                          <td className="text-gray-900 dark:text-white py-3 px-4">₹{(item?.amount || 0).toLocaleString()}</td>
                          <td className="text-gray-900 dark:text-white py-3 px-4">{item?.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleExpenseEdit(item)}
                                className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pnl" className="space-y-6">
            {/* P&L Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">₹{pnlStats.totalRevenue.toLocaleString()}</div>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">₹{pnlStats.totalExpenses.toLocaleString()}</div>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit</h3>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{pnlStats.netProfit.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* P&L Table */}
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profit & Loss Statement</h3>
                  <Button
                    variant="outline"
                    className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Month</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Expenses</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Profit/Loss</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pnlItems.map((item) => (
                        <tr 
                          key={item?.month || Math.random()}
                          className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="text-gray-900 dark:text-white py-3 px-4">{item?.month || 'N/A'}</td>
                          <td className="text-green-600 dark:text-green-400 py-3 px-4">₹{(item?.revenue || 0).toLocaleString()}</td>
                          <td className="text-red-600 dark:text-red-400 py-3 px-4">₹{(item?.expenses || 0).toLocaleString()}</td>
                          <td className={(item?.profit || 0) >= 0 ? "text-green-600 dark:text-green-400 py-3 px-4" : "text-red-600 dark:text-red-400 py-3 px-4"}>
                            ₹{(item?.profit || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                (item?.margin || 0) >= 0
                                  ? "bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                  : "bg-red-100/40 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                              }`}
                            >
                              {item?.margin || 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Update Modal */}
      <Dialog open={paymentModal.isOpen} onOpenChange={(open) => setPaymentModal({ ...paymentModal, isOpen: open })}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-2xl p-0 overflow-hidden sm:max-w-[425px]">
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
          
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Update Payment</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Update the payment amount for {paymentModal.application?.clientName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 pt-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-700 dark:text-gray-300">New Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentModal.newAmount}
                  onChange={(e) => setPaymentModal({ ...paymentModal, newAmount: parseFloat(e.target.value) })}
                  placeholder="Enter amount"
                  className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="bg-gray-50/80 dark:bg-gray-800/80 p-6 border-t border-gray-200/50 dark:border-gray-600/50">
            <Button 
              variant="outline" 
              onClick={() => setPaymentModal({ isOpen: false, application: null, newAmount: 0 })}
              className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePaymentSubmit}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Update Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  