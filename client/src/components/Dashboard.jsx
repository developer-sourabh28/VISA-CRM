import { useToast } from "./ui/use-toast.js";
import { useEffect } from "react";
import {
  Plus as PlusIcon,
  Calendar,
  DollarSign,
  Users as UsersIcon,
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
          "#f59e0b",
          "#d97706",
          "#b45309",
          "#92400e",
          "#78350f",
          "#eab308",
          "#ca8a04",
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
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#f59e0b",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const ModernStatCard = ({ title, value, icon, linkText, linkUrl, subtitle, trend }) => {
    const iconMap = {
      users: UsersIcon,
      calendar: Calendar,
      'dollar-sign': DollarSign,
      'check-circle': CheckCircle,
    };
    
    const IconComponent = iconMap[icon] || UsersIcon;
    
    return (
      <div className="group relative overflow-hidden">
        {/* Animated background gradient - Fixed dark mode colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02]"></div>
        
        {/* Decorative element - Adjusted opacity for dark mode */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 dark:from-amber-300/15 dark:to-yellow-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div className="relative p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                {title}
              </p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent">
                  {value}
                </h3>
                <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">
                {subtitle}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {linkUrl && (
            <Link href={linkUrl}>
              <button className="text-xs font-semibold text-amber-600 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-100 transition-colors flex items-center space-x-1 group-hover:translate-x-1 transition-transform duration-300">
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements - Reduced opacity for dark mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-amber-400/15 to-yellow-400/15 dark:from-amber-400/8 dark:to-yellow-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-r from-yellow-400/15 to-orange-400/15 dark:from-yellow-400/8 dark:to-orange-400/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-orange-400/15 to-amber-400/15 dark:from-orange-400/8 dark:to-amber-400/8 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent">
                Dashboard
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
            {/* Search bar - Improved dark mode colors */}
            <div className="hidden md:flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-full px-4 py-2 shadow-lg">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-40 text-gray-600 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            {/* Notification bell - Improved dark mode colors */}
            <div className="relative p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* New Client Button - Better dark mode contrast */}
            <Link to="/clients/new">
              <button className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-500 dark:to-yellow-500 hover:from-amber-700 hover:to-yellow-700 dark:hover:from-amber-600 dark:hover:to-yellow-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2">
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

        {/* Enhanced Charts - Fixed dark mode colors */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 dark:from-amber-300/15 dark:to-yellow-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <Card className="relative bg-transparent border-none shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center space-x-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 rounded-full"></div>
                  <span>Application Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full flex items-center justify-center">
                  {clientsLoading ? (
                    <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
                      <div className="w-4 h-4 border-2 border-amber-500 dark:border-amber-400 border-t-transparent rounded-full animate-spin"></div>
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
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 dark:from-yellow-300/15 dark:to-orange-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <Card className="relative bg-transparent border-none shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center space-x-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-600 dark:from-yellow-400 dark:to-orange-500 rounded-full"></div>
                  <span>Monthly Applications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {clientsLoading ? (
                    <div className="flex items-center justify-center h-full space-x-2 text-gray-400 dark:text-gray-500">
                      <div className="w-4 h-4 border-2 border-amber-500 dark:border-amber-400 border-t-transparent rounded-full animate-spin"></div>
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

        {/* Enhanced Application Table - Fixed dark mode colors */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-400/20 dark:from-amber-300/15 dark:to-orange-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-1">
            <ApplicationTable
              applications={mappedRecentClients}
              loading={clientsLoading}
              defaultFilter="This Month"
              title="Recent Applications (This Month)"
            />
          </div>
        </div>

        {/* Enhanced Deadlines - Fixed dark mode colors */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 dark:from-yellow-300/15 dark:to-amber-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-1">
            <DeadlineList
              deadlines={deadlinesData?.data || []}
              loading={deadlinesLoading}
              onAddDeadline={handleAddDeadline}
            />
          </div>
        </div>

        {/* Enhanced MessageBox - Fixed dark mode colors */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 dark:from-orange-300/15 dark:to-yellow-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-6">
            <MessageBox />
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Dashboard;