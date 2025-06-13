import { useToast } from "./ui/use-toast.js";
import { useEffect } from "react";
import {
  PlusIcon,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
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
          "#60a5fa",
          "#34d399",
          "#fbbf24",
          "#f87171",
          "#a78bfa",
        ],
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
        borderColor: "#60a5fa",
        backgroundColor: "#93c5fd",
        fill: true,
      },
    ],
  };

  return (
    <div className="relative">
      {/* U-shaped cut at top */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <svg
          className="w-full h-24"          /* stretch full‑width, ~96 px tall */
          viewBox="0 0 1200 96"            /* logical canvas */
          preserveAspectRatio="none"       /* let it stretch */
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="
              M0 0 H1200 V64 C900 120 600 10 0 64 Z"
            fill="#8A2BE2"         
          />
        </svg>
      </div>


      {/* Main dashboard content */}
      <div className="relative pt-4 p-4 sm:p-6 md:p-6 space-y-6 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        
        {/* All Foreground UI */}
        <div className="relative z-10 space-y-6">

          {/* Header with simple styling to match the reference */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 backdrop-blur-md bg-white/10 dark:bg-gray-800/10 p-6 rounded-2xl shadow-lg border border-white/10 dark:border-gray-700/10 mt-16">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Today: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex space-x-2 mt-3 md:mt-0 w-full md:w-auto">
              <Link to="/clients/new">
                <button className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 w-full md:w-auto shadow-lg hover:shadow-xl">
                  <PlusIcon className="w-4 h-4" />
                  New Client
                </button>
              </Link>
            </div>
          </div>

          {/* Stat Cards with clean styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 shadow-lg rounded-xl overflow-hidden">
              <StatCard 
                title="Total Clients" 
                value={stats.totalClients} 
                icon="users" 
                linkText="View all" 
                linkUrl="/clients"
                subtitle={`+${stats.todayStats.newClients} today`}
                className="bg-transparent border-none shadow-none"
              />
            </div>
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 shadow-lg rounded-xl overflow-hidden">
              <StatCard 
                title="Total Appointments" 
                value={Math.max(0, stats.totalAppointments - 2)} 
                icon="calendar" 
                linkText="View all" 
                linkUrl="/appointments"
                subtitle={`+${stats.todayStats.newAppointments} today`}
                className="bg-transparent border-none shadow-none"
              />
            </div>
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 shadow-lg rounded-xl overflow-hidden">
              <StatCard 
                title="Total Payments" 
                value={stats.totalPayments} 
                icon="dollar-sign" 
                linkText="View all" 
                linkUrl="/payments"
                subtitle={`+${stats.todayStats.paymentsReceived} today`}
                className="bg-transparent border-none shadow-none"
              />
            </div>
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 shadow-lg rounded-xl overflow-hidden">
              <StatCard 
                title="Reminders" 
                value={stats.totalReminders} 
                icon="check-circle" 
                linkText="View all" 
                linkUrl="/reminders"
                subtitle={`+${stats.todayStats.reminders} `}
                className="bg-transparent border-none shadow-none"
              />
            </div>
          </div>

          {/* Charts with clean styling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <Card className="backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[350px] w-full p-0">
                  {clientsLoading ? (
                    <p className="text-gray-400 text-center">Loading...</p>
                  ) : (
                    <PieChart data={statusChartData} />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Monthly Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[280px] w-full p-2 sm:p-4">
                  {clientsLoading ? (
                    <p className="text-gray-400 text-center">Loading...</p>
                  ) : (
                    <BarChart data={monthlyChartData} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Table with clean styling */}
          <div className="relative mt-8">
            <div className="relative z-10">
              <div className="overflow-hidden backdrop-blur-md border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <ApplicationTable
                  applications={mappedRecentClients}
                  loading={clientsLoading}
                  defaultFilter="This Month"
                  title="Recent Applications (This Month)"
                />
              </div>
            </div>
          </div>

          {/* Deadlines with clean styling */}
          <div className="relative mt-8">
            <div className="relative z-10">
              <div className="overflow-hidden backdrop-blur-md border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <DeadlineList
                  deadlines={deadlinesData?.data || []}
                  loading={deadlinesLoading}
                  onAddDeadline={handleAddDeadline}
                />
              </div>
            </div>
          </div>

          {/* MessageBox with clean styling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2 backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 rounded-xl shadow-lg p-6">
              <MessageBox />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Dashboard;