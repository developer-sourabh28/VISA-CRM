import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Pencil, 
  Trash2, 
  Users, 
  Plus, 
  X, 
  UserPlus, 
  Shield, 
  Search,
  Filter 
} from 'lucide-react';
import { useBranch } from '../../contexts/BranchContext';

export default function TeamManagement() {
  const { selectedBranch } = useBranch();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    roleId: '',
    branch: '',
    username: '',
    password: '',
    isActive: true,
    hasAllBranchesAccess: false,
    notes: '',
    customPermissions: {
      dashboard: false,
      modules: {
        enquiries: {
          view: false,
          edit: false
        },
        clients: {
          view: false,
          edit: false
        },
        appointments: {
          view: false,
          edit: false
        },
        deadlines: {
          view: false,
          edit: false
        },
        payments: {
          view: false,
          edit: false
        },
        reports: {
          view: false,
          edit: false
        },
        settings: {
          view: false,
          edit: false
        },
        reminders: {
          view: false,
          edit: false
        }
      }
    },
    useCustomPermissions: false
  });

  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchTeamMembers();
    fetchRoles();
    fetchBranches();
  }, [selectedBranch?.branchId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setBranches(data.data);
      } else {
        console.error('Invalid branches data format:', data);
        setBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team-members');
      const data = await response.json();
      const filteredData = selectedBranch?.branchId === 'all' 
        ? data 
        : data.filter(member => member.branchId === selectedBranch?.branchId);
      setTeamMembers(filteredData);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle form field changes
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleRoleChange = (roleId) => {
    const selectedRole = roles.find(role => role._id === roleId);
    
    if (selectedRole) {
      setFormData(prev => ({
        ...prev,
        role: selectedRole.name,
        roleId: selectedRole._id,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get selected role details
      const selectedRole = roles.find(role => role._id === formData.roleId);
      
      const memberData = {
        ...formData,
        // The role property should be the role name for display purposes
        role: selectedRole?.name || formData.role,
        // The roleId property links to the actual role object
        roleId: formData.roleId,
        branchId: formData.hasAllBranchesAccess ? 'all' : (selectedBranch?.branchId === 'all' ? null : selectedBranch?.branchId)
      };
      
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save');
      }
      
      const saved = await res.json();
      setTeamMembers(prev => [...prev, saved]);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: '',
        roleId: '',
        branch: '',
        username: '',
        password: '',
        isActive: true,
        hasAllBranchesAccess: false,
        notes: '',
        customPermissions: {
          dashboard: false,
          modules: {
            enquiries: {
              view: false,
              edit: false
            },
            clients: {
              view: false,
              edit: false
            },
            appointments: {
              view: false,
              edit: false
            },
            deadlines: {
              view: false,
              edit: false
            },
            payments: {
              view: false,
              edit: false
            },
            reports: {
              view: false,
              edit: false
            },
            settings: {
              view: false,
              edit: false
            },
            reminders: {
              view: false,
              edit: false
            }
          }
        },
        useCustomPermissions: false
      });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Error saving member');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team member?")) return;
    try {
      const res = await fetch(`/api/team-members/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTeamMembers(prev => prev.filter(member => member._id !== id));
        if (selectedUser && selectedUser._id === id) setSelectedUser(null);
      } else {
        alert("Failed to delete member");
      }
    } catch {
      alert("Failed to delete member");
    }
  };

  const handleEdit = (member) => {
    // Define default module permissions structure
    const defaultModulePermissions = {
      enquiries: { view: false, edit: false },
      clients: { view: false, edit: false },
      appointments: { view: false, edit: false },
      deadlines: { view: false, edit: false },
      payments: { view: false, edit: false },
      reports: { view: false, edit: false },
      settings: { view: false, edit: false },
      reminders: { view: false, edit: false }
    };

    // Ensure member.customPermissions.modules has proper structure
    const customPermissions = member.customPermissions || {};
    const modulePermissions = customPermissions.modules || defaultModulePermissions;
    
    // Ensure each module has view and edit properties
    Object.keys(defaultModulePermissions).forEach(module => {
      modulePermissions[module] = modulePermissions[module] || { view: false, edit: false };
      modulePermissions[module].view = !!modulePermissions[module].view;
      modulePermissions[module].edit = !!modulePermissions[module].edit;
    });

    setFormData({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      roleId: member.roleId || '',
      branch: member.branch || '',
      username: member.username || '',
      password: '',
      isActive: member.isActive,
      hasAllBranchesAccess: member.branchId === 'all',
      notes: member.notes || '',
      // Load existing custom permissions if available
      customPermissions: {
        dashboard: customPermissions.dashboard || false,
        modules: modulePermissions
      },
      useCustomPermissions: member.useCustomPermissions || false
    });
    setShowForm(true);
    setSelectedUser(null);
    setIsEditing(true);
    setEditingId(member._id);
  };

  const handleCloseDetails = () => {
    setSelectedUser(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      // Get selected role details
      const selectedRole = roles.find(role => role._id === formData.roleId);
      
      // Create updated member data with correct role information
      const updatedMemberData = {
        ...formData,
        role: selectedRole?.name || formData.role,
        roleId: formData.roleId
      };
      
      const res = await fetch(`/api/team-members/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMemberData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update member');
      }
      
      const updatedMember = await res.json();
      setTeamMembers(prev => prev.map(member => member._id === updatedMember._id ? updatedMember : member));
      setShowForm(false);
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      alert(err.message || 'Error updating member');
    }
  };

  const handleCustomPermissionChange = (permKey) => {
    setFormData(prev => ({
      ...prev,
      customPermissions: {
        ...prev.customPermissions,
        [permKey]: !prev.customPermissions[permKey]
      }
    }));
  };

  const handleModulePermissionChange = (module, permission) => {
    setFormData(prev => {
      // Clone the current permissions structure
      const updatedPermissions = {
        ...prev.customPermissions,
        modules: {
          ...prev.customPermissions.modules
        }
      };

      // Update the specific module permission
      updatedPermissions.modules[module] = {
        ...updatedPermissions.modules[module],
        [permission]: !updatedPermissions.modules[module][permission]
      };

      // If edit permission is enabled, automatically enable view permission
      if (permission === 'edit' && updatedPermissions.modules[module].edit) {
        updatedPermissions.modules[module].view = true;
      }

      return {
        ...prev,
        customPermissions: updatedPermissions
      };
    });
  };

  const handleCloseForm = () => {
    // Define default module permissions structure
    const defaultModulePermissions = {
      enquiries: { view: false, edit: false },
      clients: { view: false, edit: false },
      appointments: { view: false, edit: false },
      deadlines: { view: false, edit: false },
      payments: { view: false, edit: false },
      reports: { view: false, edit: false },
      settings: { view: false, edit: false },
      reminders: { view: false, edit: false }
    };

    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
    setSelectedUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: '',
      roleId: '',
      branch: '',
      username: '',
      password: '',
      isActive: true,
      hasAllBranchesAccess: false,
      notes: '',
      // Reset custom permissions
      customPermissions: {
        dashboard: false,
        modules: defaultModulePermissions
      },
      useCustomPermissions: false
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
                Team Management
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-5">
              {selectedBranch?.branchId && selectedBranch.branchId !== 'all' ? 
                `Managing team for ${selectedBranch.branchName}` : 
                'Managing all team members'}
            </p>
          </div>

          <Button 
            onClick={() => setShowForm(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <UserPlus className="w-5 h-5" />
            <span>Add New Member</span>
          </Button>
        </div>

        {/* Team Members List */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Branch</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No team members found.
                      </td>
                    </tr>
                  )}
                  {teamMembers.map((member, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                      onClick={() => !showForm && setSelectedUser(member)}
                    >
                      <td className="text-gray-900 dark:text-white py-3 px-4">{member.fullName}</td>
                      <td className="text-gray-900 dark:text-white py-3 px-4">{member.employeeId || 'N/A'}</td>
                      <td className="text-gray-900 dark:text-white py-3 px-4">{member.email}</td>
                      <td className="text-gray-900 dark:text-white py-3 px-4">{member.role}</td>
                      <td className="text-gray-900 dark:text-white py-3 px-4">{member.branch}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-1 rounded-full text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member._id)}
                            className="p-1 rounded-full text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100/30 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Team Member Form Modal */}
        {showForm && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={handleCloseForm}
            ></div>

            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-2xl w-full max-w-3xl p-6 overflow-auto max-h-[90vh]">
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'Add'} Team Member</h2>
                  </div>
                  <button
                    onClick={handleCloseForm}
                    className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                  </div>

                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Switch
                          id="hasAllBranchesAccess"
                          checked={formData.hasAllBranchesAccess}
                          onCheckedChange={(val) => {
                            setFormData(prev => ({
                              ...prev,
                              hasAllBranchesAccess: val,
                              branch: val ? 'All Branches' : ''
                            }));
                          }}
                        />
                        <Label htmlFor="hasAllBranchesAccess">Access to All Branches</Label>
                      </div>
                      {!formData.hasAllBranchesAccess && (
                        <select
                          id="branch"
                          name="branch"
                          value={formData.branch}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          required
                        >
                          <option value="">Select a branch</option>
                          {branches.map(branch => (
                            <option key={branch._id} value={branch.branchName}>
                              {branch.branchName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      name="roleId"
                      value={formData.roleId}
                      onChange={(e) => {
                        handleRoleChange(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      required
                    >
                      <option value="">Select a role</option>
                      {roles.map(role => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      The role determines the user's permissions in the system.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" value={formData.username} onChange={handleChange} />
                  </div>

                  <div>
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} />
                  </div>

                  <div className="flex items-center mt-6">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                    />
                    <Label htmlFor="isActive" className="ml-2">Active</Label>
                  </div>

                  {/* Role-based permissions section with custom override option */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mt-6 mb-2 flex items-center">
                      <Shield className="mr-2 h-5 w-5 text-amber-500" />
                      Permissions
                    </h3>
                    
                    {formData.roleId ? (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-gray-800/80 dark:to-gray-800/60 p-4 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                          <p className="mb-2 font-medium">
                            This user inherits permissions from the <span className="text-amber-600 dark:text-amber-400">{
                              roles.find(r => r._id === formData.roleId)?.name || 'selected'
                            }</span> role.
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            To modify the role's permissions, please update it in Role Management.
                          </p>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="useCustomPermissions"
                              checked={formData.useCustomPermissions}
                              onCheckedChange={(checked) => {
                                setFormData(prev => ({
                                  ...prev,
                                  useCustomPermissions: checked
                                }));
                              }}
                              className="bg-amber-200/50 data-[state=checked]:bg-amber-500 dark:bg-amber-900/30 dark:data-[state=checked]:bg-amber-500"
                            />
                            <Label htmlFor="useCustomPermissions" className="font-medium text-amber-600 dark:text-amber-400">
                              Override role permissions with custom settings
                            </Label>
                          </div>
                        </div>
                        
                        {formData.useCustomPermissions && (
                          <div className="bg-gradient-to-br from-amber-50/90 to-yellow-50/90 dark:from-gray-800/90 dark:to-gray-800/80 p-4 rounded-lg border border-amber-200 dark:border-amber-800/30 shadow-sm">
                            <p className="mb-3 text-amber-700 dark:text-amber-400 font-medium flex items-center">
                              <Shield className="w-4 h-4 mr-2" />
                              Custom Permission Settings
                            </p>

                            <div className="space-y-6">
                              {/* Dashboard permission */}
                              <div className="border-b border-amber-100 dark:border-amber-900/30 pb-4">
                                <h4 className="text-sm font-medium mb-2 text-amber-600 dark:text-amber-400">Dashboard</h4>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="dashboard-access"
                                    checked={formData.customPermissions.dashboard}
                                    onCheckedChange={() => handleCustomPermissionChange('dashboard')}
                                    className="bg-amber-200/50 data-[state=checked]:bg-amber-500 dark:bg-amber-900/30 dark:data-[state=checked]:bg-amber-500"
                                  />
                                  <Label htmlFor="dashboard-access" className="text-gray-700 dark:text-gray-300">
                                    Dashboard Access
                                  </Label>
                                </div>
                              </div>

                              {/* Module permissions */}
                              <div>
                                <h4 className="text-sm font-medium mb-3 text-amber-600 dark:text-amber-400">Module Permissions</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.keys(formData.customPermissions.modules).map((module) => (
                                    <div key={module} className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-md border border-amber-100 dark:border-gray-700">
                                      <div className="font-medium mb-2 capitalize text-gray-800 dark:text-gray-200">
                                        {module}
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <label className="flex items-center space-x-2 cursor-pointer select-none">
                                            <Switch
                                              id={`module-${module}-view`}
                                              checked={formData.customPermissions.modules[module].view}
                                              onCheckedChange={() => handleModulePermissionChange(module, 'view')}
                                              className="h-4 w-8 bg-amber-200/50 data-[state=checked]:bg-amber-500 dark:bg-amber-900/30 dark:data-[state=checked]:bg-amber-500"
                                            />
                                            <span className="text-sm text-gray-800 dark:text-gray-300">View</span>
                                          </label>
                                          <label className="flex items-center space-x-2 cursor-pointer select-none">
                                            <Switch
                                              id={`module-${module}-edit`}
                                              checked={formData.customPermissions.modules[module].edit}
                                              onCheckedChange={() => handleModulePermissionChange(module, 'edit')}
                                              className="h-4 w-8 bg-amber-200/50 data-[state=checked]:bg-amber-500 dark:bg-amber-900/30 dark:data-[state=checked]:bg-amber-500"
                                            />
                                            <span className="text-sm text-gray-800 dark:text-gray-300">Edit</span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/30">
                        <p className="text-amber-700 dark:text-amber-400">
                          Please select a role to define user permissions.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2 text-right">
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                    >
                      {isEditing ? "Update Member" : "Add Member"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedUser(null)}
            ></div>

            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold">
                      {selectedUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Details</h2>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div><strong>Full Name:</strong> {selectedUser.fullName}</div>
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Phone:</strong> {selectedUser.phone || '-'}</div>
                  <div><strong>Role:</strong> {selectedUser.role}</div>
                  <div><strong>Branch:</strong> {selectedUser.branch || '-'}</div>
                  <div><strong>Username:</strong> {selectedUser.username || '-'}</div>
                  <div><strong>Active:</strong> {selectedUser.isActive ? 'Yes' : 'No'}</div>

                  <div>
                    <strong>Role-based Permissions:</strong>
                    <div className="mt-2 p-3 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-gray-800/80 dark:to-gray-800/60 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                      <div className="flex items-center mb-2">
                        <Shield className="w-4 h-4 mr-2 text-amber-500" />
                        <span className="font-medium text-amber-600 dark:text-amber-400">{selectedUser.role} Role</span>
                      </div>
                      
                      {selectedUser.useCustomPermissions ? (
                        <div>
                          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                            This user has custom permission overrides.
                          </p>
                          
                          {/* Dashboard permission */}
                          <div className="mt-3 mb-3">
                            <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Dashboard</h4>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                selectedUser.customPermissions?.dashboard 
                                  ? 'bg-amber-500' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}></div>
                              <span className={`text-sm ${
                                selectedUser.customPermissions?.dashboard 
                                  ? 'text-gray-900 dark:text-gray-100' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                Dashboard Access
                              </span>
                            </div>
                          </div>
                          
                          {/* Module permissions */}
                          <div className="border-t border-amber-100 dark:border-amber-900/30 pt-2">
                            <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">Module Permissions</h4>
                            <div className="grid grid-cols-1 gap-y-3">
                              {selectedUser.customPermissions?.modules && Object.entries(selectedUser.customPermissions.modules).map(([moduleName, permissions]) => (
                                <div key={moduleName} className="flex justify-between items-center">
                                  <span className="capitalize text-sm text-gray-800 dark:text-gray-200">{moduleName}</span>
                                  <div className="flex space-x-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      permissions.view 
                                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                      View
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      permissions.edit 
                                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                      Edit
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          This user inherits permissions from their assigned role. 
                          To modify permissions, please update the role in Role Management.
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedUser.notes && (
                    <div>
                      <strong>Notes:</strong>
                      <p className="whitespace-pre-wrap border p-2 rounded bg-gray-50">{selectedUser.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    onClick={() => setSelectedUser(null)}
                    className="bg-transparent border border-amber-200/50 dark:border-amber-700/30 text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleEdit(selectedUser);
                      setSelectedUser(null);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                  >
                    Edit User
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}