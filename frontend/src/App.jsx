import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import Prescriptions from "@/pages/Prescriptions";
import Lab from "@/pages/Lab";
import Models from "@/pages/Models";
import Payments from "@/pages/Payments";
import Notifications from "@/pages/Notifications";
import Chatbot from "@/pages/Chatbot";
import ManageSchedule from "@/pages/ManageSchedule";
import Patients from "@/pages/Patients";
import Disease from "@/pages/Disease";
import Locations from "@/pages/Locations";
import Vaccinations from "@/pages/Vaccinations";
import BloodBank from "@/pages/BloodBank";
import Profile from "@/components/Profile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#0d6e7e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading MediCore...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, roles }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Redirect to="/" />;

  const normalizedRole = (user.role || "").toLowerCase().replace(/ /g, "_");
  if (roles && !roles.includes(normalizedRole)) return <Redirect to="/dashboard" />;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function GuestRoute({ component: Component }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-[#0d6e7e] border-t-transparent rounded-full animate-spin" />
    </div>
  );
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
      <Route path="/schedule" component={() => <ProtectedRoute component={ManageSchedule} roles={["doctor"]} />} />
      <Route path="/prescriptions" component={() => <ProtectedRoute component={Prescriptions} roles={["patient", "doctor", "admin"]} />} />
      <Route path="/lab" component={() => <ProtectedRoute component={Lab} roles={["patient", "doctor", "lab", "admin"]} />} />
      <Route path="/models" component={() => <ProtectedRoute component={Models} roles={["doctor"]} />} />
      <Route path="/payments" component={() => <ProtectedRoute component={Payments} roles={["patient", "admin", "superadmin"]} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/blood-bank" component={() => <ProtectedRoute component={BloodBank} roles={["doctor", "blood_bank", "admin"]} />} />
      <Route path="/chatbot" component={() => <ProtectedRoute component={Chatbot} roles={["patient"]} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} roles={["doctor", "admin", "superadmin"]} />} />
      <Route path="/disease" component={() => <ProtectedRoute component={Disease} roles={["admin", "superadmin"]} />} />
      <Route path="/locations" component={() => <ProtectedRoute component={Locations} roles={["superadmin"]} />} />
      <Route path="/vaccinations" component={() => <ProtectedRoute component={Vaccinations} roles={["patient", "doctor", "admin", "superadmin"]} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter>
          <Router />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
