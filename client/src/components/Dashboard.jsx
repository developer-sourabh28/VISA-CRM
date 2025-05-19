import { useState, useEffect } from 'react';
import { PlusIcon } from 'lucide-react';
import { Link } from 'wouter';
import StatCard from './StatCard';
import PieChart from './charts/PieChart';
import LineChart from './charts/LineChart';
import ApplicationTable from './ApplicationTable';
import DeadlineList from './DeadlineList';
import { useQuery } from '@tanstack/react-query';
import { 
  getDashboardStats, 
  getApplicationStatusChart, 
  getMonthlyApplicationsChart, 
  getRecentApplications, 
  getUpcomingDeadlines 
} from '../lib/api';
import { useToast } from '../hooks/use-toast';

function Dashboard() {
  const { toast } = useToast();
  
  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: getDashboardStats
  });
  
  // Fetch application status chart data
  const { data: statusChartData, isLoading: statusChartLoading } = useQuery({
    queryKey: ['/api/dashboard/charts/application-status'],
    queryFn: getApplicationStatusChart
  });
  
  // Fetch monthly applications chart data
  const { data: monthlyChartData, isLoading: monthlyChartLoading } = useQuery({
    queryKey: ['/api/dashboard/charts/monthly-applications'],
    queryFn: getMonthlyApplicationsChart
  });
  
  // Fetch recent applications
  const { data: recentApplicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-applications'],
    queryFn: getRecentApplications
  });
  
  // Fetch upcoming deadlines
  const { data: deadlinesData, isLoading: deadlinesLoading } = useQuery({
    queryKey: ['/api/dashboard/upcoming-deadlines'],
    queryFn: getUpcomingDeadlines
  });
  
  // Handle stats error
  useEffect(() => {
    if (statsError) {
      toast({
        title: "Error loading dashboard",
        description: statsError.message,
        variant: "destructive"
      });
    }
  }, [statsError, toast]);
  
  // Handle add deadline button
  const handleAddDeadline = () => {
    toast({
      title: "Add Deadline",
      description: "This feature is coming soon!"
    });
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Get stats data
  const stats = statsData?.data || {
    totalClients: 0,
    approvedVisas: 0,
    pendingApplications: 0,
    monthlyRevenue: 0
  };
  
  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="mt-4 flex space-x-3 md:mt-0">
          <button type="button" className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
          <Link href="/enquiries">
            <button type="button" className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Client
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Application Status Chart */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Application Status</h3>
            <div className="mt-2 flex items-center justify-center h-64">
              {statusChartLoading ? (
                <div className="text-gray-500">Loading chart data...</div>
              ) : (
                <PieChart data={statusChartData?.data || []} />
              )}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-5 text-center text-sm">
              <div>
                <span className="inline-block h-3 w-3 rounded-full bg-success"></span>
                <span className="ml-2">Approved (50%)</span>
              </div>
              <div>
                <span className="inline-block h-3 w-3 rounded-full bg-warning"></span>
                <span className="ml-2">In Progress (30%)</span>
              </div>
              <div>
                <span className="inline-block h-3 w-3 rounded-full bg-danger"></span>
                <span className="ml-2">Rejected (20%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Applications Chart */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monthly Applications</h3>
            <div className="mt-2 h-64">
              {monthlyChartLoading ? (
                <div className="text-gray-500">Loading chart data...</div>
              ) : (
                <LineChart data={monthlyChartData?.data || {labels: [], datasets: [{label: '', data: []}, {label: '', data: []}]}} />
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5 text-sm">
              <div>
                <span className="inline-block h-3 w-3 rounded-full bg-primary-600"></span>
                <span className="ml-2">Total Applications</span>
              </div>
              <div>
                <span className="inline-block h-3 w-3 rounded-full bg-success"></span>
                <span className="ml-2">Approved Applications</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="mt-8">
        <ApplicationTable 
          applications={recentApplicationsData?.data || []} 
          loading={applicationsLoading} 
        />
      </div>

      {/* Upcoming Deadlines */}
      <div className="mt-8">
        <DeadlineList 
          deadlines={deadlinesData?.data || []} 
          loading={deadlinesLoading}
          onAddDeadline={handleAddDeadline}
        />
      </div>
    </>
  );
}

export default Dashboard;
