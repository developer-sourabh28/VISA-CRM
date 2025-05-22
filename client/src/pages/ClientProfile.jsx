import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  CreditCard, 
  User, 
  FileText,
  Clock,
  ChevronRight,
  Plus,
  ArrowLeft,
  Send,
  CircleUser
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getClient, getClientAppointments } from '../lib/api';
import { useToast } from '../hooks/use-toast';

function ClientProfile() {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('history');

  // Fetch client data
  const { 
    data: client, 
    isLoading: clientLoading, 
    error: clientError 
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id),
    enabled: !!id,
  });

  // Fetch client activities/history
  const { 
    data: activities, 
    isLoading: activitiesLoading, 
    error: activitiesError 
  } = useQuery({
    queryKey: ['clientAppointments', id],
    queryFn: () => getClientAppointments(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (clientError) {
      toast({
        title: "Error loading client",
        description: clientError.message || "Could not load client data. Please try again.",
        variant: "destructive"
      });
    }
    
    if (activitiesError) {
      toast({
        title: "Error loading activities",
        description: activitiesError.message || "Could not load activity data. Please try again.",
        variant: "destructive"
      });
    }
  }, [clientError, activitiesError, toast]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (clientLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">Loading client profile...</div>
      </div>
    );
  }

  if (!client && !clientLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">
          <h2 className="text-xl font-medium">Client not found</h2>
          <p className="mt-2 text-gray-600">The client you're looking for doesn't exist or you may not have permission to view it.</p>
          <Link href="/clients">
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Return to Clients
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Convert client status to badge color
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Active":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-purple-100 text-purple-800";
      case "Hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Header Area */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                  <CircleUser size={24} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-medium">{client.firstName} {client.lastName}</h1>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {client.status || "Active"}
                  </span>
                </div>
                <div className="text-sm text-gray-500">Business Visa (B1)</div>
                <div className="mt-1 text-xs text-gray-500">
                  Updated: {formatDate(client.updatedAt || new Date())} • {client.updatedAt ? '2 days ago' : '2 days ago'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Client Details Row */}
          <div className="grid grid-cols-4 gap-8 mt-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Assigned Consultant</div>
              <div className="text-sm font-medium">
                {client.assignedConsultant?.firstName
                  ? `${client.assignedConsultant.firstName} ${client.assignedConsultant.lastName || ""}`
                  : client.assignedConsultant || "Mark Wilson"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Application ID</div>
              <div className="text-sm font-medium">
                {client._id ? client._id.substring(0, 8) : "SVS-2023-1284"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Country</div>
              <div className="text-sm font-medium">
                {client.address?.country || "United States"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Timeline</div>
              <div className="text-sm font-medium">
                Started: {formatDate(client.createdAt) || "Jan 15, 2023"}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button className="px-3 py-2 text-sm border border-gray-300 bg-white rounded-md hover:bg-gray-50 inline-flex items-center gap-2">
              <Plus size={16} /> Add Task
            </button>
            <button className="px-3 py-2 text-sm border border-gray-300 bg-white rounded-md hover:bg-gray-50 inline-flex items-center gap-2">
              <Send size={16} /> Send Email
            </button>
            <button className="px-3 py-2 text-sm border border-gray-300 bg-white rounded-md hover:bg-gray-50 inline-flex items-center gap-2">
              <Clock size={16} /> Update Status
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">

        {/* Main content area with tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          {/* Tabs navigation */}
          <div className="border-b">
            <nav className="flex">
              <button 
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('history')}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  History
                </div>
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('payments')}
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={16} />
                  Payments
                </div>
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'documents' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('documents')}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Documents
                </div>
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('notes')}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Notes
                </div>
              </button>
            </nav>
          </div>
          
          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'history' && (
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Activity</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Assigned To</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 pr-4">
                        <div className="text-sm">Mar 15, 2023</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-sm font-medium">Document Submission</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-sm">Mark Wilson</div>
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-blue-600 hover:underline text-xs flex items-center gap-1 ml-auto">
                          View Details <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 pr-4">
                        <div className="text-sm">Mar 10, 2023</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-sm font-medium">Initial Consultation</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-sm">Sarah Thompson</div>
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-blue-600 hover:underline text-xs flex items-center gap-1 ml-auto">
                          View Details <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">
                        <div className="text-sm">Mar 5, 2023</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-sm font-medium">Application Review</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          In Progress
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-sm">Mark Wilson</div>
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-blue-600 hover:underline text-xs flex items-center gap-1 ml-auto">
                          View Details <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'payments' && (
              <div className="text-center py-6 text-gray-500">
                Payment history will be displayed here.
              </div>
            )}
            
            {activeTab === 'documents' && (
              <div className="text-center py-6 text-gray-500">
                Client's documents will be displayed here.
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="text-center py-6 text-gray-500">
                Client notes will be displayed here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientProfile;