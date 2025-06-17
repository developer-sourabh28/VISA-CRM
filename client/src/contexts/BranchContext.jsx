import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const { user } = useUser();
  const [selectedBranch, setSelectedBranch] = useState(() => {
    // Try to get the selected branch from localStorage
    const savedBranch = localStorage.getItem('selectedBranch');
    console.log('Saved branch from localStorage:', savedBranch);
    
    if (savedBranch) {
      try {
        const parsedBranch = JSON.parse(savedBranch);
        console.log('Parsed branch data:', parsedBranch);
        return parsedBranch;
      } catch (e) {
        console.error('Error parsing saved branch:', e);
        localStorage.removeItem('selectedBranch');
      }
    }
    
    // If user is admin and has all branches access, default to "All Branches"
    if ((user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && user?.branchId === 'all') {
      console.log('User is admin with all branches access');
      return { 
        branchName: "All Branches", 
        branchId: "all", 
        branchLocation: "All Locations",
        countryCode: "+91" 
      };
    }
    
    // Otherwise, use the user's assigned branch
    console.log('Using user branch data:', user);
    return { 
      branchName: user?.branch || "No Branch", 
      branchId: user?.branchId || null,
      branchLocation: user?.branchLocation || null,
      countryCode: user?.countryCode || "+7"  // Changed default to +7 for Russia
    };
  });

  // Update selected branch when user changes
  useEffect(() => {
    console.log('User changed:', user);
    if (user) {
      if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && user.branchId === 'all') {
        console.log('Setting admin branch');
        setSelectedBranch({ 
          branchName: "All Branches", 
          branchId: "all",
          branchLocation: "All Locations",
          countryCode: "+91"
        });
      } else {
        console.log('Setting user branch:', user);
        setSelectedBranch({ 
          branchName: user.branch || "No Branch", 
          branchId: user.branchId || null,
          branchLocation: user.branchLocation || null,
          countryCode: user.countryCode || "+7"  // Changed default to +7 for Russia
        });
      }
    }
  }, [user]);

  const updateSelectedBranch = (branch) => {
    console.log('Updating selected branch:', branch);
    const branchData = {
      branchName: branch.branchName,
      branchId: branch.branchId,
      branchLocation: branch.branchLocation,
      countryCode: branch.countryCode || "+91"
    };
    console.log('Setting branch data:', branchData);
    setSelectedBranch(branchData);
    localStorage.setItem('selectedBranch', JSON.stringify(branchData));
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