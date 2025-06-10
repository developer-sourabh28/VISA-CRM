import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { useUser } from "../context/UserContext";

export default function Payments() {
  const { clientId } = useParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { user } = useUser();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to view payments');
      }

      // Set up axios config with auth header
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('Fetching payments...', { clientId, user });
      
      // If clientId is provided, fetch payments for that client, otherwise fetch all payments
      const endpoint = clientId ? `/api/payments/client/${clientId}` : '/api/payments';
      console.log('Using endpoint:', endpoint);
      
      const res = await axios.get(endpoint, config);
      console.log('Payments response:', res.data);
      
      if (!Array.isArray(res.data)) {
        throw new Error('Invalid response format from server');
      }

      setPayments(res.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message);
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
      const response = await axios.get(`/api/payments/${paymentId}/invoice`, {
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
    fetchPayments();
  }, [clientId]);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">💳 Payments</h1>
        {user?.isAdmin && (
          <div className="text-sm text-gray-500">
            Showing all payments across users
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow-md text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Service Type</th>
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
                    <span className="ml-2">Loading payments...</span>
                  </div>
                </td>
              </tr>
            ) : payments?.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment._id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2">{new Date(payment.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    {payment.clientId?.name || 'Unknown Client'}
                  </td>
                  <td className="px-4 py-2">₹{payment.amount?.toLocaleString() || 0}</td>
                  <td className="px-4 py-2">{payment.method || "—"}</td>
                  <td className="px-4 py-2">{payment.serviceType || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status || 'Unknown'}
                    </span>
                  </td>
                  {user?.isAdmin && (
                    <td className="px-4 py-2">{payment.recordedBy?.name || 'Unknown'}</td>
                  )}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleGenerateInvoice(payment._id)}
                      disabled={loading}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      Generate Invoice
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={user?.isAdmin ? 8 : 7} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">No payment records found</p>
                    <p className="text-sm text-gray-400 mt-1">
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
