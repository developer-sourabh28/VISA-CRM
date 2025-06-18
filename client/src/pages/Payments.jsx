import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation } from "wouter";
import { useToast } from "../components/ui/use-toast";
import { useUser } from "../context/UserContext";

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
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Debug Information:</h3>
          <p>URL: {window.location.href}</p>
          <p>Path: {location.pathname}</p>
          <p>Client ID: {clientId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">💳 Quick Invoice</h1>
        {user?.isAdmin && (
          <div className="text-sm text-gray-500">
            {clientId ? `Showing payments for client ID: ${clientId}` : 'Showing all payments across users'}
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full  rounded-xl shadow-md text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              {user?.isAdmin && (
                <th className="px-4 py-3 text-left">Recorded By</th>
              )}
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={user?.isAdmin ? 8 : 7} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 dark:text-gray-300">Loading payments...</span>
                  </div>
                </td>
              </tr>
            ) : payments?.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment._id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2 dark:text-gray-300">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2 dark:text-gray-300">
                    {payment.clientId ? `${payment.clientId.firstName} ${payment.clientId.lastName}` : 'Unknown Client'}
                  </td>
                  <td className="px-4 py-2 dark:text-gray-300">₹{payment.amount?.toLocaleString() || 0}</td>
                  <td className="px-4 py-2 dark:text-gray-300">{payment.method || "—"}</td>
                  <td className="px-4 py-2 dark:text-gray-300">{payment.type || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payment.status === 'RECEIVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      payment.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      payment.status === 'OVERDUE' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {payment.status || 'Unknown'}
                    </span>
                  </td>
                  {user?.isAdmin && (
                    <td className="px-4 py-2 dark:text-gray-300">{payment.recordedBy?.name || 'Unknown'}</td>
                  )}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleGenerateInvoice(payment._id)}
                      disabled={loading}
                      className="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50"
                    >
                      Generate Invoice
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={user?.isAdmin ? 8 : 7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium dark:text-gray-300">No payment records found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {clientId ? "This client has no payments yet" : "No payments have been recorded yet"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
