import Dashboard from '../components/Dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, UserPlus, UserCheck, Mail, CalendarPlus, DollarSign, CheckCircle2, TrendingUp, Calendar, FileText, AlertCircle } from "lucide-react";

function DashboardPage() {
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
                      <p className="font-semibold">${payment.amount}</p>
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
                      <p className="font-semibold">${payment.amount}</p>
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
          {/* ... existing activities code ... */}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
