import { useToast } from "./ui/use-toast.js";
import { useEffect } from "react";
import {
  Plus as PlusIcon,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  TrendingUp,
  Bell,
  Search,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import StatCard from "./StatCard";
import PieChart from "./charts/PieChart";
import BarChart from "./charts/BarChart";
import ApplicationTable from "./ApplicationTable";
import DeadlineList from "./DeadlineList";
import {
  getDashboardStats,
  getClients,
  getAppointments,
  getUpcomingDeadlines,
} from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageBox } from './MessageBox';

function Dashboard() {
  const { toast } = useToast();

  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getDashboardStats,
  });

  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: getClients,
  });

  const { data: appointmentData } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: getAppointments,
  });

  const { data: deadlinesData, isLoading: deadlinesLoading, error: deadlinesError } = useQuery({
    queryKey: ["/api/dashboard/upcoming-deadlines"],
    queryFn: getUpcomingDeadlines,
  });

  useEffect(() => {
    if (statsError) {
      toast({
        title: "Error loading dashboard stats",
        description: statsError.message,
        variant: "destructive",
      });
    }
    if (clientsError) {
      toast({
        title: "Error loading clients",
        description: clientsError.message,
        variant: "destructive",
      });
    }
    if (deadlinesError) {
      toast({
        title: "Error loading deadlines",
        description: deadlinesError.message,
        variant: "destructive",
      });
    }
  }, [statsError, clientsError, deadlinesError, toast]);

  const handleAddDeadline = () => {
    toast({
      title: "Add Deadline",
      description: "This feature is coming soon!",
    });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const stats = statsData?.data || {
    totalClients: 0,
    totalAppointments: 0,
    totalPayments: 0,
    totalTasks: 0,
    totalReminders: 0,
    todayStats: {
      newClients: 0,
      newAppointments: 0,
      paymentsReceived: 0,
      reminders:0
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const recentClients = (clientsData?.data || []).filter((client) => {
    const created = new Date(client.createdAt);
    return (
      created.getMonth() === currentMonth &&
      created.getFullYear() === currentYear
    );
  });

  const mappedRecentClients = recentClients.map((client) => ({
    id: client._id || client.id,
    client: {
      firstName: client.firstName || client.name || "",
      lastName: client.lastName || "",
      email: client.email || "",
    },
    visaType: client.visaType || "-",
    submissionDate: client.createdAt || client.submissionDate || "",
    status: client.status || "Pending",
    destination: client.destination || "-",
  }));

  const statusCounts = mappedRecentClients.reduce((acc, app) => {
    const status = app.status || "Pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          "#6366f1",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#06b6d4",
          "#f97316",
        ],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyCounts = Array(daysInMonth).fill(0);
  mappedRecentClients.forEach((app) => {
    const day = new Date(app.submissionDate).getDate();
    dailyCounts[day - 1]++;
  });

  const monthlyChartData = {
    labels: Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
    datasets: [
      {
        label: "Applications",
        data: dailyCounts,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const ModernStatCard = ({ title, value, icon, linkText, linkUrl, subtitle, trend }) => {
    const iconMap = {
      users: Users,
      calendar: Calendar,
      'dollar-sign': DollarSign,
      'check-circle': CheckCircle,
    };
    
    const IconComponent = iconMap[icon] || Users;
    
    return (
      <div className="group relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02]"></div>
        
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div className="relative p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                {title}
              </p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  {value}
                </h3>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {subtitle}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {linkUrl && (
            <Link href={linkUrl}>
              <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center space-x-1 group-hover:translate-x-1 transition-transform duration-300">
                <span>{linkText}</span>
                <span>→</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* U-shaped decorative header */}
      {/* <div className="absolute top-0 left-0 right-0 z-10">
        <svg
          className="w-full h-32"
          viewBox="0 0 1200 128"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path
            d="M0 0 H1200 V80 C900 140 600 20 0 80 Z"
            fill="url(#headerGradient)"
          />
        </svg>
      </div> */}

      {/* Main content */}
      <div className="relative z-20  p-6 space-y-8">
        
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 ml-5 flex items-center space-x-2">
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
            {/* Search bar */}
            <div className="hidden md:flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-full px-4 py-2 shadow-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-40 text-gray-600 dark:text-gray-300 placeholder-gray-400"
              />
            </div>
            
            {/* Notification bell */}
            <div className="relative p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            
            {/* New Client Button */}
            <Link to="/clients/new">
              <button className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>New Client</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Enhanced Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <ModernStatCard 
            title="Total Clients" 
            value={stats.totalClients} 
            icon="users" 
            linkText="View all" 
            linkUrl="/clients"
            subtitle={`+${stats.todayStats.newClients} today`}
          />
          <ModernStatCard 
            title="Total Appointments" 
            value={Math.max(0, stats.totalAppointments - 2)} 
            icon="calendar" 
            linkText="View all" 
            linkUrl="/appointments"
            subtitle={`+${stats.todayStats.newAppointments} today`}
          />
          <ModernStatCard 
            title="Total Payments" 
            value={stats.totalPayments} 
            icon="dollar-sign" 
            linkText="View all" 
            linkUrl="/payments"
            subtitle={`+${stats.todayStats.paymentsReceived} today`}
          />
          <ModernStatCard 
            title="Reminders" 
            value={stats.totalReminders} 
            icon="check-circle" 
            linkText="View all" 
            linkUrl="/reminders"
            subtitle={`+${stats.todayStats.reminders} pending`}
          />
        </div>

        {/* Enhanced Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <Card className="relative bg-transparent border-none shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent flex items-center space-x-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  <span>Application Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full flex items-center justify-center">
                  {clientsLoading ? (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <PieChart data={statusChartData} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <Card className="relative bg-transparent border-none shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent flex items-center space-x-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-600 rounded-full"></div>
                  <span>Monthly Applications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {clientsLoading ? (
                    <div className="flex items-center justify-center h-full space-x-2 text-gray-400">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <BarChart data={monthlyChartData} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Application Table */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-1">
            <ApplicationTable
              applications={mappedRecentClients}
              loading={clientsLoading}
              defaultFilter="This Month"
              title="Recent Applications (This Month)"
            />
          </div>
        </div>

        {/* Enhanced Deadlines */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-1">
            <DeadlineList
              deadlines={deadlinesData?.data || []}
              loading={deadlinesLoading}
              onAddDeadline={handleAddDeadline}
            />
          </div>
        </div>

        {/* Enhanced MessageBox */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-6">
            <MessageBox />
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Dashboard;         