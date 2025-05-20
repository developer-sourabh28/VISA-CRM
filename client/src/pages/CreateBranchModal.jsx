import React, { useState } from 'react';

export default function CreateBranchModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    branchName: '',
    branchLocation: '',
    branchId: '',
    email: '',
    contactNo: '',
    head: {
      name: '',
      contactNo: '',
      email: '',
      gender: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('head.')) {
      const field = name.split('.')[1];
      setForm({ ...form, head: { ...form.head, [field]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Create New Branch</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Branch Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input name="branchName" onChange={handleChange} value={form.branchName} required placeholder="Branch Name" className="form-input" />
              <input name="branchLocation" onChange={handleChange} value={form.branchLocation} required placeholder="Location" className="form-input" />
              <input name="branchId" onChange={handleChange} value={form.branchId} required placeholder="Branch ID" className="form-input" />
              <input name="email" onChange={handleChange} value={form.email} required type="email" placeholder="Branch Email" className="form-input" />
              <input name="contactNo" onChange={handleChange} value={form.contactNo} required placeholder="Contact No." className="form-input" />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-gray-700 mb-4 border-t pt-4">Branch Head</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input name="head.name" onChange={handleChange} value={form.head.name} required placeholder="Head Name" className="form-input" />
              <input name="head.contactNo" onChange={handleChange} value={form.head.contactNo} required placeholder="Head Contact No." className="form-input" />
              <input name="head.email" onChange={handleChange} value={form.head.email} required type="email" placeholder="Head Email" className="form-input" />
              <select name="head.gender" onChange={handleChange} value={form.head.gender} required className="form-input">
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="text-sm text-gray-600 px-4 py-2 rounded-md hover:underline">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-md">Create Branch</button>
          </div>
        </form>
      </div>
    </div>
  );
}
