import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation } from "wouter";
import { useToast } from "../components/ui/use-toast";
import { useUser } from "../context/UserContext";
import { Download, RefreshCw, DollarSign, CreditCard, Calendar, Search, Filter } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function Payments() {
  const { clientId } = useParams();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { user } = useUser();

  // Debug information
  console.log('Route Debug:', {
    pathname: location.pathname,
    params: useParams(),
    clientId,
    fullUrl: window.location.href
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to view payments');
      }

      let response;
      
      if (clientId) {
        // Fetch payments for specific client
        console.log('Fetching payments for clientId:', clientId);
        response = await api.get(`/payments/client/${clientId}`);
      } else {
        // Fetch all payments (filtered by user role)
        console.log('Fetching all payments');
        response = await api.get('/payments');
      }

      console.log('Raw API Response:', response);
      console.log('Response Data:', response.data);
      
      // Handle the response data
      if (response.data) {
        // If the response is a single payment object, convert it to an array
        const paymentData = Array.isArray(response.data) ? response.data : [response.data];
        console.log('Processed Payment Data:', paymentData);
        setPayments(paymentData);
      } else {
        console.log('No payment data received');
        setPayments([]);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        setError('Client not found');
      } else if (err.response?.status === 401) {
        setError('Please log in to view payments');
        // Optionally redirect to login
        // navigate('/login');
      } else {
        setError(err.message || 'Failed to fetch payments');
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (paymentId) => {
    try {
      setLoading(true);
      const response = await api.get(`/payments/${paymentId}/invoice`, {
        responseType: 'blob'
      });
      
      // Create a blob from the PDF Stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link element to download the file
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `invoice_${paymentId}.pdf`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Invoice generated successfully!",
      });
    } catch (err) {
      console.error('Error generating invoice:', err);
      toast({
        title: "Error",
        description: "Error generating invoice: " + err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Component mounted/updated with clientId:', clientId);
    fetchPayments();
  }, [clientId]);

  // Debug render
  console.log('Current payments state:', payments);
  console.log('Loading state:', loading);
  console.log('Error state:', error);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-2 h-8 bg-red-500 rounded-full"></div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Error</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">{error}</p>
            <div className="mt-4 p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg">
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Debug Information:</h3>
              <p className="text-gray-600 dark:text-gray-400">URL: {window.location.href}</p>
              <p className="text-gray-600 dark:text-gray-400">Path: {location.pathname}</p>
              <p className="text-gray-600 dark:text-gray-400">Client ID: {clientId}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Quick Invoice
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-5 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={fetchPayments}
              className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            
            <Button
              className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Download className="w-5 h-5" />
              <span>Export All</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        {user?.isAdmin && (
          <div className="group relative overflow-hidden mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
            <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative p-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search payments..." 
                    className="pl-9 bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
              {clientId && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Showing payments for client ID: {clientId}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Details</h3>
              <Button
                variant="outline"
                className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Method</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    {user?.isAdmin && (
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Recorded By</th>
                    )}
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={user?.isAdmin ? 8 : 7} className="text-center py-6">
                        <div className="flex justify-center items-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading payments...</span>
                        </div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={user?.isAdmin ? 8 : 7} className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr 
                        key={payment._id}
                        className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="text-gray-900 dark:text-white py-3 px-4">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{payment.clientName}</td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">₹{payment.amount.toLocaleString()}</td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{payment.paymentMethod}</td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{payment.paymentType}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'Completed'
                                ? "bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                : payment.status === 'Pending'
                                ? "bg-yellow-100/40 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                                : "bg-red-100/40 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        {user?.isAdmin && (
                          <td className="text-gray-900 dark:text-white py-3 px-4">{payment.recordedByName || 'Unknown'}</td>
                        )}
                        <td className="py-3 px-4">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateInvoice(payment._id)}
                              className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                            >
                              <Download className="w-4 h-4" />
                              <span className="ml-1">Invoice</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
