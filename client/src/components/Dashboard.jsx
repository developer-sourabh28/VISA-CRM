import { useEffect } from "react";
import { PlusIcon } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import StatCard from "./StatCard";
import PieChart from "./charts/PieChart";
import LineChart from "./charts/LineChart";
import BarChart from "./charts/BarChart";
import ApplicationTable from "./ApplicationTable";
import DeadlineList from "./DeadlineList";
import { useToast } from "../hooks/use-toast";
import {
  getDashboardStats,
  getMonthlyApplicationsChart,
  getClients, // <-- use this
  getUpcomingDeadlines,
} from "../lib/api";

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

  // const { data: monthlyChartData, isLoading: monthlyChartLoading } = useQuery({
  //   queryKey: ["/api/dashboard/charts/monthly-applications"],
  //   queryFn: getMonthlyApplicationsChart,
  // });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: getClients,
  });

  const { data: deadlinesData, isLoading: deadlinesLoading } = useQuery({
    queryKey: ["/api/dashboard/upcoming-deadlines"],
    queryFn: getUpcomingDeadlines,
  });

  useEffect(() => {
    if (statsError) {
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const stats = statsData?.data || {
    totalClients: 0,
    approvedVisas: 0,
    pendingApplications: 0,
    monthlyRevenue: 0,
  };

  // Filter and map recent clients as you already do
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

  // --- Application Status Chart Data from recent applications ---
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

  // --- Monthly Applications Chart Data from recent applications ---
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start justify-between">
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Link href="/enquiries">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-700 transition">
              <PlusIcon className="w-4 h-4" />
              New Client
            </button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl shadow p-5 max-h-60 bg-white">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Application Status
          </h2>
          {clientsLoading ? (
            <p className="text-gray-400 text-center">Loading...</p>
          ) : (
            <PieChart data={statusChartData} />
          )}
        </div>

        <div className="rounded-xl bg-white shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Applications (Bar)
          </h2>
          {clientsLoading ? (
            <p className="text-gray-400 text-center">Loading...</p>
          ) : (
            <BarChart data={monthlyChartData} />
          )}
        </div>
      </div>

      {/* Recent Applications Table - Default to Current Month */}
      <ApplicationTable
        applications={mappedRecentClients}
        loading={clientsLoading}
        defaultFilter="This Month"
        title="Recent Applications (This Month)"
      />
      <DeadlineList
        deadlines={deadlinesData?.data || []}
        loading={deadlinesLoading}
        onAddDeadline={handleAddDeadline}
      />
    </div>
  );
}

export default Dashboard;
