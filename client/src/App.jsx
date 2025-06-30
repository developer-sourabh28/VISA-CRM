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
import { AuthProvider } from './context/AuthContext';

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

const AppRoutes = () => {
  return (
    <AppLayout>
      <Switch>
        {/* Redirect root to login */}
        <Route path="/">
          <Redirect to="/login" />
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/enquiries" component={Enquiries} />
        <Route path="/enquiries/:enquiryId" component={EnquiryProfile} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/new" component={NewClient} />
        <Route path="/clients/:id" component={ClientProfile} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/deadlines" component={DeadlineList} />
        <Route path="/reports" component={Reports} />
        <Route path="/reminders" component={Reminder} />
        <Route path="/settings" component={AdminSettings} />
        <Route path="/team-management" component={TeamManagement} />
        <Route path="/currency" component={Currency} />
        <Route path="/role-management" component={RoleManagement} />
        <Route path="/destination" component={Destination} />
        <Route path="/flight" component={Flight} />
        <Route path="/hotel" component={Hotel} />
        <Route path="/admin-setting" component={AdminSettings} />
        <Route path="/email-templates" component={EmailTemplates} />
        <Route path="/whatsapp-templates" component={WhatsAppTemplate} />
        <Route path="/invoice-templates" component={InvoiceTemplate} />
        {/* Fallback for not-found */}
        <Route path="/:rest*">
          <NotFound />
        </Route>
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <UserProvider>
      <DarkModeProvider>
        <QueryClientProvider client={queryClient}>
          <BranchProvider>
            <TooltipProvider>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </TooltipProvider>
          </BranchProvider>
        </QueryClientProvider>
      </DarkModeProvider>
    </UserProvider>
  );
}

export default App;
