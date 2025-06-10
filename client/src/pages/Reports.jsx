import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
  } from "recharts";
  import {
    Users,
    MailQuestion,
    CreditCard,
    AlertCircle,
    LineChart as LineChartIcon,
  } from "lucide-react";
  import axios from "axios";
  import { useToast } from "../components/ui/use-toast";
  
  export default function Reports() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState({
      summary: {
        totalClients: 0,
        totalEnquiries: 0,
        totalPaymentsDone: 0,
        totalPaymentsDue: 0
      },
      clientGrowth: [],
      enquiriesData: [],
      paymentsData: [],
      recentPayments: []
    });
  
    const { toast } = useToast();
  
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/dashboard/reports');
        setReportData(response.data.data);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message);
        toast({
          title: "Error",
          description: "Failed to load report data: " + err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchReportData();
    }, []);
  
    const COLORS = ["#10B981", "#F59E0B"];
  
    if (loading) {
      return (
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-500">Loading reports data...</p>
          </div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={fetchReportData}
              className="mt-3 bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
  
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    };
  
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold mb-6">Reports Dashboard</h1>
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
  
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard 
            icon={<Users />} 
            label="Clients" 
            value={reportData.summary.totalClients} 
            bg="bg-blue-100" 
            text="text-blue-800" 
          />
          <SummaryCard 
            icon={<MailQuestion />} 
            label="Enquiries" 
            value={reportData.summary.totalEnquiries} 
            bg="bg-purple-100" 
            text="text-purple-800" 
          />
          <SummaryCard 
            icon={<CreditCard />} 
            label="Payments Done" 
            value={formatCurrency(reportData.summary.totalPaymentsDone)} 
            bg="bg-green-100" 
            text="text-green-800" 
          />
          <SummaryCard 
            icon={<AlertCircle />} 
            label="Payments Due" 
            value={formatCurrency(reportData.summary.totalPaymentsDue)} 
            bg="bg-red-100" 
            text="text-red-800" 
          />
        </div>
  
        {/* Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Client Growth Line Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 mb-2 text-xl font-medium">
              <LineChartIcon className="w-5 h-5" />
              Client Growth
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={reportData.clientGrowth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="clients" stroke="#6366F1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              A total of <strong>{reportData.clientGrowth.reduce((acc, curr) => acc + curr.clients, 0)} new clients</strong> added in the last 5 months.
            </p>
          </div>
  
          {/* Enquiries Bar Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 mb-2 text-xl font-medium">
              <MailQuestion className="w-5 h-5" />
              Monthly Enquiries
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reportData.enquiriesData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="enquiries" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Total <strong>{reportData.enquiriesData.reduce((acc, curr) => acc + curr.enquiries, 0)} enquiries</strong> received in the last 5 months.
            </p>
          </div>
        </div>
  
        {/* Payment Pie Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4 mt-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2 text-xl font-medium">
            <CreditCard className="w-5 h-5" />
            Payment Status
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={reportData.paymentsData} dataKey="value" nameKey="name" outerRadius={100} label>
                {reportData.paymentsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <strong>{formatCurrency(reportData.summary.totalPaymentsDone)}</strong> received.{' '}
            <strong>{formatCurrency(reportData.summary.totalPaymentsDue)}</strong> is still pending from clients.
          </p>
        </div>
  
        {/* Data Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4 mt-6">
          <h2 className="text-xl font-semibold mb-4">Recent Payment Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Payment Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.recentPayments.map((payment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{payment.name}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{payment.email}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{new Date(payment.enquiryDate).toLocaleDateString()}</td>
                    <td className={`px-4 py-2 font-semibold ${payment.status === "Paid" ? "text-green-600" : "text-red-500"}`}>
                      {payment.status}
                    </td>
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  
  // Summary Card
  function SummaryCard({ icon, label, value, bg, text }) {
    return (
      <div className={`${bg} ${text} p-4 rounded-xl shadow text-center`}>
        <div className="flex justify-center mb-2">{icon}</div>
        <div className="text-sm">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    );
  }
  