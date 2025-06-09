import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const { user } = useUser();
  const [selectedBranch, setSelectedBranch] = useState(() => {
    // Try to get the selected branch from localStorage
    const savedBranch = localStorage.getItem('selectedBranch');
    if (savedBranch) {
      return JSON.parse(savedBranch);
    }
    // If user is admin and has all branches access, default to "All Branches"
    if ((user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && user?.branchId === 'all') {
      return { branchName: "All Branches", branchId: "all" };
    }
    // Otherwise, use the user's assigned branch
    return { branchName: user?.branch || "No Branch", branchId: user?.branchId || null };
  });

  // Update selected branch when user changes
  useEffect(() => {
    if (user) {
      if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && user.branchId === 'all') {
        setSelectedBranch({ branchName: "All Branches", branchId: "all" });
      } else {
        setSelectedBranch({ branchName: user.branch || "No Branch", branchId: user.branchId || null });
      }
    }
  }, [user]);

  const updateSelectedBranch = (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedBranch', JSON.stringify(branch));
  };

  return (
    <BranchContext.Provider value={{ selectedBranch, updateSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
} 