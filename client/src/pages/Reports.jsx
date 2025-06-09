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
  
  const clientGrowth = [
    { month: "Jan", clients: 20 },
    { month: "Feb", clients: 40 },
    { month: "Mar", clients: 60 },
    { month: "Apr", clients: 80 },
    { month: "May", clients: 100 },
  ];
  
  const enquiriesData = [
    { month: "Jan", enquiries: 35 },
    { month: "Feb", enquiries: 50 },
    { month: "Mar", enquiries: 45 },
    { month: "Apr", enquiries: 70 },
    { month: "May", enquiries: 90 },
  ];
  
  const paymentsData = [
    { name: "Payments Done", value: 120000 },
    { name: "Payments Due", value: 30000 },
  ];
  
  const COLORS = ["#10B981", "#F59E0B"];
  
  const tableData = [
    {
      name: "Amit Sharma",
      email: "amit@example.com",
      enquiryDate: "2025-05-01",
      status: "Paid",
      amount: "₹40,000",
    },
    {
      name: "Priya Verma",
      email: "priya@example.com",
      enquiryDate: "2025-05-03",
      status: "Due",
      amount: "₹15,000",
    },
    {
      name: "Rahul Gupta",
      email: "rahul@example.com",
      enquiryDate: "2025-05-07",
      status: "Paid",
      amount: "₹30,000",
    },
    {
      name: "Sneha Mehta",
      email: "sneha@example.com",
      enquiryDate: "2025-05-10",
      status: "Due",
      amount: "₹10,000",
    },
  ];
  
  export default function Reports() {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-semibold mb-6">Reports Dashboard</h1>
  
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard icon={<Users />} label="Clients" value="245" bg="bg-blue-100" text="text-blue-800" />
          <SummaryCard icon={<MailQuestion />} label="Enquiries" value="120" bg="bg-purple-100" text="text-purple-800" />
          <SummaryCard icon={<CreditCard />} label="Payments Done" value="₹1,20,000" bg="bg-green-100" text="text-green-800" />
          <SummaryCard icon={<AlertCircle />} label="Payments Due" value="₹30,000" bg="bg-red-100" text="text-red-800" />
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
              <LineChart data={clientGrowth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="clients" stroke="#6366F1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              A total of <strong>100 new clients</strong> added in the last 5 months. The highest jump was in May.
            </p>
          </div>
  
          {/* Enquiries Bar Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 mb-2 text-xl font-medium">
              <MailQuestion className="w-5 h-5" />
              Monthly Enquiries
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={enquiriesData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="enquiries" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <strong>May</strong> saw the highest enquiries (90). Enquiries have been steadily increasing since Jan.
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
              <Pie data={paymentsData} dataKey="value" nameKey="name" outerRadius={100} label>
                {paymentsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <strong>₹1,20,000</strong> received. <strong>₹30,000</strong> is still pending from clients.
          </p>
        </div>
  
        {/* Data Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4 mt-6">
          <h2 className="text-xl font-semibold mb-4">Client Payment Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Enquiry Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row.name}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{row.email}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{row.enquiryDate}</td>
                    <td className={`px-4 py-2 font-semibold ${row.status === "Paid" ? "text-green-600" : "text-red-500"}`}>
                      {row.status}
                    </td>
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{row.amount}</td>
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
  