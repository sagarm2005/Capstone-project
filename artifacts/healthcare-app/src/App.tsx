import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import Prescriptions from "@/pages/Prescriptions";
import Lab from "@/pages/Lab";
import Payments from "@/pages/Payments";
import Notifications from "@/pages/Notifications";
import Chatbot from "@/pages/Chatbot";
import Patients from "@/pages/Patients";
import Disease from "@/pages/Disease";
import Locations from "@/pages/Locations";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0d6e7e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading MediCore...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Redirect to="/" />;
  if (roles && !roles.includes(user.role)) return <Redirect to="/dashboard" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function GuestRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#0d6e7e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <GuestRoute component={Login} />} />
      <Route path="/signup" component={() => <GuestRoute component={Signup} />} />

      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} roles={["patient", "doctor", "admin", "superadmin"]} />} />
      <Route path="/prescriptions" component={() => <ProtectedRoute component={Prescriptions} roles={["patient", "doctor", "admin"]} />} />
      <Route path="/lab" component={() => <ProtectedRoute component={Lab} roles={["patient", "doctor", "lab", "admin"]} />} />
      <Route path="/payments" component={() => <ProtectedRoute component={Payments} roles={["patient", "admin", "superadmin"]} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/chatbot" component={() => <ProtectedRoute component={Chatbot} roles={["patient"]} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} roles={["doctor", "admin", "superadmin"]} />} />
      <Route path="/disease" component={() => <ProtectedRoute component={Disease} roles={["admin", "superadmin"]} />} />
      <Route path="/locations" component={() => <ProtectedRoute component={Locations} roles={["superadmin"]} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
