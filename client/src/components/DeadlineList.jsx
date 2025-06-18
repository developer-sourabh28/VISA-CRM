import { useState, useEffect } from "react";
import { Plus, FileClock, History, MessageCircleMore, MailCheck, Filter, Calendar, Eye, Pencil, Trash2 } from "lucide-react";
import { useBranch } from "../contexts/BranchContext";
import { useUser } from '../context/UserContext';

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
  const { user } = useUser();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';
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
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    clientName: "",
    visaType: "",
    dueDate: "",
    source: "",
    branchId: "",
    reminderTime: "",
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const [showReminderOptionsForId, setShowReminderOptionsForId] = useState(null);

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
          console.log('Using branchId:', selectedBranch.branchId);
          url.searchParams.append('branchId', selectedBranch.branchId);
        }
        console.log('Fetching deadlines with URL:', url.toString());
        
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        console.log('Fetched deadlines response:', data);
        
        if (data.success) {
          console.log('Fetched deadlines:', data.data);
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

  // Fetch branches when the component mounts or selectedBranch changes
  useEffect(() => {
    const fetchBranches = async () => {
      console.log('Attempting to fetch branches...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found. Cannot fetch branches.');
        return;
      }

      try {
        const branchesRes = await fetch("http://localhost:5000/api/branches", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        console.log('Branches API Response Status:', branchesRes.status);

        if (!branchesRes.ok) {
          const errorText = await branchesRes.text();
          console.error(`Branches API returned ${branchesRes.status}:`, errorText);
          throw new Error(`Failed to fetch branches. Server responded with status ${branchesRes.status}`);
        }

        const branchesData = await branchesRes.json();
        console.log('Branches API Response Data:', branchesData);

        if (branchesData.success) {
          setBranches(branchesData.data);
          console.log('Branches fetched successfully:', branchesData.data);
          // Set default branch for non-admin users if not already set
          if (!isAdmin && user?.branch && branchesData.data.length > 0) {
            const userAssignedBranch = branchesData.data.find(b => b.branchName === user.branch);
            if (userAssignedBranch) {
              setFormData(prev => ({ ...prev, branchId: userAssignedBranch.branchId }));
            }
          }
        } else {
          console.error('Branches API reported success: false. Message:', branchesData.message);
        }
      } catch (err) {
        console.error("Error during branches fetch operation:", err);
      }
    };

    fetchBranches();
  }, [isAdmin, user?.branch]); // Dependencies: isAdmin and user.branch to refetch if user changes

  useEffect(() => {
    if (showForm) {
      const fetchData = async () => {
        try {
          // Fetch clients
          const clientsUrl = new URL("/api/clients", window.location.origin);
          if (selectedBranch?.branchId && selectedBranch.branchId !== 'all') {
            clientsUrl.searchParams.append('branchId', selectedBranch.branchId);
          }
          const clientsRes = await fetch(clientsUrl);
          const clientsData = await clientsRes.json();
          if (clientsData.success) {
            setClients(clientsData.data);
          }

          // Set default branch if not already set when opening the form (only for initial state)
          // This is redundant if already set by the branch fetching useEffect, but good for robustness
          if (!isAdmin && user?.branch && branches.length > 0) {
            const userAssignedBranch = branches.find(b => b.branchName === user.branch);
            if (userAssignedBranch && !formData.branchId) {
              setFormData(prev => ({ ...prev, branchId: userAssignedBranch.branchId }));
            }
          }

        } catch (err) {
          console.error("Error fetching data:", err);
        }
      };
      fetchData();
    }
  }, [showForm, selectedBranch?.branchId, isAdmin, user?.branch, branches, formData.branchId]);

  const handleOpenForm = (type) => {
    setFormType(type);
    setShowAddOptions(false);
    setShowForm(true);
    console.log('handleOpenForm called, setting showForm to true for type:', type);
    // Reset form data when opening
    setFormData({
      clientName: "",
      visaType: "",
      dueDate: "",
      source: "",
      branchId: "",
      reminderTime: "",
    });
  };

  const handleSendEmail = async (deadline) => {
    if (!deadline.clientEmail) {
      alert('Client email is not available for this deadline.');
      return;
    }

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

      const res = await fetch('http://localhost:5000/api/email-templates/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: deadline.clientEmail,
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

  const handleSendWhatsApp = async (deadline) => {
    if (!deadline.clientPhone) {
      alert('Client WhatsApp number is not available for this deadline.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to send WhatsApp reminders');
      }

      // Format the deadline data to match template variables
      const formattedDeadline = {
        clientName: deadline.clientName,
        dueDate: new Date(deadline.dueDate).toLocaleDateString(),
        visaType: deadline.visaType,
        clientPhone: deadline.clientPhone
      };

      const res = await fetch('http://localhost:5000/api/whatsapp-templates/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: deadline.type.toUpperCase(),
          deadline: formattedDeadline
        })
      });

      const data = await res.json();
      if (data.success) {
        window.open(data.url, "_blank");
        alert('WhatsApp chat opened successfully!');
      } else {
        throw new Error(data.message || 'Failed to generate WhatsApp message');
      }
    } catch (err) {
      console.error('Error sending WhatsApp reminder:', err);
      alert(err.message || 'Error sending WhatsApp reminder. Please try again.');
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.clientName || !formData.visaType || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to create a deadline');
      }

      // Set branch based on user role
      let branchId;
      if (isAdmin) {
        branchId = formData.branchId;
        console.log('Admin user - using selected branchId:', branchId);
      } else {
        // For non-admin users, find the branch ID from the branches list
        const userBranch = branches.find(b => b.branchName === user?.branch);
        if (userBranch) {
          branchId = userBranch.branchId;
          console.log('Non-admin user - found branchId:', branchId);
        } else {
          console.error('Branch information missing:', { 
            isAdmin, 
            userBranch: user?.branch, 
            availableBranches: branches 
          });
          throw new Error('Branch information is required. Please ensure you have a branch assigned.');
        }
      }

      if (!branchId) {
        console.error('Branch information missing:', { isAdmin, userBranch: user?.branch, formBranchId: formData.branchId });
        throw new Error('Branch information is required. Please ensure you have a branch assigned.');
      }

      console.log('Submitting with branchId:', branchId); // Debug log

      const newDeadline = {
        type: formType,
        clientName: formData.clientName,
        visaType: formData.visaType,
        dueDate: formData.dueDate,
        source: formData.source || "-",
        urgency: calculateUrgency(formData.dueDate),
        branchId: branchId,
        reminderTime: formData.reminderTime
      };

      console.log('Sending deadline data:', newDeadline);

      const res = await fetch("http://localhost:5000/api/deadlines", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newDeadline)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add deadline');
      }

      if (data.success) {
        setDeadlines((prev) => [...prev, data.data]);
        setShowForm(false);
        setFormData({ clientName: "", visaType: "", dueDate: "", source: "", branchId: "", reminderTime: "" });
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
      branchId: deadline.branchId?.branchId || deadline.branchId || "",
      reminderTime: deadline.reminderTime || "",
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
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setDeadlines(prev => prev.filter(d => d._id !== deadlineId));
        alert('Deadline moved to history!');
      } else {
        throw new Error(data.message || 'Failed to move deadline to history');
      }
    } catch (err) {
      console.error('Error moving deadline to history:', err);
      alert(err.message || 'Error moving deadline to history. Please try again.');
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
    <div className="min-h-[95%] shadow rounded-xl backdrop-blur-md">
      {/* Header */}
      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center px-6 py-4 border-b bg-transparent backdrop-blur-md">
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
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg z-[999]">
                {TABS.filter((t) => t.value !== "appointment").map((tab) => (
                  <button
                    key={tab.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenForm(tab.value);
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 last:border-b-0 first:rounded-t-lg last:rounded-b-lg cursor-pointer"
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
      <div className="border-b border-gray-200 dark:border-gray-700 bg-transparent backdrop-blur-sm">
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
                <tr key={deadline._id} className="hover:bg-gray-100/10 dark:hover:bg-gray-700/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-transparent">
                      {new Date(deadline.dueDate).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white bg-transparent">
                      {deadline.clientName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-transparent">
                      {deadline.clientEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white bg-transparent">
                      {deadline.visaType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white bg-transparent">
                      {deadline.branchId?.branchName || '—'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-transparent">
                      {deadline.branchId?.branchLocation || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(deadline)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 hover:bg-primary-50/40 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(deadline)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 hover:bg-primary-50/40 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
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
                      <div className="relative">
                        {/* <button
                          onClick={() => setShowReminderOptionsForId(showReminderOptionsForId === deadline._id ? null : deadline._id)}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/40 rounded-md hover:bg-blue-100/40 dark:hover:bg-blue-900/50 transition-colors bg-transparent"
                        >
                          <svg className="w-4 h-4 mr-1 bg-transparent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Send Reminder
                        </button> */}

                        {showReminderOptionsForId === deadline._id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded-lg z-10">
                            <button
                              onClick={() => { handleSendEmail(deadline); setShowReminderOptionsForId(null); }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
                            >
                              <MailCheck className="w-4 h-4 inline-block mr-2" /> Email
                            </button>
                            <button
                              onClick={() => { handleSendWhatsApp(deadline); setShowReminderOptionsForId(null); }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg"
                            >
                              <MessageCircleMore className="w-4 h-4 inline-block mr-2" /> WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            {/* Background gradient and blur effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl"></div>
            <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
            
            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Deadline Details
                  </h3>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Info */}
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 dark:from-blue-500/10 dark:to-blue-600/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Client Information</h4>
                  </div>
                  <div className="space-y-1 pl-12">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {selectedDeadline.clientName}
                    </p>
                    {selectedDeadline.clientEmail && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{selectedDeadline.clientEmail}</span>
                      </div>
                    )}
                    {selectedDeadline.clientPhone && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="truncate">{selectedDeadline.clientPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deadline Info */}
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-14 h-14 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline Information</h4>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedDeadline.dueDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(selectedDeadline.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visa Info */}
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-14 h-14 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Visa Information</h4>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDeadline.visaType}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {selectedDeadline.type === "hotel" ? "Hotel Cancellation" : 
                         selectedDeadline.type === "flight" ? "Flight Cancellation" : 
                         "Appointment"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Urgency Status */}
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-14 h-14 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Urgency Status</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      calculateUrgency(selectedDeadline.dueDate).includes("Past due") || calculateUrgency(selectedDeadline.dueDate).includes("Due today")
                        ? "bg-red-100/40 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                        : calculateUrgency(selectedDeadline.dueDate).includes("days") && parseInt(calculateUrgency(selectedDeadline.dueDate).split(' ')[2]) <= 5
                        ? "bg-yellow-100/40 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
                        : "bg-green-100/40 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                    }`}>
                      {calculateUrgency(selectedDeadline.dueDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Source Link (if available) */}
              {selectedDeadline.source && (
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</h4>
                      {selectedDeadline.source.startsWith("http") ? (
                        <a
                          href={selectedDeadline.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                        >
                          <span className="truncate max-w-[200px]">{selectedDeadline.source}</span>
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white">{selectedDeadline.source}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleSendEmail(selectedDeadline)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/40 rounded-lg hover:bg-blue-100/40 dark:hover:bg-blue-900/50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Reminder
              </button>
              <button
                onClick={() => handleSendWhatsApp(selectedDeadline)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50/40 dark:bg-green-900/40 rounded-lg hover:bg-green-100/40 dark:hover:bg-green-900/50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDeadline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md backdrop-blur-md">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.visaType}
                  onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch
                </label>
                {isAdmin ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.branchId}
                    onChange={(e) => {
                      console.log('Selected branch value:', e.target.value);
                      setFormData({ ...formData, branchId: e.target.value });
                    }}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch.branchId}>
                        {branch.branchName} - {branch.branchLocation}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                    value={user?.branch || ''}
                    disabled
                  />
                )}
              </div>
              {selectedDeadline.type !== "appointment" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add {formType === "hotel" ? "Hotel" : formType === "flight" ? "Flight" : "Appointment"} Deadline
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.visaType}
                  onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                  required
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  min={getTodayDate()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch
                </label>
                {isAdmin ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.branchId}
                    onChange={(e) => {
                      console.log('Selected branch value:', e.target.value);
                      setFormData({ ...formData, branchId: e.target.value });
                    }}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch.branchId}>
                        {branch.branchName} - {branch.branchLocation}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                    value={user?.branch || ''}
                    disabled
                  />
                )}
              </div>
              {(formType === "hotel" || formType === "flight") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>
              )}
              {formData.dueDate && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Urgency: {calculateUrgency(formData.dueDate)}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleFormSubmit}
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