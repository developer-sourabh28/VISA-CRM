import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Shield, Plus, X, UserCog, Check, Eye, Edit, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const MODULES = [
  { id: 'enquiries', name: 'Enquiries' },
  { id: 'clients', name: 'Clients' },
  { id: 'appointments', name: 'Appointments' },
  { id: 'deadlines', name: 'Deadlines' },
  { id: 'quickInvoice', name: 'Quick Invoice' },
  { id: 'reports', name: 'Reports' },
  { id: 'reminders', name: 'Reminders' },
  { id: 'settings', name: 'Settings' },
];

const DASHBOARD_COMPONENTS = [
  { id: 'summaryCard', name: 'Summary Cards' },
  { id: 'chartBox', name: 'Chart Box' },
  { id: 'leadStats', name: 'Lead Statistics' },
  { id: 'recentEnquiries', name: 'Recent Enquiries' },
  { id: 'upcomingAppointments', name: 'Upcoming Appointments' },
  { id: 'paymentStats', name: 'Payment Statistics' },
];

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [formStep, setFormStep] = useState(0);
  const [isServerConnected, setIsServerConnected] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      dashboard: {
        components: [],
      },
      enquiries: [],
      clients: [],
      appointments: [],
      deadlines: [],
      quickInvoice: [],
      reports: [],
      reminders: [],
      settings: [],
    }
  });
  
  const { toast } = useToast();
  const steps = ["general", "dashboard", "modules"];

  const checkServerConnection = async () => {
    try {
      const response = await fetch('/api/roles', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      setIsServerConnected(true);
      return true;
    } catch (error) {
      console.error('Server connection check failed:', error);
      setIsServerConnected(false);
      
      toast({
        title: "Server Connection Error",
        description: "Cannot connect to the server. Please make sure the backend server is running.",
        variant: "destructive",
        duration: 5000,
      });
      
      return false;
    }
  };

  useEffect(() => {
    const initComponent = async () => {
      const isConnected = await checkServerConnection();
      if (isConnected) {
    fetchRoles();
      }
    };
    
    initComponent();
  }, []);

  const fetchRoles = async () => {
    if (!isServerConnected) {
      const isConnected = await checkServerConnection();
      if (!isConnected) return;
    }

    try {
      const response = await fetch('/api/roles');
      
      if (response.ok) {
      const data = await response.json();
      setRoles(data);
      } else {
        console.error(`Error fetching roles: ${response.status} ${response.statusText}`);
        toast({
          title: "Error",
          description: "Failed to fetch roles. Please refresh the page.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Network error fetching roles:', error);
      setIsServerConnected(false);
      toast({
        title: "Network Error",
        description: "Failed to connect to the server. Please check if the backend is running.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModulePermissionChange = (moduleId, permission) => {
    setFormData(prev => {
      const updatedPermissions = { ...prev.permissions };
      
      if (updatedPermissions[moduleId].includes(permission)) {
        updatedPermissions[moduleId] = updatedPermissions[moduleId].filter(p => p !== permission);
      } else {
        updatedPermissions[moduleId] = [...updatedPermissions[moduleId], permission];
        
        if (permission === 'edit' && !updatedPermissions[moduleId].includes('view')) {
          updatedPermissions[moduleId].push('view');
        }
      }
      
      return {
        ...prev,
        permissions: updatedPermissions
      };
    });
  };

  const handleDashboardComponentToggle = (componentId) => {
    setFormData(prev => {
      const updatedComponents = [...prev.permissions.dashboard.components];
      
      if (updatedComponents.includes(componentId)) {
        const index = updatedComponents.indexOf(componentId);
        updatedComponents.splice(index, 1);
      } else {
        updatedComponents.push(componentId);
      }
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          dashboard: {
            ...prev.permissions.dashboard,
            components: updatedComponents
          }
        }
      };
    });
  };

  const getModulePermission = (moduleId) => {
    const permissions = formData.permissions[moduleId] || [];
    if (permissions.includes('edit')) return 'edit';
    if (permissions.includes('view')) return 'view';
    return '';
  };

  const handleNextStep = () => {
    if (formStep === 0) {
      if (!formData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Role name is required",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    } else if (formStep === 1) {
      if (formData.permissions.dashboard.components.length === 0) {
        toast({
          title: "Warning",
          description: "No dashboard components selected. This role won't see any dashboard widgets.",
          duration: 3000,
        });
      }
    }
    
    if (formStep < steps.length - 1) {
      const nextStep = formStep + 1;
      setFormStep(nextStep);
      setActiveTab(steps[nextStep]);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 0) {
      const prevStep = formStep - 1;
      setFormStep(prevStep);
      setActiveTab(steps[prevStep]);
    }
  };

  const handleResetForm = () => {
    setFormStep(0);
    setActiveTab("general");
    setFormData({
      name: '',
      description: '',
      permissions: {
        dashboard: {
          components: [],
        },
        enquiries: [],
        clients: [],
        appointments: [],
        deadlines: [],
        quickInvoice: [],
        reports: [],
        reminders: [],
        settings: [],
      }
    });
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const validateForm = () => {
    const hasAnyModulePermissions = Object.entries(formData.permissions)
      .some(([key, value]) => {
        if (key === 'dashboard') return false;
        return Array.isArray(value) && value.length > 0;
      });
    
    if (!hasAnyModulePermissions) {
      toast({
        title: "Warning",
        description: "No module permissions set. This role won't have access to any modules.",
        duration: 3000,
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isServerConnected) {
      const isConnected = await checkServerConnection();
      if (!isConnected) return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Create a deep copy of the form data to avoid modifying the state directly
      const roleData = JSON.parse(JSON.stringify(formData));
      
      // Ensure permissions is an object, not an array
      if (Array.isArray(roleData.permissions)) {
        roleData.permissions = roleData.permissions[0] || {
          dashboard: { components: [] },
          enquiries: [],
          clients: [],
          appointments: [],
          deadlines: [],
          quickInvoice: [],
          reports: [],
          reminders: [],
          settings: []
        };
      }
      
      console.log('Submitting role data:', roleData);
      
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });
      
      // Handle different response statuses
      if (response.ok) {
        toast({
          title: "Success",
          description: "Role added successfully!",
          variant: "default",
          duration: 3000,
        });
        handleResetForm();
        fetchRoles();
      } else {
        // Try to get more detailed error information
        let errorMessage = 'Failed to create role';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        console.error(`Error creating role: ${response.status} ${response.statusText}`, errorMessage);
        toast({
          title: "Error",
          description: `Error creating role: ${errorMessage}`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Network error creating role:', error);
      setIsServerConnected(false);
      toast({
        title: "Network Error",
        description: `Failed to connect to the server. Please check if the backend is running.`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleEdit = async (role) => {
    try {
      const response = await fetch(`/api/roles/${role._id}`);
      if (response.ok) {
        const fullRoleData = await response.json();
        
    setFormData({
          name: fullRoleData.name,
          description: fullRoleData.description || '',
          permissions: fullRoleData.permissions || {
            dashboard: {
              components: [],
            },
            enquiries: [],
            clients: [],
            appointments: [],
            deadlines: [],
            quickInvoice: [],
            reports: [],
            reminders: [],
            settings: [],
          }
        });
        
    setIsEditing(true);
        setEditingId(fullRoleData._id);
    setShowForm(true);
      }
    } catch (error) {
      console.error('Error fetching role details:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!isServerConnected) {
      const isConnected = await checkServerConnection();
      if (!isConnected) return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Create a deep copy of the form data to avoid modifying the state directly
      const roleData = JSON.parse(JSON.stringify(formData));
      
      // Ensure permissions is an object, not an array
      if (Array.isArray(roleData.permissions)) {
        roleData.permissions = roleData.permissions[0] || {
          dashboard: { components: [] },
          enquiries: [],
          clients: [],
          appointments: [],
          deadlines: [],
          quickInvoice: [],
          reports: [],
          reminders: [],
          settings: []
        };
      }
      
      console.log('Updating role data:', roleData);
      
      const response = await fetch(`/api/roles/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Role updated successfully!",
          variant: "default",
          duration: 3000,
        });
        handleResetForm();
        fetchRoles();
      } else {
        let errorMessage = 'Failed to update role';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        console.error(`Error updating role: ${response.status} ${response.statusText}`, errorMessage);
        toast({
          title: "Error",
          description: `Error updating role: ${errorMessage}`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Network error updating role:', error);
      setIsServerConnected(false);
      toast({
        title: "Network Error",
        description: `Failed to connect to the server. Please check if the backend is running.`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Role deleted successfully!",
          variant: "default",
          duration: 3000,
        });
        fetchRoles();
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: `Error deleting role: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const renderPermissionBadge = (role) => {
    let totalPermissions = 0;
    
    if (role.permissions) {
      if (role.permissions.dashboard?.components) {
        totalPermissions += role.permissions.dashboard.components.length;
      }
      
      MODULES.forEach(module => {
        if (role.permissions[module.id] && role.permissions[module.id].length > 0) {
          totalPermissions += 1;
        }
      });
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
        <Shield className="w-3 h-3 mr-1" />
        {totalPermissions} permissions
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative z-20 p-6 space-y-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Role Management
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-5">
              Configure user roles and permissions
            </p>
          </div>

          <Button 
            onClick={() => {
              if (!isServerConnected) {
                checkServerConnection().then(isConnected => {
                  if (isConnected) {
                    setShowForm(true);
                  }
                });
              } else {
                setShowForm(true);
              }
            }}
            className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Plus className="w-5 h-5" />
            <span>Add New Role</span>
          </Button>
        </div>

        {!isServerConnected && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <div className="flex items-center">
              <div className="py-1">
                <svg className="w-6 h-6 mr-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="font-bold">Server Connection Error</p>
                <p className="text-sm">Cannot connect to the backend server. Please ensure the server is running.</p>
                <button 
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 flex items-center"
                  onClick={checkServerConnection}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Roles</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Role Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Permissions</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No roles found. Add your first role to get started.
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr 
                        key={role._id}
                        className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="text-gray-900 dark:text-white py-3 px-4 font-medium">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            <span>{role.name}</span>
                          </div>
                        </td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{role.description}</td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">
                          {renderPermissionBadge(role)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(role)}
                              className="p-1 rounded-full text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(role._id)}
                              className="p-1 rounded-full text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100/30 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowForm(false);
            setIsEditing(false);
            setEditingId(null);
            setFormData({ 
              name: '', 
              description: '',
              permissions: {
                dashboard: {
                  components: [],
                },
                enquiries: [],
                clients: [],
                appointments: [],
                deadlines: [],
                quickInvoice: [],
                reports: [],
                reminders: [],
                settings: [],
              }
            });
          }}></div>
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-2xl w-full max-w-4xl p-6 z-10 relative overflow-y-auto max-h-[90vh]">
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white">
                  <UserCog className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'Add New'} Role</h2>
              </div>
              <button
                onClick={handleResetForm}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step} className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        formStep === index 
                          ? 'bg-amber-500 text-white' 
                          : formStep > index 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {formStep > index ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      formStep === index 
                        ? 'text-amber-600 dark:text-amber-400 font-medium' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="relative mt-2">
                <div className="absolute top-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full rounded-full"></div>
                <div 
                  className="absolute top-0 left-0 h-1 bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${(formStep / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="space-y-6">
              <Tabs defaultValue="general" value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
                setFormStep(steps.indexOf(value));
              }} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="general" onClick={() => setFormStep(0)}>General</TabsTrigger>
                  <TabsTrigger value="dashboard" onClick={() => setFormStep(1)}>Dashboard</TabsTrigger>
                  <TabsTrigger value="modules" onClick={() => setFormStep(2)}>Module Permissions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 dark:text-white">Role Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter role name"
                  className="border border-gray-200/50 dark:border-gray-600/50 bg-transparent"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900 dark:text-white">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter role description"
                  className="border border-gray-200/50 dark:border-gray-600/50 bg-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                      onClick={handleResetForm}
                      className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={handleNextStep}
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="dashboard" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dashboard Components</CardTitle>
                      <CardDescription>Select which dashboard components this role can view</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DASHBOARD_COMPONENTS.map((component) => (
                          <div key={component.id} className="flex items-start space-x-2">
                            <Checkbox 
                              id={`dashboard-${component.id}`} 
                              checked={formData.permissions.dashboard.components.includes(component.id)}
                              onCheckedChange={() => handleDashboardComponentToggle(component.id)}
                            />
                            <Label 
                              htmlFor={`dashboard-${component.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {component.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between space-x-3 pt-4">
                    <Button 
                      type="button"
                      onClick={handlePrevStep}
                      variant="outline"
                      className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                    >
                      Back
                    </Button>
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetForm}
                        className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button"
                        onClick={handleNextStep}
                        className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="modules" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Module Permissions</CardTitle>
                      <CardDescription>
                        Configure access levels for each module
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-4 text-sm font-medium pb-2 border-b">
                          <div>Module</div>
                          <div>No Access</div>
                          <div>Only See (View)</div>
                          <div>See and Edit (Full Access)</div>
                        </div>
                        
                        {MODULES.map((module) => (
                          <div key={module.id} className="grid grid-cols-4 items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <div className="font-medium">{module.name}</div>
                            
                            <div className="flex items-center">
                              <Checkbox 
                                id={`${module.id}-none`}
                                checked={getModulePermission(module.id) === ''}
                                onCheckedChange={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      [module.id]: []
                                    }
                                  }));
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center">
                              <Checkbox 
                                id={`${module.id}-view`}
                                checked={getModulePermission(module.id) === 'view'}
                                onCheckedChange={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      [module.id]: ['view']
                                    }
                                  }));
                                }}
                              />
                              <Label 
                                htmlFor={`${module.id}-view`}
                                className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Only
                              </Label>
                            </div>
                            
                            <div className="flex items-center">
                              <Checkbox 
                                id={`${module.id}-edit`}
                                checked={getModulePermission(module.id) === 'edit'}
                                onCheckedChange={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      [module.id]: ['view', 'edit']
                                    }
                                  }));
                                }}
                              />
                              <Label 
                                htmlFor={`${module.id}-edit`}
                                className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Full Access
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between space-x-3 pt-4">
                    <Button 
                      type="button"
                      onClick={handlePrevStep}
                      variant="outline"
                      className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                    >
                      Back
                    </Button>
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetForm}
                  className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                >
                        {isEditing ? 'Update' : 'Save'} Role
                </Button>
              </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement; 