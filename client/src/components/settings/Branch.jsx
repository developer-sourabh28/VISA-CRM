import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Plus, Pencil, Trash2, Map, Mail, Phone, User, RefreshCw } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Badge } from "../ui/badge";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    branchName: '',
    branchLocation: '',
    branchId: '',
    email: '',
    contactNo: '',
    countryCode: '+91',
    head: {
      name: '',
      contactNo: '',
      email: '',
      gender: 'Male',
    }
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        } else if (Array.isArray(data.branches)) {
          setBranches(data.branches);
        } else {
          console.error('Invalid branches data:', data);
          setBranches([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch branches:', err);
        setBranches([]);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('head.')) {
      const headKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        head: {
          ...prev.head,
          [headKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Branch?")) return;
    console.log("Deleting branch with id:", id);
    try {
      await axios.delete(`/api/branches/${id}`);
      setBranches((prev) => prev.filter((branch) => branch._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete Branch");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to add branch');
      const saved = await res.json();
      setBranches(prev => [...prev, saved]);
      setFormData({
        branchName: '',
        branchLocation: '',
        branchId: '',
        email: '',
        contactNo: '',
        countryCode: '+91',
        head: {
          name: '',
          contactNo: '',
          email: '',
          gender: 'Male',
        }
      });
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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
                Branch Management
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={() => window.location.reload()}
              className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            
            <Button
              onClick={() => setShowForm(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Plus className="w-5 h-5" />
              <span>Add Branch</span>
            </Button>
          </div>
        </div>

        {/* Branches Card */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Building className="w-5 h-5 mr-2 text-amber-500" />
                All Branches
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map(branch => (
                <div
                  key={branch._id}
                  className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-5 hover:shadow-md transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {branch.branchName}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <Map className="w-4 h-4 mr-1 text-amber-500" />
                        {branch.branchLocation}
                      </div>
                    </div>
                    <Badge className="bg-amber-100/40 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      {branch.branchId}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      {branch.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      {branch.countryCode} {branch.contactNo}
                    </div>
                  </div>

                  {branch.head && (
                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-3 mt-3">
                      <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <User className="w-4 h-4 mr-2 text-amber-500" />
                        Branch Head
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {branch.head.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {branch.head.email}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-4 space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20"
                      onClick={() => {
                        setFormData({
                          ...branch,
                          head: branch.head || {
                            name: '',
                            contactNo: '',
                            email: '',
                            gender: 'Male',
                          }
                        });
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-red-100/30 dark:hover:bg-red-900/20 text-red-500"
                      onClick={() => handleDelete(branch._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Branch Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-2xl sm:max-w-lg">
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
          
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {formData._id ? 'Edit Branch' : 'Add New Branch'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {formData._id ? 'Update branch information' : 'Create a new branch in your organization'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4 max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="branchName">Branch Name</Label>
              <Input
                id="branchName"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                required
                placeholder="Branch Name"
                className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="branchLocation">Location</Label>
              <Input
                id="branchLocation"
                name="branchLocation"
                value={formData.branchLocation}
                onChange={handleChange}
                required
                placeholder="Location"
                className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="branchId">Branch ID</Label>
              <Input
                id="branchId"
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                required
                placeholder="Branch ID"
                className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Branch Email</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Branch Email"
                className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="w-1/3 space-y-2">
                <Label htmlFor="countryCode">Country Code</Label>
                <Input
                  id="countryCode"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  required
                  placeholder="Country Code"
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
              <div className="w-2/3 space-y-2">
                <Label htmlFor="contactNo">Contact Number</Label>
                <Input
                  id="contactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  required
                  placeholder="Contact Number"
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
            </div>

            <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Head Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="head.name">Head Name</Label>
                <Input
                  id="head.name"
                  name="head.name"
                  value={formData.head.name}
                  onChange={handleChange}
                  required
                  placeholder="Head Name"
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="head.email">Head Email</Label>
                <Input
                  id="head.email"
                  name="head.email"
                  value={formData.head.email}
                  onChange={handleChange}
                  required
                  placeholder="Head Email"
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="head.contactNo">Head Contact</Label>
                <Input
                  id="head.contactNo"
                  name="head.contactNo"
                  value={formData.head.contactNo}
                  onChange={handleChange}
                  required
                  placeholder="Head Contact"
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="head.gender">Gender</Label>
                <Select
                  value={formData.head.gender}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    head: {
                      ...prev.head,
                      gender: value
                    }
                  }))}
                >
                  <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    branchName: '',
                    branchLocation: '',
                    branchId: '',
                    email: '',
                    contactNo: '',
                    countryCode: '+91',
                    head: {
                      name: '',
                      contactNo: '',
                      email: '',
                      gender: 'Male',
                    }
                  });
                }}
                className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : formData._id ? 'Update Branch' : 'Add Branch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
