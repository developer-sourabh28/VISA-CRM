import { useToast } from "./ui/use-toast.js";
import { useEffect, useState } from "react";
import {
  Plus as PlusIcon,
  Calendar,
  DollarSign,
  Users as UsersIcon,
  CheckCircle,
  TrendingUp,
  Bell,
  Search,
  ChevronDown,
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
import { useUser } from '../context/UserContext';
import { getPnlData } from "../lib/reportsApi";

function getClientVisaStatus(client, visaTracker) {
  if (!visaTracker) return "Incomplete";
  const steps = [
    visaTracker.agreement?.completed,
    visaTracker.meeting?.completed,
    visaTracker.documentCollection?.completed,
    visaTracker.visaApplication?.completed,
    visaTracker.supportingDocuments?.completed,
    visaTracker.payment?.completed,
    visaTracker.appointment?.completed,
    visaTracker.visaOutcome?.completed
  ];
  const completedCount = steps.filter(Boolean).length;
  if (completedCount === 0) return "Incomplete";
  if (completedCount === steps.length) return "Completed";
  return "Active";
}

function Dashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const userBranch = user?.branch || 'Main Office';

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    console.log('Current user:', user);
    console.log('Current user branch:', userBranch);
  }, [user, userBranch]);

  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats", userBranch, selectedMonth + 1, selectedYear],
    queryFn: () => getDashboardStats(userBranch, selectedMonth + 1, selectedYear),
    enabled: !!userBranch
  });

  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ["/api/clients", userBranch, selectedMonth + 1, selectedYear],
    queryFn: () => getClients(userBranch, selectedMonth + 1, selectedYear),
    enabled: !!userBranch
  });

  const { data: appointmentData } = useQuery({
    queryKey: ["/api/appointments", userBranch, selectedMonth + 1, selectedYear],
    queryFn: () => getAppointments(userBranch, selectedMonth + 1, selectedYear),
    enabled: !!userBranch
  });

  const { data: deadlinesData, isLoading: deadlinesLoading, error: deadlinesError } = useQuery({
    queryKey: ["/api/dashboard/upcoming-deadlines", userBranch, selectedMonth + 1, selectedYear],
    queryFn: () => getUpcomingDeadlines(userBranch, selectedMonth + 1, selectedYear),
    enabled: !!userBranch
  });

  const { data: pnlData, isLoading: pnlLoading, error: pnlError } = useQuery({
    queryKey: ["/api/reports/pnl", userBranch, selectedMonth + 1, selectedYear],
    queryFn: () => getPnlData({ branch: userBranch, month: selectedMonth + 1, year: selectedYear }),
    enabled: !!userBranch
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get years from current year - 2 to current year
  const years = Array.from(
    { length: 3 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["/api/dashboard/charts/monthly-applications", selectedMonth + 1, selectedYear, userBranch],
    queryFn: () => fetch(`/api/dashboard/charts/monthly-applications?month=${selectedMonth + 1}&year=${selectedYear}&branch=${encodeURIComponent(userBranch)}`)
      .then(res => res.json())
      .then(data => data.data),
    enabled: !!userBranch
  });

  const totalRevenue = pnlData?.data?.summary?.totalRevenue || 0;

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

  const recentClients = clientsData?.data || [];

  const mappedRecentClients = recentClients.map((client) => ({
    id: client._id || client.id,
    client: {
      firstName: client.firstName || client.name || "",
      lastName: client.lastName || "",
      email: client.email || "",
    },
    visaType: client.visaType || "-",
    submissionDate: client.createdAt || client.submissionDate || "",
    status: getClientVisaStatus(client, client.visaTracker),
    destination: client.destination || "-",
  }));

  const statusCounts = {
    Incomplete: 0,
    Active: 0,
    Completed: 0
  };

  mappedRecentClients.forEach((app) => {
    statusCounts[app.status]++;
  });

  const statusChartData = {
    labels: ["Incomplete", "Active", "Completed"],
    datasets: [{
      data: [statusCounts.Incomplete, statusCounts.Active, statusCounts.Completed],
      backgroundColor: [
        "#f59e0b",
        "#d97706",
        "#b45309",
      ],
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyCounts = Array(daysInMonth).fill(0);
  mappedRecentClients.forEach((app) => {
    const day = new Date(app.submissionDate).getDate();
    dailyCounts[day - 1]++;
  });

  const monthlyChartData = {
    labels: monthlyData ? monthlyData.map(item => item.day.toString()) : [],
    datasets: [
      {
        label: "Applications",
        data: monthlyData ? monthlyData.map(item => item.count) : [],
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
        {/* Background without shadows */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-2xl transition-all duration-500 group-hover:scale-[1.02]"></div>
        
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
        
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
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-amber-400/15 to-yellow-400/15 dark:from-amber-400/8 dark:to-yellow-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-r from-yellow-400/15 to-orange-400/15 dark:from-yellow-400/8 dark:to-orange-400/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-orange-400/15 to-amber-400/15 dark:from-orange-400/8 dark:to-amber-400/8 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        
        {/* Header */}
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
              {/* <span className="text-amber-600 dark:text-amber-400 font-medium ml-2">
                | Branch: {userBranch}
              </span> */}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1 w-18 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <ModernStatCard 
            title="Total Clients" 
            value={stats.totalClients} 
            icon="users" 
            linkText="View all" 
            linkUrl="/clients"
            // subtitle={`+${stats.todayStats.newClients} today`}
          />
          <ModernStatCard 
            title="Total Appointments" 
            value={Math.max(0, stats.totalAppointments - 2)} 
            icon="calendar" 
            linkText="View all" 
            linkUrl="/appointments"
            // subtitle={`+${stats.todayStats.newAppointments} today`}
          />
          <ModernStatCard 
            title="Total Revenue" 
            value={`₹${totalRevenue.toLocaleString()}`} 
            icon="dollar-sign" 
            linkText="View all" 
            linkUrl="/reports"
            // subtitle="From all payments received"
          />
          <ModernStatCard 
            title="Pending Payments" 
            value={stats.totalReminders} 
            icon="check-circle" 
            linkText="View all" 
            linkUrl="/reminders"
            // subtitle={`+${stats.todayStats.reminders} pending`}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl transition-all duration-500"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 dark:from-amber-300/15 dark:to-yellow-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <Card className="relative bg-transparent border-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center space-x-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 rounded-full"></div>
                  <span>Operation Task Status</span>
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

          {/* Monthly Enquiries Chart Card */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl transition-all duration-500"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 dark:from-yellow-300/15 dark:to-orange-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <Card className="relative bg-transparent border-none">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center space-x-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-600 dark:from-yellow-400 dark:to-orange-500 rounded-full"></div>
                    <span>Monthly Enquiries</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {monthlyLoading ? (
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

        {/* Application Table */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl transition-all duration-500"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-400/20 dark:from-amber-300/15 dark:to-orange-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-1">
            <ApplicationTable
              applications={mappedRecentClients}
              loading={clientsLoading}
              defaultFilter="This Month"
              title="Recent Clients"
            />
          </div>
        </div>

        {/* Deadlines */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl transition-all duration-500"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 dark:from-yellow-300/15 dark:to-amber-300/15 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-1">
            <DeadlineList
              deadlines={deadlinesData?.data || []}
              loading={deadlinesLoading}
              onAddDeadline={handleAddDeadline}
              hideActions={true}
              hideHeaderActions={true}
            />
          </div>
        </div>

        {/* MessageBox */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl transition-all duration-500"></div>
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