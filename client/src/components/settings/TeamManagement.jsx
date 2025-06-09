import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2 } from 'lucide-react';
import { useBranch } from '../../contexts/BranchContext';

export default function TeamManagement() {
  const { selectedBranch } = useBranch();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // NEW: For user details modal
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]); // Add state for branches

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
    fetchBranches(); // Add branch fetching
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
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/team-members');
      const data = await response.json();
      // Filter team members based on selected branch
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
        body: JSON.stringify(memberData),
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

  // Add this handler:
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
  // This function can be used to handle form submission for editing
const handleUpdate = async (e) => {
  e.preventDefault();
  if (!editingId) return;

  try {
    const res = await fetch(`http://localhost:5000/api/team-members/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
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
};

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow relative">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold">Team Management</h2>
          <Button onClick={() => setShowForm(true)}>Add New Member</Button>
        </div>

        {/* Team Members List */}
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Team Members</h3>
          <table className="w-full border border-gray-300 min-w-[600px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Email</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Role</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Branch</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Active</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 && (
                <tr>
                  <td colSpan="6" className="border border-gray-300 text-center py-4 text-gray-500">
                    No team members found.
                  </td>
                </tr>
              )}
              {teamMembers.map((member, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => !showForm && setSelectedUser(member)} // Only open details if not editing
                >
                  <td className="border text-blue-600 border-gray-300 px-3 py-2">{member.fullName}</td>
                  <td className="border border-gray-300 px-3 py-2">{member.email}</td>
                  <td className="border border-gray-300 px-3 py-2">{member.role}</td>
                  <td className="border border-gray-300 px-3 py-2">{member.branch}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{member.isActive ? 'Yes' : 'No'}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(member._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs inline-flex items-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(member)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs ml-2 inline-flex items-center"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Team Member Form Modal */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowForm(false)}
          ></div>

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 overflow-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{isEditing ? 'Edit' : 'Add'} Team Member</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-600 hover:text-gray-900 font-bold text-3xl leading-none"
                  aria-label="Close modal"
                >
                  &times;
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
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSelectedUser(null)}
          ></div>

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-600 hover:text-gray-900 font-bold text-3xl leading-none"
                  aria-label="Close modal"
                >
                  &times;
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
            </div>
          </div>
        </>
      )}
    </>
  );
}
