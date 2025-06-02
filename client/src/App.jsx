import { Switch, Route } from "wouter";
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

// Create dark mode context
const DarkModeContext = createContext();

export function useDarkMode() {
  return useContext(DarkModeContext);
}

function DarkModeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage first
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Update local storage when dark mode changes
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update document class
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

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      
      <Route path="/dashboard">
        <AppLayout>
          <Dashboard />
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
      
      <Route path="/clients/:id">
        <AppLayout>
          <ClientProfile />
        </AppLayout>
      </Route>
      
      <Route path="/clients">
        <AppLayout>
          <Clients />
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


      <Route path="/visaApplicationTracker">
        <AppLayout>
          <VisaApplicationTracker />
        </AppLayout>
      </Route>
      
      
      

//Settings Routes
            <Route path="/settings">
        <AppLayout>
          {/* Optionally, add a settings home component here */}
          {/* <div className="p-8 text-xl font-semibold"></div> */}
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
      <Route path="/settings/branch">
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
      
      <Route path="/reminders">
        <AppLayout>
          <Reminder />
        </AppLayout>
      </Route>

      <Route path="/admin/mail-setting">
        <AppLayout>
          <EmailTemplates />
        </AppLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </DarkModeProvider>
  );
}

export default App;
