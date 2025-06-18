import { useState, useEffect } from "react";
import { 
  Plus, 
  FileClock, 
  History, 
  MessageCircleMore, 
  MailCheck, 
  Filter, 
  Calendar, 
  Eye, 
  Pencil, 
  Trash2,
  RefreshCw,
  Bell,
  Clock,
  CheckCircle,
  ArrowRightCircle,
  ListChecks,
  Send
} from "lucide-react";
import { useBranch } from "../contexts/BranchContext";
import { useUser } from '../context/UserContext';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Deadlines
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
            <div className="relative">
              <Button
                className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                onClick={() => setShowDateFilter(!showDateFilter)}
              >
                <Filter className="w-4 h-4" />
                <span>Filter by Date</span>
              </Button>
              {showDateFilter && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-10 border border-gray-200 dark:border-gray-700">
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      className="bg-transparent text-gray-700 dark:text-gray-300"
                      onClick={() => setSelectedDate("")}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleHistoryClick}
              className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Button>
            
            <div className="relative">
              <Button
                onClick={() => setShowAddOptions(!showAddOptions)}
                className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="w-5 h-5" />
                <span>Add Deadline</span>
              </Button>
              {showAddOptions && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-2 z-10 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-xl">
                  {TABS.map((tab) => (
                    <Button
                      key={tab.value}
                      variant="ghost"
                      className="w-full justify-start text-left px-4 py-2 mb-1 hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                      onClick={() => handleOpenForm(tab.value)}
                    >
                      {tab.value === "appointment" ? (
                        <FileClock className="w-4 h-4 mr-2" />
                      ) : tab.value === "hotel" ? (
                        <ListChecks className="w-4 h-4 mr-2" />
                      ) : (
                        <ArrowRightCircle className="w-4 h-4 mr-2" />
                      )}
                      {tab.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-full p-1">
            {TABS.map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value}
                className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white"
              >
                {tab.value === "appointment" ? (
                  <FileClock className="w-4 h-4 mr-2" />
                ) : tab.value === "hotel" ? (
                  <ListChecks className="w-4 h-4 mr-2" />
                ) : (
                  <ArrowRightCircle className="w-4 h-4 mr-2" />
                )}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-6">
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {tab.label} Deadlines
                    </h3>
                    <Button
                      variant="outline"
                      className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                      onClick={() => handleOpenForm(tab.value)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Client</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Visa Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Urgency</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6">
                              <div className="flex justify-center items-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                                <span className="ml-3 text-gray-500 dark:text-gray-400">Loading deadlines...</span>
                              </div>
                            </td>
                          </tr>
                        ) : deadlines.filter(d => 
                          d.type === tab.value && 
                          (!selectedDate || new Date(d.dueDate).toISOString().split('T')[0] === selectedDate)
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-gray-500 dark:text-gray-400">
                              No {tab.label.toLowerCase()} deadlines found
                              {selectedDate && ` for ${new Date(selectedDate).toLocaleDateString()}`}
                            </td>
                          </tr>
                        ) : (
                          deadlines
                            .filter(d => 
                              d.type === tab.value && 
                              (!selectedDate || new Date(d.dueDate).toISOString().split('T')[0] === selectedDate)
                            )
                            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                            .map((deadline) => (
                              <tr 
                                key={deadline._id}
                                className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                              >
                                <td className="text-gray-900 dark:text-white py-3 px-4">{deadline.clientName}</td>
                                <td className="text-gray-900 dark:text-white py-3 px-4">{deadline.visaType}</td>
                                <td className="text-gray-900 dark:text-white py-3 px-4">{formatDate(deadline.dueDate)}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={`
                                    ${getUrgencyColor(deadline.dueDate)}
                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  `}>
                                    {calculateUrgency(deadline.dueDate)}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex justify-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleView(deadline)}
                                      className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(deadline)}
                                      className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(deadline._id)}
                                      className="hover:bg-red-100/30 dark:hover:bg-red-900/20 text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <div className="relative">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowReminderOptionsForId(showReminderOptionsForId === deadline._id ? null : deadline._id)}
                                        className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                                      >
                                        <Send className="w-4 h-4" />
                                      </Button>
                                      {showReminderOptionsForId === deadline._id && (
                                        <div className="absolute z-10 right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200/50 dark:border-gray-700/50">
                                          <Button
                                            variant="ghost"
                                            className="w-full justify-start text-left px-3 py-2 mb-1 hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                                            onClick={() => handleSendEmail(deadline)}
                                          >
                                            <MailCheck className="w-4 h-4 mr-2" />
                                            Send Email
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            className="w-full justify-start text-left px-3 py-2 hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                                            onClick={() => handleSendWhatsApp(deadline)}
                                          >
                                            <MessageCircleMore className="w-4 h-4 mr-2" />
                                            Send WhatsApp
                                          </Button>
                                        </div>
                                      )}
                                    </div>
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
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* View Modal */}
      {showViewModal && selectedDeadline && (
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-2xl sm:max-w-md">
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
            
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Deadline Details
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                {selectedDeadline.type === 'appointment' ? 'Appointment' : 
                selectedDeadline.type === 'hotel' ? 'Hotel Cancellation' : 
                'Flight Cancellation'} deadline for {selectedDeadline.clientName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Client</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDeadline.clientName}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Visa Type</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDeadline.visaType}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Due Date</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedDeadline.dueDate)}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Urgency</Label>
                  <Badge variant="outline" className={`
                    ${getUrgencyColor(selectedDeadline.dueDate)}
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                  `}>
                    {calculateUrgency(selectedDeadline.dueDate)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Branch</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDeadline.branchName || 'Unknown'}
                  </p>
                </div>
                {selectedDeadline.type !== 'appointment' && selectedDeadline.source && (
                  <div className="col-span-2">
                    <Label className="text-gray-500 dark:text-gray-400">Source</Label>
                    <p className="font-medium text-gray-900 dark:text-white break-all">
                      {selectedDeadline.source}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
                className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedDeadline);
                }}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
              >
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
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