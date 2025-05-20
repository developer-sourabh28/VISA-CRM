import { useEffect } from "react";
import { PlusIcon } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import StatCard from "./StatCard";
import PieChart from "./charts/PieChart";
import LineChart from "./charts/LineChart";
import ApplicationTable from "./ApplicationTable";
import DeadlineList from "./DeadlineList";
import { useToast } from "../hooks/use-toast";
import {
  getDashboardStats,
  getApplicationStatusChart,
  getMonthlyApplicationsChart,
  getRecentApplications,
  getUpcomingDeadlines,
} from "../lib/api";

function Dashboard() {
  const { toast } = useToast();

  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getDashboardStats,
  });

  const { data: statusChartData, isLoading: statusChartLoading } = useQuery({
    queryKey: ["/api/dashboard/charts/application-status"],
    queryFn: getApplicationStatusChart,
  });

  const { data: monthlyChartData, isLoading: monthlyChartLoading } = useQuery({
    queryKey: ["/api/dashboard/charts/monthly-applications"],
    queryFn: getMonthlyApplicationsChart,
  });

  const { data: recentApplicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-applications"],
    queryFn: getRecentApplications,
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
        <StatCard title="Total Clients" value={stats.totalClients} icon="users" linkText="View all" linkUrl="/clients" />
        <StatCard title="Approved Visas" value={stats.approvedVisas} icon="approved" linkText="View all" linkUrl="/applications?status=approved" />
        <StatCard title="Pending Applications" value={stats.pendingApplications} icon="pending" linkText="View all" linkUrl="/applications?status=pending" />
        <StatCard title="Revenue (Monthly)" value={formatCurrency(stats.monthlyRevenue)} icon="revenue" linkText="View report" linkUrl="/reports/revenue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl bg-white shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Application Status</h2>
          {statusChartLoading ? (
            <p className="text-gray-400 text-center">Loading...</p>
          ) : (
            <PieChart data={statusChartData?.data || []} />
          )}
        </div>

        <div className="rounded-xl bg-white shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Applications</h2>
          {monthlyChartLoading ? (
            <p className="text-gray-400 text-center">Loading...</p>
          ) : (
            <LineChart data={monthlyChartData?.data || { labels: [], datasets: [] }} />
          )}
        </div>
      </div>

      {/* Tables */}
      <ApplicationTable applications={recentApplicationsData?.data || []} loading={applicationsLoading} />
      <DeadlineList deadlines={deadlinesData?.data || []} loading={deadlinesLoading} onAddDeadline={handleAddDeadline} />
    </div>
  );
}

export default Dashboard;
