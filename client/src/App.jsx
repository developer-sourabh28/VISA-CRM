import { Route, Switch, Redirect } from 'wouter';
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
import EnquiryProfile from "./components/EnquiryProfile";
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
import { BranchProvider } from './contexts/BranchContext';
import WhatsAppTemplate from './components/settings/WhatsAppTemplates'
import InvoiceTemplate from './components/settings/InvoiceTemplates';

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
          <BranchProvider>
            <TooltipProvider>
              <Toaster />
              <Switch>
                {/* Redirect root to login */}
                <Route path="/"> <Redirect to="/login" /> </Route>
                
                <Route path="/login"> <Login /> </Route>
                
                <Route path="/dashboard">
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </Route>

                <Route path="/admin/role-setting">
                  <AppLayout>
                    <RoleManagement />
                  </AppLayout>
                </Route>
                
                <Route path="/history">
                  <AppLayout>
                    <DeadlineHistory />
                  </AppLayout>
                </Route>

                <Route path="/clients/new">
                  <AppLayout>
                    <NewClient />
                  </AppLayout>
                </Route>
                
                <Route path="/clients">
                  <AppLayout>
                    <Clients />
                  </AppLayout>
                </Route>

                <Route path="/clients/:id">
                  <AppLayout>
                    <ClientProfile />
                  </AppLayout>
                </Route>

                <Route path="/financialDashboard">
                  <AppLayout>
                    <FinancialDashboard />
                  </AppLayout>
                </Route>
                
                <Route path="/agreements">
                  <AppLayout>
                    <Agreements />
                  </AppLayout>
                </Route>
                
                <Route path="/appointments">
                  <AppLayout>
                    <Appointments />
                  </AppLayout>
                </Route>

                {/* Payments routes */}
                <Route path="/payments">
                  <AppLayout>
                    <Payments />
                  </AppLayout>
                </Route>

                <Route path="/payments/:clientId">
                  <AppLayout>
                    <Payments />
                  </AppLayout>
                </Route>

                <Route path="/reports">
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </Route>

                <Route path="/deadlines">
                  <AppLayout>
                    <DeadlineList />
                  </AppLayout>
                </Route>
                
                <Route path="/documents">
                  <AppLayout>
                    <Documents />
                  </AppLayout>
                </Route>
                
                <Route path="/enquiries">
                  <AppLayout>
                    <Enquiries />
                  </AppLayout>
                </Route>

                {/* New Route for EnquiryProfile */}
                <Route path="/enquiries/:enquiryId">
                  <AppLayout>
                    <EnquiryProfile />
                  </AppLayout>
                </Route>

                <Route path="/visaApplicationTracker">
                  <AppLayout>
                    <VisaApplicationTracker />
                  </AppLayout>
                </Route>

                {/* Settings Routes */}
                <Route path="/settings">
                  <AppLayout>
                    <AdminSettings />
                  </AppLayout>
                </Route>

                <Route path="/settings/team-management">
                  <AppLayout>
                    <TeamManagement />
                  </AppLayout>
                </Route>

                <Route path="/settings/admin">
                  <AppLayout>
                    <AdminSettings />
                  </AppLayout>
                </Route>

                <Route path="/admin/destination">
                  <AppLayout>
                    <Destination />
                  </AppLayout>
                </Route>

                <Route path="/admin/branch">
                  <AppLayout>
                    <Branch />
                  </AppLayout>
                </Route>

                <Route path="/admin/currency">
                  <AppLayout>
                    <Currency />
                  </AppLayout>
                </Route>

                <Route path="/admin/hotel">
                  <AppLayout>
                    <Hotel />
                  </AppLayout>
                </Route>

                <Route path="/admin/flight">
                  <AppLayout>
                    <Flight />
                  </AppLayout>
                </Route>

                <Route path="/admin/email-templates">
                  <AppLayout>
                    <EmailTemplates />
                  </AppLayout>
                </Route>

                <Route path="/admin/whatsapp-template">
                  <AppLayout>
                    <WhatsAppTemplate/>
                  </AppLayout>
                </Route>

                <Route path="/admin/invoice-templates">
                  <AppLayout>
                    <InvoiceTemplate/>
                  </AppLayout>
                </Route>

                <Route path="/reminders">
                  <AppLayout>
                    <Reminder />
                  </AppLayout>
                </Route>

                <Route path="/"> <NotFound /> </Route>
              </Switch>
            </TooltipProvider>
          </BranchProvider>
        </QueryClientProvider>
      </DarkModeProvider>
    </UserProvider>
  );
}

export default App;
