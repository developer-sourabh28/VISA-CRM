import { useEffect } from "react";
import {
  PlusIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import StatCard from "./StatCard";
import PieChart from "./charts/PieChart";
import BarChart from "./charts/BarChart";
import ApplicationTable from "./ApplicationTable";
import DeadlineList from "./DeadlineList";
import { useToast } from "../hooks/use-toast";
import {
  getDashboardStats,
  getMonthlyApplicationsChart,
  getClients,
  getUpcomingDeadlines,
} from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function Dashboard() {
  const { toast } = useToast();

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getDashboardStats,
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: getClients,
  });

  const { data: deadlinesData, isLoading: deadlinesLoading } = useQuery({
    queryKey: ["/api/dashboard/upcoming-deadlines"],
    queryFn: getUpcomingDeadlines,
  });

  useEffect(() => {
    if (statsError && statsError.message !== "404") {
      toast({
        title: "Error loading dashboard",
        description: statsError.message,
        variant: "destructive",
      });
    }
  }, [statsError, toast]);

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
    approvedVisas: 0,
    pendingApplications: 0,
    monthlyRevenue: 0,
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
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          Dashboard
        </h1>
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
        />
        <StatCard
          title="Approved Visas"
          value={stats.approvedVisas}
          icon="approved"
          linkText="View all"
          linkUrl="/applications?status=approved"
        />
        <StatCard
          title="Pending Applications"
          value={stats.pendingApplications}
          icon="pending"
          linkText="View all"
          linkUrl="/applications?status=pending"
        />
        <StatCard
          title="Revenue (Monthly)"
          value={formatCurrency(stats.monthlyRevenue)}
          icon="revenue"
          linkText="View report"
          linkUrl="/reports/revenue"
        />
      </div>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                icon: (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ),
                bg: "bg-green-100 dark:bg-green-900/50",
                title: "New client application submitted",
                time: "2 hours ago",
              },
              {
                icon: (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                ),
                bg: "bg-red-100 dark:bg-red-900/50",
                title: "Application status updated",
                time: "4 hours ago",
              },
              {
                icon: (
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ),
                bg: "bg-blue-100 dark:bg-blue-900/50",
                title: "New appointment scheduled",
                time: "1 day ago",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className={`p-2 rounded-full ${activity.bg}`}>
                  {activity.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
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