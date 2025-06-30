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
import BackButton from '@/components/BackButton';

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
    branch: '',
    username: '',
    password: '',
    isActive: true,
    hasAllBranchesAccess: false,
    permissions: {
      dashboard: false,
      enquiries: false,
      clients: false,
      agreements: false,
      appointments: false,
      deadlines: false,
      payments: false,
      reports: false,
      settings: false,
      reminder: false,
    },
    notes: ''
  });

  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchTeamMembers();
    fetchRoles();
    fetchBranches();
  }, [selectedBranch?.branchId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/branches');
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
      const response = await fetch('http://localhost:5000/api/team-members');
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
    if (name in formData.permissions) {
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          [name]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const memberData = {
        ...formData,
        branchId: formData.hasAllBranchesAccess ? 'all' : (selectedBranch?.branchId === 'all' ? null : selectedBranch?.branchId)
      };
      
      const res = await fetch('http://localhost:5000/api/team-members', {
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
        branch: '',
        username: '',
        password: '',
        isActive: true,
        hasAllBranchesAccess: false,
        permissions: {
          dashboard: false,
          enquiries: false,
          clients: false,
          agreements: false,
          appointments: false,
          deadlines: false,
          payments: false,
          reports: false,
          settings: false,
          reminder: false,
        },
        notes: ''
      });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Error saving member');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team member?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/team-members/${id}`, { method: "DELETE" });
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
    setFormData({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      branch: member.branch || '',
      username: member.username || '',
      password: '', // Don't pre-fill password
      isActive: member.isActive,
      hasAllBranchesAccess: member.branchId === 'all',
      permissions: { ...member.permissions },
      notes: member.notes || ''
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
      const res = await fetch(`http://localhost:5000/api/team-members/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
    setSelectedUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: '',
      branch: '',
      username: '',
      password: '',
      isActive: true,
      hasAllBranchesAccess: false,
      permissions: {
        dashboard: false,
        enquiries: false,
        clients: false,
        agreements: false,
        appointments: false,
        deadlines: false,
        payments: false,
        reports: false,
        settings: false,
        reminder: false,
      },
      notes: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        <BackButton />
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
            className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
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
                      <td colSpan="6" className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                      <td className="text-gray-900 dark:text-white py-3 px-4">{member.email}</td>
                      <td className="text-gray-900 dark:text-white py-3 px-4">{member.role}</td>
                      <td className="text-gray-900 dark:text-white py-3 px-4">{member.branch}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.isActive
                              ? "bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                              : "bg-red-100/40 dark:bg-red-900/30 text-red-800 dark:text-red-400"
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
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    >
                      <option value="">Select a role</option>
                      {roles.map(role => (
                        <option key={role._id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
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

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mt-6 mb-2">Permissions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.keys(formData.permissions).map((permKey) => (
                        <label key={permKey} className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            name={permKey}
                            checked={formData.permissions[permKey]}
                            onChange={handleChange}
                            className="w-5 h-5"
                          />
                          <span className="capitalize">{permKey}</span>
                        </label>
                      ))}
                    </div>
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
                    <Button type="submit">{isEditing ? "Update Member" : "Add Member"}</Button>
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
                    <strong>Permissions:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {Object.entries(selectedUser.permissions || {}).map(([key, val]) => (
                        <li key={key} className={val ? 'text-green-600' : 'text-gray-400'}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}: {val ? 'Granted' : 'Denied'}
                        </li>
                      ))}
                    </ul>
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
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleEdit(selectedUser);
                      setSelectedUser(null);
                    }}
                    className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
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