import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign,RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

// Financial data structure
const financialData = {
  summary: {
    revenue: {
      amount: 24567,
      change: 12.4,
      period: "yesterday"
    },
    expenses: {
      amount: 9945,
      change: -23,
      period: "accounts"
    },
    profitLoss: {
      amount: 147890,
      change: 8.2,
      period: "last month"
    }
  },
  profitTrend: [
    { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
    { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
    { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
    { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
    { month: 'May', revenue: 58000, expenses: 36000, profit: 22000 },
    { month: 'Jun', revenue: 65000, expenses: 40000, profit: 25000 }
  ],
  paymentMethods: [
    { name: 'Credit Card', value: 35, color: '#3B82F6' },
    { name: 'Bank Transfer', value: 25, color: '#10B981' },
    { name: 'Cash', value: 20, color: '#F59E0B' },
    { name: 'Net Banking', value: 15, color: '#8B5CF6' },
    { name: 'UPI', value: 5, color: '#EF4444' }
  ],
  transactions: [
    {
      id: 'TRN001',
      date: '2024-01-20',
      customer: 'John Smith',
      amount: 3100,
      paymentMode: 'Credit Card',
      status: 'Completed'
    },
    {
      id: 'TRN002',
      date: '2024-01-20',
      customer: 'Sarah Johnson',
      amount: 850,
      paymentMode: 'UPI',
      status: 'Pending'
    },
    {
      id: 'TRN003',
      date: '2024-01-19',
      customer: 'Michael Brown',
      amount: 2250,
      paymentMode: 'Net Banking',
      status: 'Completed'
    },
    {
      id: 'TRN004',
      date: '2024-01-19',
      customer: 'Emma Wilson',
      amount: 750,
      paymentMode: 'Debit Card',
      status: 'Completed'
    },
    {
      id: 'TRN005',
      date: '2024-01-18',
      customer: 'James Davis',
      amount: 1600,
      paymentMode: 'Credit Card',
      status: 'Failed'
    }
  ]
};

const FinancialDashboard = () => {
  const [data] = useState(financialData);

  const exportToExcel = () => {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Financial Summary', '', '', ''],
      ['Metric', 'Amount', 'Change %', 'Period'],
      ['Revenue', `$${data.summary.revenue.amount.toLocaleString()}`, `${data.summary.revenue.change}%`, data.summary.revenue.period],
      ['Expenses', `$${data.summary.expenses.amount.toLocaleString()}`, `${data.summary.expenses.change}%`, data.summary.expenses.period],
      ['Profit & Loss', `$${data.summary.profitLoss.amount.toLocaleString()}`, `${data.summary.profitLoss.change}%`, data.summary.profitLoss.period],
      ['', '', '', ''],
      ['Profit Trend', '', '', ''],
      ['Month', 'Revenue', 'Expenses', 'Profit'],
      ...data.profitTrend.map(item => [item.month, item.revenue, item.expenses, item.profit]),
      ['', '', '', ''],
      ['Payment Methods Distribution', '', '', ''],
      ['Method', 'Percentage', '', ''],
      ...data.paymentMethods.map(item => [item.name, `${item.value}%`, '', ''])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Transactions sheet
    const transactionsData = [
      ['Recent Transactions', '', '', '', '', ''],
      ['Transaction ID', 'Date', 'Customer', 'Amount', 'Payment Mode', 'Status'],
      ...data.transactions.map(transaction => [
        transaction.id,
        transaction.date,
        transaction.customer,
        `$${transaction.amount.toLocaleString()}`,
        transaction.paymentMode,
        transaction.status
      ])
    ];

    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

    // Download file
    XLSX.writeFile(workbook, `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600 mt-1">Track your business performance</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium">
             <RotateCcw size={20}/> Refresh
            </button>
            <button 
              onClick={exportToExcel}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Download size={20} />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Revenue</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(data.summary.revenue.amount)}
            </p>
            <div className="flex items-center text-sm">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span className="text-green-500 font-medium">+{data.summary.revenue.change}%</span>
              <span className="text-gray-500 ml-1">vs {data.summary.revenue.period}</span>
            </div>
          </div>

          {/* Expenses Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Expenses</h3>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="text-red-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(data.summary.expenses.amount)}
            </p>
            <div className="flex items-center text-sm">
              <TrendingDown className="text-red-500 mr-1" size={16} />
              <span className="text-red-500 font-medium">{data.summary.expenses.change}</span>
              <span className="text-gray-500 ml-1">{data.summary.expenses.period}</span>
            </div>
          </div>

          {/* Profit & Loss Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Profit & Loss</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(data.summary.profitLoss.amount)}
            </p>
            <div className="flex items-center text-sm">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span className="text-green-500 font-medium">+{data.summary.profitLoss.change}%</span>
              <span className="text-gray-500 ml-1">vs {data.summary.profitLoss.period}</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Profit Trend Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Profit Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    name="Expenses"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Percentage']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {data.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: method.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{method.name}</span>
                  <span className="text-sm font-medium text-gray-900">{method.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Mode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.paymentMode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;