import { useEffect, useState } from "react";

export default function DeadlineHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/deadlines?history=true");
        const data = await res.json();
        if (data.success) setHistory(data.data);
      } catch (err) {
        // handle error
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
                <th className="px-4 py-3 text-white whitespace-nowrap">Due Date</th>
                <th className="px-4 py-3 text-white whitespace-nowrap">Client Name</th>
                <th className="px-4 py-3 text-white whitespace-nowrap">Visa Type</th>
                <th className="px-4 py-3 text-white whitespace-nowrap">Urgency</th>
                <th className="px-4 py-3 text-white whitespace-nowrap">Type</th> {/* New column */}
                <th className="px-4 py-3 text-white whitespace-nowrap">Actions</th> {/* New column for actions */}
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
                          const res = await fetch(`/api/deadlines/${deadline._id}/restore`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                          });
                          const data = await res.json();
                          if (data.success) {
                            // Optionally remove from history list and/or show a message
                            setHistory(prev => prev.filter(d => d._id !== deadline._id));
                            // Optionally, you can also update the main deadline list if you have access
                          } else {
                            alert("Failed to restore deadline");
                          }
                        } catch {
                          alert("Error restoring deadline");
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
