import { useState, useEffect } from "react";
import { Plus, FileClock, History, MessageCircleMore, MailCheck, Filter, Calendar } from "lucide-react";
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
    const subject = `Reminder for ${deadline.clientName}`;
    const urgency = calculateUrgency(deadline.dueDate);
    let typeText = "your appointment";
    if (deadline.type === "hotel") typeText = "your Hotel cancellation";
    else if (deadline.type === "flight") typeText = "your Flight cancellation";

    const body = `Hi ${deadline.clientName},\n\nThis is a reminder that ${typeText} is due on ${deadline.dueDate} (${urgency}). Please take the necessary action.\n\nThank you.`;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: deadline.email || 'sbansotiya@gmail.com', // You'll need to add email field to your deadline data
          subject: subject,
          body: body
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Email sent successfully!');
        setReminderTargetId(null); // Close the reminder options
      } else {
        alert('Failed to send email: ' + result.message);
      }
    } catch (error) {
      alert('Error sending email: ' + error.message);
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
    <div className="bg-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-6 py-4 border-b bg-white gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Deadlines Management</h1>
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
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setSelectedDate("")}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
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
              <div className="absolute right-0 mt-2 w-52 bg-white shadow-lg border rounded-lg z-20">
                {TABS.filter((t) => t.value !== "appointment").map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => handleOpenForm(tab.value)}
                    className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b last:border-b-0"
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
      <div className="border-b bg-white">
        <div className="flex justify-center">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value)}
              className={`px-8 py-3 text-sm font-medium border-b-2 transition-colors mx-4 ${selectedTab === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visa Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                {selectedTab !== "appointment" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeadlines.map((deadline) => (
                <tr key={deadline._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(deadline.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {deadline.clientName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900">{deadline.clientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {deadline.visaType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {deadline.branchId?.branchName || 'All Branches'} ({deadline.branchId?.branchId || 'N/A'})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(deadline.dueDate)}`}>
                      {calculateUrgency(deadline.dueDate)}
                    </span>
                  </td>
                  {selectedTab !== "appointment" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deadline.source?.startsWith("http") ? (
                        <a
                          href={deadline.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit
                        </a>
                      ) : (
                        deadline.source || "-"
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        className="bg-blue-100 text-blue-700 px-3 py-1 text-xs rounded-md hover:bg-blue-200 font-medium"
                        onClick={async () => {
                          const id = deadline._id || deadline.id;
                          try {
                            const res = await fetch(
                              `/api/deadlines/${id}/mark-done`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                              }
                            );
                            const data = await res.json();
                            if (data.success) {
                              setDeadlines((prev) =>
                                prev.filter((d) => (d._id || d.id) !== id)
                              );
                            } else {
                              alert("Failed to mark as done");
                            }
                          } catch {
                            alert("Error marking as done");
                          }
                        }}
                      >
                        Mark as Done
                      </button>
                      <button
                        className="bg-gray-100 text-gray-700 px-3 py-1 text-xs rounded-md hover:bg-gray-200 font-medium flex items-center gap-1"
                        onClick={() =>
                          setReminderTargetId(
                            reminderTargetId === deadline._id
                              ? null
                              : deadline._id
                          )
                        }
                      >
                        <MessageCircleMore className="w-3 h-3" />
                        Send Reminder
                      </button>
                    </div>
                    {reminderTargetId === deadline._id && (
                      <div className="mt-2 flex gap-1">
                        <button
                          className="bg-red-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1 hover:bg-red-600"
                          onClick={() => handleSendEmail(deadline)}
                        >
                          <MailCheck className="w-3 h-3" />
                          Email
                        </button>
                        {/* <button
                          className="bg-green-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1 hover:bg-green-600"
                          onClick={() => handleSendWhatsApp(deadline)}
                        >
                          <MessageCircleMore className="w-3 h-3" />
                          WhatsApp
                        </button> */}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.visaType}
                  onChange={(e) =>
                    setFormData({ ...formData, visaType: e.target.value })
                  }
                >
                  <option value="">Select Visa Type</option>
                  <option value="Tourist">Tourist</option>
                  <option value="Student">Student</option>
                  <option value="Work">Work</option>
                  <option value="Business">Business</option>
                  <option value="PR">Permanent Resident</option>
                  <option value="Dependent">Dependent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  min={getTodayDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
              {formData.dueDate && (
                <div className="text-sm text-gray-600">
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