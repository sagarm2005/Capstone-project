import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Calendar, FileText, FlaskConical, CreditCard,
  Bell, MessageCircle, Users, Activity, Map, LogOut, Menu, X, User, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/dashboard", roles: ["patient", "doctor", "lab", "admin", "superadmin"] },
  { icon: <Calendar size={18} />, label: "Appointments", href: "/appointments", roles: ["patient", "doctor", "admin"] },
  { icon: <FileText size={18} />, label: "Prescriptions", href: "/prescriptions", roles: ["patient", "doctor"] },
  { icon: <FlaskConical size={18} />, label: "Lab Reports", href: "/lab", roles: ["patient", "doctor", "lab"] },
  { icon: <CreditCard size={18} />, label: "Payments", href: "/payments", roles: ["patient", "admin"] },
  { icon: <Bell size={18} />, label: "Notifications", href: "/notifications", roles: ["patient", "doctor", "lab", "admin", "superadmin"] },
  { icon: <MessageCircle size={18} />, label: "AI Chatbot", href: "/chatbot", roles: ["patient"] },
  { icon: <Users size={18} />, label: "Patients", href: "/patients", roles: ["doctor", "admin"] },
  { icon: <Activity size={18} />, label: "Disease Monitor", href: "/disease", roles: ["admin", "superadmin"] },
  { icon: <Map size={18} />, label: "Location Stats", href: "/locations", roles: ["superadmin"] },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-teal-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-400 flex items-center justify-center">
            <Activity size={18} className="text-teal-900" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">MediCore</h1>
            <p className="text-teal-300 text-xs">HMS Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                  isActive
                    ? "bg-teal-500 text-white"
                    : "text-teal-100 hover:bg-teal-700 hover:text-white"
                )}
              >
                <span className={cn("shrink-0", isActive ? "text-white" : "text-teal-300 group-hover:text-white")}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-teal-200" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-teal-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.fullName}</p>
            <p className="text-teal-300 text-xs capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-teal-200 hover:bg-teal-700 hover:text-white text-sm transition-all"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex w-60 bg-[#0d6e7e] flex-col shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 bg-[#0d6e7e] flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-gray-800">
              {visibleItems.find((i) => location.startsWith(i.href))?.label ?? "MediCore HMS"}
            </h2>
          </div>
          <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#0d6e7e] flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
