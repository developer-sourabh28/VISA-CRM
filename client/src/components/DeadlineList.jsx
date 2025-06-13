import { useState, useEffect } from "react";
import { Plus, FileClock, History, MessageCircleMore, MailCheck, Filter, Calendar, Eye, Pencil, Trash2 } from "lucide-react";
import { useBranch } from "../contexts/BranchContext";

const TABS = [
  { label: "Appointments", value: "appointment" },
  { label: "Hotel Cancellation", value: "hotel" },
  { label: "Flight Cancellation", value: "flight" },
];

const calculateUrgency = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Past due";
  if (diff === 0) return "Due today";
  return `Due in ${diff} day${diff > 1 ? "s" : ""}`;
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

function getUrgencyColor(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff > 10) return "text-green-600 bg-green-50";
  if (diff > 5) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

export default function DeadlineList() {
  const { selectedBranch } = useBranch();
  const [selectedTab, setSelectedTab] = useState("appointment");
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderTargetId, setReminderTargetId] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    clientName: "",
    visaType: "",
    dueDate: "",
    source: "",
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState(null);

  const handleHistoryClick = () => {
    // Navigate to history page
    window.location.href = "/history";
  };

  useEffect(() => {
    const fetchDeadlines = async () => {
      setLoading(true);
      try {
        const url = new URL("http://localhost:5000/api/deadlines");
        if (selectedBranch?.branchId && selectedBranch.branchId !== 'all') {
          console.log('Using branchId:', selectedBranch.branchId); // Debug log
          url.searchParams.append('branchId', selectedBranch.branchId);
        }
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (data.success) {
          console.log('Fetched deadlines:', data.data); // Debug log
          setDeadlines(data.data);
        } else {
          console.error('Failed to fetch deadlines:', data.message);
        }
      } catch (err) {
        console.error("Error fetching deadlines", err);
      }
      setLoading(false);
    };
    fetchDeadlines();
  }, [selectedBranch?.branchId]);

  useEffect(() => {
    if (showForm) {
      const fetchClients = async () => {
        try {
          const url = new URL("/api/clients", window.location.origin);
          if (selectedBranch?.branchId && selectedBranch.branchId !== 'all') {
            url.searchParams.append('branchId', selectedBranch.branchId);
          }
          const res = await fetch(url);
          const data = await res.json();
          if (data.success) {
            setClients(data.data);
          }
        } catch (err) {
          console.error("Error fetching clients", err);
        }
      };
      fetchClients();
    }
  }, [showForm, selectedBranch?.branchId]);

  const handleOpenForm = (type) => {
    setFormType(type);
    setShowAddOptions(false);
    setShowForm(true);
  };

  const handleSendEmail = async (deadline) => {
    const subject = `Reminder: ${deadline.type === 'hotel' ? 'Hotel' : deadline.type === 'flight' ? 'Flight' : 'Appointment'} Deadline`;
    const urgency = calculateUrgency(deadline.dueDate);
    let typeText = "your appointment";
    if (deadline.type === "hotel") typeText = "your Hotel cancellation";
    else if (deadline.type === "flight") typeText = "your Flight cancellation";

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Deadline Reminder</h2>
        <p>Dear ${deadline.clientName},</p>
        <p>This is a reminder that ${typeText} is due on <strong>${new Date(deadline.dueDate).toLocaleDateString()}</strong> (${urgency}).</p>
        <p>Please take the necessary action to ensure timely completion.</p>
        ${deadline.source ? `<p>Source: <a href="${deadline.source}">${deadline.source}</a></p>` : ''}
        <p>Best regards,<br>Your Visa Team</p>
      </div>
    `;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to send reminders');
      }

      const res = await fetch('http://localhost:5000/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: deadline.clientEmail || 'sbansotiya@gmail.com', // Fallback email if client email is not available
          subject: subject,
          body: body
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Reminder email sent successfully!');
      } else {
        throw new Error(data.message || 'Failed to send reminder email');
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert(err.message || 'Error sending reminder. Please try again.');
    }
  };

  const handleSendWhatsApp = (deadline) => {
    const urgency = calculateUrgency(deadline.dueDate);
    let typeText = "your appointment";
    if (deadline.type === "hotel") typeText = "your Hotel cancellation";
    else if (deadline.type === "flight") typeText = "your Flight cancellation";

    const message = `Hi ${deadline.clientName}, this is a reminder that ${typeText} is due on ${deadline.dueDate} (${urgency}). Please take the necessary action.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.visaType || !formData.dueDate) return;

    const newDeadline = {
      type: formType,
      clientName: formData.clientName,
      visaType: formData.visaType,
      dueDate: formData.dueDate,
      source: formData.source || "-",
      urgency: calculateUrgency(formData.dueDate)
    };

    console.log('Submitting deadline:', newDeadline); // Debug log

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to create a deadline');
      }

      console.log('Using token:', token.substring(0, 20) + '...'); // Debug log

      const res = await fetch("http://localhost:5000/api/deadlines", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newDeadline),
        credentials: 'include'
      });

      const data = await res.json();
      console.log('Server response:', data); // Debug log

      if (!res.ok) {
        if (data.message.includes('branch not found')) {
          throw new Error('You need to be assigned to a branch to create deadlines. Please contact your administrator.');
        }
        throw new Error(data.message || 'Failed to create deadline');
      }

      if (data.success) {
        setDeadlines((prev) => [...prev, data.data]);
        setShowForm(false);
        setFormData({ clientName: "", visaType: "", dueDate: "", source: "" });
      } else {
        throw new Error(data.message || "Failed to add deadline");
      }
    } catch (err) {
      console.error("Error adding deadline:", err);
      alert(err.message || "Error adding deadline. Please try again.");
    }
  };

  const handleView = (deadline) => {
    setSelectedDeadline(deadline);
    setShowViewModal(true);
  };

  const handleEdit = (deadline) => {
    setSelectedDeadline(deadline);
    setFormData({
      clientName: deadline.clientName,
      visaType: deadline.visaType,
      dueDate: new Date(deadline.dueDate).toISOString().split('T')[0],
      source: deadline.source || "",
    });
    setFormType(deadline.type);
    setShowEditModal(true);
  };

  const handleDelete = async (deadlineId) => {
    if (!window.confirm('Are you sure you want to delete this deadline?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to delete a deadline');
      }

      const res = await fetch(`http://localhost:5000/api/deadlines/${deadlineId}/mark-done`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setDeadlines(prev => prev.filter(d => d._id !== deadlineId));
      } else {
        throw new Error(data.message || 'Failed to delete deadline');
      }
    } catch (err) {
      console.error('Error deleting deadline:', err);
      alert(err.message || 'Error deleting deadline. Please try again.');
    }
  };

  const filteredDeadlines = deadlines.filter((d) => {
    const matchesTab = d.type === selectedTab;

    if (!selectedDate) return matchesTab;

    const deadlineDate = new Date(d.dueDate).toISOString().slice(0, 10);
    return matchesTab && deadlineDate === selectedDate;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="shadow rounded-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-6 py-4 border-b bg-transparent backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Deadlines Management</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* History Button */}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            onClick={handleHistoryClick}
          >
            <History className="w-4 h-4" />
            History
          </button>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setSelectedDate("")}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Add Button */}
          <div className="relative">
            <button
              onClick={() => setShowAddOptions(!showAddOptions)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>

            {showAddOptions && (
              <div className="absolute right-0 mt-2 w-52 bg-transparent shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg z-20">
                {TABS.filter((t) => t.value !== "appointment").map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => handleOpenForm(tab.value)}
                    className="block w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    For {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-transparent backdrop-blur-md">
        <div className="flex justify-center">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value)}
              className={`px-8 py-3 text-sm font-medium border-b-2 transition-colors mx-4 ${
                selectedTab === tab.value
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label} ({deadlines.filter((d) => d.type === tab.value).length})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : filteredDeadlines.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No upcoming deadlines for {selectedBranch?.branchName || 'all branches'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-transparent backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Visa Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Urgency
                </th>
                {selectedTab !== "appointment" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Source
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-transparent backdrop-blur-sm">
              {filteredDeadlines.map((deadline) => (
                <tr key={deadline._id} className="hover:bg-gray-100/10 dark:hover:bg-gray-700/10 transition-colors bg-transparent">
                  <td className="px-6 py-4 whitespace-nowrap bg-transparent">
                    <div className="text-sm text-gray-900 dark:text-white bg-transparent">
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-transparent">
                      {new Date(deadline.dueDate).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap bg-transparent">
                    <div className="text-sm font-medium text-gray-900 dark:text-white bg-transparent">
                      {deadline.clientName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-transparent">
                      {deadline.clientEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap bg-transparent">
                    <div className="text-sm text-gray-900 dark:text-white bg-transparent">
                      {deadline.visaType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap bg-transparent">
                    <div className="text-sm text-gray-900 dark:text-white bg-transparent">
                      {deadline.branchId?.branchName || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap bg-transparent">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      deadline.urgency === "High"
                        ? "bg-red-100/40 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                        : deadline.urgency === "Medium"
                        ? "bg-yellow-100/40 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
                        : "bg-green-100/40 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                    }`}>
                      {deadline.urgency}
                    </span>
                  </td>
                  {selectedTab !== "appointment" && (
                    <td className="px-6 py-4 whitespace-nowrap bg-transparent">
                      {deadline.source?.startsWith("http") ? (
                        <a
                          href={deadline.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50/40 dark:bg-primary-900/40 rounded-md hover:bg-primary-100/40 dark:hover:bg-primary-900/50 transition-colors bg-transparent"
                        >
                          <svg className="w-4 h-4 mr-1 bg-transparent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Visit Source
                        </a>
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-white bg-transparent">{deadline.source || "—"}</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium bg-transparent">
                    <div className="flex items-center gap-2 bg-transparent">
                      <button
                        onClick={() => handleView(deadline)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 hover:bg-primary-50/40 dark:hover:bg-primary-900/40 rounded-lg transition-colors bg-transparent"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 bg-transparent" />
                      </button>
                      <button
                        onClick={() => handleEdit(deadline)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 hover:bg-primary-50/40 dark:hover:bg-primary-900/40 rounded-lg transition-colors bg-transparent"
                        title="Edit Deadline"
                      >
                        <Pencil className="w-4 h-4 bg-transparent" />
                      </button>
                      <button
                        onClick={() => handleDelete(deadline._id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50/40 dark:hover:bg-red-900/40 rounded-lg transition-colors bg-transparent"
                        title="Delete Deadline"
                      >
                        <Trash2 className="w-4 h-4 bg-transparent" />
                      </button>
                      <button
                        onClick={() => handleSendEmail(deadline)}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/40 rounded-md hover:bg-blue-100/40 dark:hover:bg-blue-900/50 transition-colors bg-transparent"
                      >
                        <svg className="w-4 h-4 mr-1 bg-transparent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Reminder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDeadline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-transparent dark:bg-transparent rounded-lg shadow-xl p-6 w-full max-w-md backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Deadline Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-transparent">{selectedDeadline.clientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Type
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-transparent">{selectedDeadline.visaType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-transparent">
                  {new Date(selectedDeadline.dueDate).toLocaleDateString()}
                </p>
              </div>
              {selectedDeadline.source && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-transparent">{selectedDeadline.source}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urgency
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-transparent">{selectedDeadline.urgency}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDeadline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-transparent dark:bg-transparent rounded-lg shadow-xl p-6 w-full max-w-md backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Deadline
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-transparent"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-transparent"
                  value={formData.visaType}
                  onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                >
                  <option value="" className="bg-transparent">Select Visa Type</option>
                  <option value="Tourist" className="bg-transparent">Tourist</option>
                  <option value="Student" className="bg-transparent">Student</option>
                  <option value="Work" className="bg-transparent">Work</option>
                  <option value="Business" className="bg-transparent">Business</option>
                  <option value="PR" className="bg-transparent">Permanent Resident</option>
                  <option value="Dependent" className="bg-transparent">Dependent</option>
                  <option value="Other" className="bg-transparent">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-transparent"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              {selectedDeadline.type !== "appointment" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-transparent"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      throw new Error('Please log in to update the deadline');
                    }

                    const res = await fetch(`http://localhost:5000/api/deadlines/${selectedDeadline._id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        ...formData,
                        type: selectedDeadline.type,
                        urgency: calculateUrgency(formData.dueDate)
                      })
                    });

                    const data = await res.json();
                    if (data.success) {
                      setDeadlines(prev => prev.map(d => 
                        d._id === selectedDeadline._id ? data.data : d
                      ));
                      setShowEditModal(false);
                    } else {
                      throw new Error(data.message || 'Failed to update deadline');
                    }
                  } catch (err) {
                    console.error('Error updating deadline:', err);
                    alert(err.message || 'Error updating deadline. Please try again.');
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-transparent rounded-lg shadow-xl p-6 w-full max-w-md backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Add {formType === "hotel" ? "Hotel" : "Flight"} Cancellation
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  placeholder="Enter client name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source (URL or text)
                </label>
                <input
                  type="text"
                  placeholder="Enter source URL or text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visa Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  value={formData.visaType}
                  onChange={(e) =>
                    setFormData({ ...formData, visaType: e.target.value })
                  }
                >
                  <option value="" className="bg-transparent">Select Visa Type</option>
                  <option value="Tourist" className="bg-transparent">Tourist</option>
                  <option value="Student" className="bg-transparent">Student</option>
                  <option value="Work" className="bg-transparent">Work</option>
                  <option value="Business" className="bg-transparent">Business</option>
                  <option value="PR" className="bg-transparent">Permanent Resident</option>
                  <option value="Dependent" className="bg-transparent">Dependent</option>
                  <option value="Other" className="bg-transparent">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  min={getTodayDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
              {formData.dueDate && (
                <div className="text-sm text-gray-600 bg-transparent">
                  Urgency: {calculateUrgency(formData.dueDate)}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                onClick={handleSubmit}
              >
                Add Deadline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}