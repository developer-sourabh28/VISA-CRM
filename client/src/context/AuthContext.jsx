import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.data);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Check if user has permission for a module
  const hasPermission = (module, action = 'view') => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check permissions from role
    if (user.rolePermissions && user.rolePermissions[module]) {
      return user.rolePermissions[module].includes(action);
    }
    
    // Fallback to legacy permission system
    if (user.permissions && user.permissions[module] === true) {
      // In old system, having any permission meant both view and edit
      return true;
    }
    
    return false;
  };

  // Check if user can see a dashboard component
  const canViewDashboardComponent = (componentId) => {
    if (!user) return false;
    
    // Admin can see all components
    if (user.role === 'admin') return true;
    
    // Check role permissions for dashboard components
    if (user.rolePermissions && 
        user.rolePermissions.dashboard && 
        user.rolePermissions.dashboard.components) {
      return user.rolePermissions.dashboard.components.includes(componentId);
    }
    
    // Fallback to legacy permission system - if user has dashboard permission, show all components
    if (user.permissions && user.permissions.dashboard === true) {
      return true;
    }
    
    return false;
  };

  const value = {
    user,
    setUser,
    loading,
    hasPermission,
    canViewDashboardComponent
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 