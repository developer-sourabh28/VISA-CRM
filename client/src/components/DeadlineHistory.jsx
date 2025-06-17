import { useEffect, useState } from "react";

export default function DeadlineHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Please log in to view history');
        }

        const res = await fetch("http://localhost:5000/api/deadlines?history=true", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          console.log('Fetched history:', data.data);
          setHistory(data.data);
        } else {
          console.error('Failed to fetch history:', data.message);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Deadline History</h2>
      {loading ? (
        <div>Loading...</div>
      ) : history.length === 0 ? (
        <div>No completed deadlines.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-black whitespace-nowrap">Due Date</th>
                <th className="px-4 py-3 text-black whitespace-nowrap">Client Name</th>
                <th className="px-4 py-3 text-black whitespace-nowrap">Visa Type</th>
                <th className="px-4 py-3 text-black whitespace-nowrap">Urgency</th>
                <th className="px-4 py-3 text-black whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-black whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((deadline) => (
                <tr
                  key={deadline._id || deadline.id}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="px-4 py-2">{deadline.dueDate?.slice(0, 10)}</td>
                  <td className="px-4 py-2">{deadline.clientName}</td>
                  <td className="px-4 py-2">{deadline.visaType}</td>
                  <td className="px-4 py-2">{deadline.urgency}</td>
                  <td className="px-4 py-2 capitalize">
                    {deadline.type === "hotel"
                      ? "Hotel Cancellation"
                      : deadline.type === "flight"
                      ? "Flight Cancellation"
                      : deadline.type === "appointment"
                      ? "Appointment"
                      : deadline.type}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            throw new Error('Please log in to restore deadline');
                          }

                          const res = await fetch(`http://localhost:5000/api/deadlines/${deadline._id}/restore`, {
                            method: "PATCH",
                            headers: { 
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`
                            }
                          });
                          const data = await res.json();
                          if (data.success) {
                            setHistory(prev => prev.filter(d => d._id !== deadline._id));
                            alert('Deadline restored successfully!');
                          } else {
                            throw new Error(data.message || 'Failed to restore deadline');
                          }
                        } catch (err) {
                          console.error('Error restoring deadline:', err);
                          alert(err.message || 'Error restoring deadline. Please try again.');
                        }
                      }}
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
