import { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, UserPlus, UserCheck, Mail, CalendarPlus, DollarSign, CheckCircle2, TrendingUp, Calendar, FileText, AlertCircle } from "lucide-react";
import { apiRequest } from '../lib/api';
import { useToast } from "../components/ui/use-toast";

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest('GET', '/api/dashboard/recent-activities');
      console.log('Dashboard data:', response);
      
      if (response.success) {
        setData(response);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* ... existing stats cards ... */}
      </div>

      {/* Payment Reminders Section */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Upcoming Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data?.upcomingPayments?.length > 0 ? (
              <div className="space-y-4">
                {data.upcomingPayments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div>
                      <p className="font-medium">{payment.clientId.firstName} {payment.clientId.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{payment.amount?.toLocaleString()}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {Math.ceil((new Date(payment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming payments</p>
            )}
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {data?.overduePayments?.length > 0 ? (
              <div className="space-y-4">
                {data.overduePayments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div>
                      <p className="font-medium">{payment.clientId.firstName} {payment.clientId.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{payment.amount?.toLocaleString()}</p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {Math.ceil((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No overdue payments</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.data?.length > 0 ? (
            <div className="space-y-4">
              {data.data.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex-shrink-0">
                    {activity.icon === 'dollar-sign' && <DollarSign className="h-5 w-5 text-blue-500" />}
                    {activity.icon === 'alert-circle' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {activity.icon === 'calendar' && <Calendar className="h-5 w-5 text-green-500" />}
                    {activity.icon === 'file-text' && <FileText className="h-5 w-5 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.message}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activities</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
