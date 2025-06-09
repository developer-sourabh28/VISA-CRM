import { Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { createContext, useContext, useEffect, useState } from "react";
import NotFound from "./pages/not-found";
import Dashboard from "./components/Dashboard";
import Login from "./pages/Login";
import Clients from "./pages/Clients";
import Agreements from "./pages/Agreements";
import Appointments from "./pages/Appointments";
import Documents from "./pages/Documents";
import Enquiries from "./pages/Enquiries";
import AppLayout from "./components/AppLayout";
import NewClient from "./pages/NewClient";
import ClientProfile from "./pages/ClientProfile"; 
import VisaApplicationTracker from "./components/VisaApplicationTracker";
import DeadlineList from "./components/DeadlineList";
import DeadlineHistory from "./components/DeadlineHistory";
import FinancialDashboard from "./pages/FinancialDashboard";
import Sidebar from "./components/Sidebar";
import TeamManagement from "./components/settings/TeamManagement";
import AdminSettings from "./components/settings/admin-setting/AdminSetting";
import Destination from "./components/settings/admin-setting/Destination";
import Branch from "./components/settings/Branch";
import Currency from "./components/settings/admin-setting/Currency";
import Hotel from "./components/settings/admin-setting/Hotel";
import Flight from "./components/settings/admin-setting/Flight";
import Reminder from "./components/Reminder";   
import EmailTemplates from "./components/settings/EmailTemplates";
import RoleManagement from "./components/settings/admin-setting/RoleManagement";
import { UserProvider } from './context/UserContext';
import Reports from "./pages/Reports";
import Payments from "./pages/Payments";
// Create dark mode context
const DarkModeContext = createContext();

export function useDarkMode() {
  return useContext(DarkModeContext);
}

function DarkModeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

function App() {
  return (
    <UserProvider>
      <DarkModeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Routes>
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              <Route path="/login" element={<Login />} />
              
              <Route path="/dashboard" element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              } />

              <Route path="/admin/role-setting" element={
                <AppLayout>
                  <RoleManagement />
                </AppLayout>
              } />
              
              <Route path="/history" element={
                <AppLayout>
                  <DeadlineHistory />
                </AppLayout>
              } />

              <Route path="/clients/new" element={
                <AppLayout>
                  <NewClient />
                </AppLayout>
              } />
              
              <Route path="/clients" element={
                <AppLayout>
                  <Clients />
                </AppLayout>
              } />

              <Route path="/clients/:id" element={
                <AppLayout>
                  <ClientProfile />
                </AppLayout>
              } />

              <Route path="/financialDashboard" element={
                <AppLayout>
                  <FinancialDashboard />
                </AppLayout>
              } />
              
              <Route path="/agreements" element={
                <AppLayout>
                  <Agreements />
                </AppLayout>
              } />
              
              <Route path="/appointments" element={
                <AppLayout>
                  <Appointments />
                </AppLayout>
              } />

              <Route path="/payments" element={
                <AppLayout>
                  <Payments />
                </AppLayout>
              } />

              <Route path="/reports" element={
                <AppLayout>
                  <Reports />
                </AppLayout>
              } />

              <Route path="/deadlines" element={
                <AppLayout>
                  <DeadlineList />
                </AppLayout>
              } />
              
              <Route path="/documents" element={
                <AppLayout>
                  <Documents />
                </AppLayout>
              } />
              
              <Route path="/enquiries" element={
                <AppLayout>
                  <Enquiries />
                </AppLayout>
              } />

              <Route path="/visaApplicationTracker" element={
                <AppLayout>
                  <VisaApplicationTracker />
                </AppLayout>
              } />

              {/* Settings Routes */}
              <Route path="/settings" element={
                <AppLayout>
                  <AdminSettings />
                </AppLayout>
              } />

              <Route path="/settings/team-management" element={
                <AppLayout>
                  <TeamManagement />
                </AppLayout>
              } />

              <Route path="/settings/admin" element={
                <AppLayout>
                  <AdminSettings />
                </AppLayout>
              } />

              <Route path="/admin/destination" element={
                <AppLayout>
                  <Destination />
                </AppLayout>
              } />

              <Route path="/admin/branch" element={
                <AppLayout>
                  <Branch />
                </AppLayout>
              } />

              <Route path="/admin/currency" element={
                <AppLayout>
                  <Currency />
                </AppLayout>
              } />

              <Route path="/admin/hotel" element={
                <AppLayout>
                  <Hotel />
                </AppLayout>
              } />

              <Route path="/admin/flight" element={
                <AppLayout>
                  <Flight />
                </AppLayout>
              } />

              <Route path="/admin/email-templates" element={
                <AppLayout>
                  <EmailTemplates />
                </AppLayout>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </QueryClientProvider>
      </DarkModeProvider>
    </UserProvider>
  );
}

export default App;
