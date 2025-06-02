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
  getRecentActivities,
} from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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

  const { data: activitiesData, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ["/api/dashboard/recent-activities"],
    queryFn: getRecentActivities,
    refetchInterval: 60000, // Refresh every minute
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
    if (activitiesError) {
      toast({
        title: "Error loading recent activities",
        description: activitiesError.message,
        variant: "destructive",
      });
    }
  }, [statsError, clientsError, deadlinesError, activitiesError, toast]);

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

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

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

  // Enhanced icon selector for activities
  const getActivityIcon = (type) => {
    switch (type) {
      case "new-client":
        return <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "enquiry-converted":
        return <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "new-enquiry":
        return <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case "new-appointment":
        return <CalendarPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case "payment-received":
        return <DollarSign className="h-4 w-4 text-green-700 dark:text-green-300" />;
      case "task-completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "status-update":
        return <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "note":
        return <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case "visa-approved":
        return <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-300" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
    }
  };

  const getActivityBg = (type) => {
    switch (type) {
      case "new-client":
        return "bg-blue-100 dark:bg-blue-900/50";
      case "enquiry-converted":
        return "bg-green-100 dark:bg-green-900/50";
      case "new-enquiry":
        return "bg-purple-100 dark:bg-purple-900/50";
      case "new-appointment":
        return "bg-indigo-100 dark:bg-indigo-900/50";
      case "payment-received":
        return "bg-green-200 dark:bg-green-800/50";
      case "task-completed":
        return "bg-emerald-100 dark:bg-emerald-900/50";
      case "status-update":
        return "bg-orange-100 dark:bg-orange-900/50";
      case "appointment":
        return "bg-blue-100 dark:bg-blue-900/50";
      case "note":
        return "bg-yellow-100 dark:bg-yellow-900/50";
      case "visa-approved":
        return "bg-green-200 dark:bg-green-800/50";
      default:
        return "bg-gray-100 dark:bg-gray-800/50";
    }
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

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Today's Activity
          </CardTitle>
          {activitiesData?.meta && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing {activitiesData.meta.displayed} of {activitiesData.meta.total} activities
            </span>
          )}
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8 ">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading activities...</p>
              </div>
            </div>
          ) : activitiesData?.data && activitiesData.data.length > 0 ? (
            <div className="space-y-3 h-72 overflow-auto">
              {activitiesData.data.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className={`p-2 rounded-full ${getActivityBg(activity.type)} flex-shrink-0`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities today</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No activities have been recorded today yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}

export default Dashboard;