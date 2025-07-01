import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { format } from 'date-fns';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Calendar } from 'lucide-react';
import { useToast } from './ui/use-toast';

export default function PaymentReminders() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  
  // Filters
  const [filters, setFilters] = useState({
    clientName: '',
    startDate: '',
    endDate: '',
    paymentType: ''
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/payments/pending');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch payment reminders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredPayments = payments.filter(payment => {
    const matchesName = payment.clientId?.firstName?.toLowerCase().includes(filters.clientName.toLowerCase()) ||
                       payment.clientId?.lastName?.toLowerCase().includes(filters.clientName.toLowerCase());
    const matchesType = !filters.paymentType || payment.paymentType === filters.paymentType;
    const matchesDate = (!filters.startDate || new Date(payment.installments?.nextInstallmentDate) >= new Date(filters.startDate)) &&
                       (!filters.endDate || new Date(payment.installments?.nextInstallmentDate) <= new Date(filters.endDate));

    return matchesName && matchesType && matchesDate;
  });

  const isOverdue = (date) => {
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Client Name
          </label>
          <Input
            type="text"
            name="clientName"
            value={filters.clientName}
            onChange={handleFilterChange}
            placeholder="Search by name..."
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <Input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <Input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Type
          </label>
          <select
            name="paymentType"
            value={filters.paymentType}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="Full Payment">Full Payment</option>
            <option value="Partial Payment">Partial Payment</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Next Installment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Loading payments...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No pending payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isOverdue(payment.installments?.nextInstallmentDate) ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {payment.clientId?.firstName} {payment.clientId?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {payment.paymentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ₹{payment.installments?.nextInstallmentAmount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {payment.installments?.nextInstallmentDate ? 
                        format(new Date(payment.installments.nextInstallmentDate), 'dd MMM yyyy') : 
                        '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ₹{((payment.amount || 0) - (payment.installments?.currentInstallment || 0) * (payment.installments?.nextInstallmentAmount || 0)).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isOverdue(payment.installments?.nextInstallmentDate)
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {isOverdue(payment.installments?.nextInstallmentDate) ? 'Overdue' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 