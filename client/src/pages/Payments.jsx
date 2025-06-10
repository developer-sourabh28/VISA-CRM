import { useEffect, useState } from "react";
import axios from "axios";

const clientId = "your-client-id-here"; // Replace or dynamically get it

export default function Payments() {
  const [payments, setPayments] = useState([]);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`/api/payment/${clientId}`);
      setPayments(res.data); // assuming res.data is an array of payment records
    } catch (err) {
      console.error("Error fetching payments:", err.message);
    }
  };

  const handleGenerateInvoice = (payment) => {
    // Replace with real invoice logic (e.g. PDF creation)
    alert(`Generating invoice for ₹${payment.amount} paid by ${payment.name}`);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-6 text-center">💳 Payments</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow-md text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments?.length > 0 ? (
              payments.map((payment, idx) => (
                <tr key={idx} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2">{new Date(payment.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">₹{payment.amount}</td>
                  <td className="px-4 py-2">{payment.method || "—"}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleGenerateInvoice(payment)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-all"
                    >
                      Generate Invoice
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
