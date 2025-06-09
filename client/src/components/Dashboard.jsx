import { useToast } from "./ui/use-toast.js";
import { useEffect } from "react";
import {
  PlusIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  CheckCircle2,
  UserPlus,
  UserCheck,
  Mail,
  CalendarPlus,
  DollarSign,
  Users,
  Clock,
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
  getMonthlyApplicationsChart,
  getClients,
  getAppointments,
  getApplicationStatusChart,
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

  const { data: appointmentData, isLoading: appointmentLoading, error: appointmentError } = useQuery({
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
    todayStats: {
      newClients: 0,
      newAppointments: 0,
      paymentsReceived: 0
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
    <div className="p-2 sm:p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
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
          <Link href="/enquiries">
            <button className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-700 transition w-full md:w-auto">
              <PlusIcon className="w-4 h-4" />
              New Client
            </button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard 
          title="Total Clients" 
          value={stats.totalClients} 
          icon="users" 
          linkText="View all" 
          linkUrl="/clients"
          subtitle={`+${stats.todayStats.newClients} today`}
        />
        <StatCard 
          title="Total Appointments" 
          value={Math.max(0, stats.totalAppointments - 2)} 
          icon="calendar" 
          linkText="View all" 
          linkUrl="/appointments"
          subtitle={`+${stats.todayStats.newAppointments} today`}
        />
        <StatCard 
          title="Total Payments" 
          value={stats.totalPayments} 
          icon="dollar-sign" 
          linkText="View all" 
          linkUrl="/payments"
          subtitle={`+${stats.todayStats.paymentsReceived} today`}
        />
        <StatCard 
          title="Total Tasks" 
          value={stats.totalTasks} 
          icon="check-circle" 
          linkText="View all" 
          linkUrl="/tasks"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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

      {/* Tables */}
      <div className="overflow-x-auto">
        <ApplicationTable
          applications={mappedRecentClients}
          loading={clientsLoading}
          defaultFilter="This Month"
          title="Recent Applications (This Month)"
        />
      </div>

      <div className="overflow-x-auto">
        <DeadlineList
          deadlines={deadlinesData?.data || []}
          loading={deadlinesLoading}
          onAddDeadline={handleAddDeadline}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <MessageBox />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;