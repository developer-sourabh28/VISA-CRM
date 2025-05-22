import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/Dashboard";
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
      
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
