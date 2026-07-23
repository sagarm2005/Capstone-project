import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  FlaskConical, 
  Syringe, 
  Users, 
  Activity, 
  CreditCard, 
  Bell, 
  Droplet,
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";

const MENU_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["patient", "doctor", "lab", "admin", "superadmin", "blood_bank"] },
  { path: "/appointments", label: "Appointments", icon: Calendar, roles: ["patient", "doctor", "admin", "superadmin"] },
  { path: "/prescriptions", label: "Prescriptions", icon: FileText, roles: ["patient", "doctor", "admin"] },
  { path: "/lab", label: "Lab Reports", icon: FlaskConical, roles: ["patient", "doctor", "lab", "admin"] },
  { path: "/vaccinations", label: "Vaccinations", icon: Syringe, roles: ["patient", "doctor", "admin"] },
  { path: "/patients", label: "Patients", icon: Users, roles: ["doctor", "admin", "superadmin"] },
  { path: "/blood-bank", label: "Blood Bank", icon: Droplet, roles: ["doctor", "blood_bank", "admin"] },
  { path: "/chatbot", label: "AI Assistant", icon: Sparkles, roles: ["patient", "doctor"] },
  { path: "/disease", label: "Disease Monitor", icon: Activity, roles: ["admin", "superadmin"] },
  { path: "/payments", label: "Payments", icon: CreditCard, roles: ["patient", "admin"] },
  { path: "/notifications", label: "Notifications", icon: Bell, roles: ["patient", "doctor", "lab", "admin", "blood_bank"] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Normalize role for comparison
  const userRole = (user?.role || "").toLowerCase().replace(/ /g, "_");

  const filteredMenu = MENU_ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-[#0d6e7e] flex items-center justify-center shadow-lg shadow-teal-900/10">
            <Activity size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">MediCore</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Main Menu</p>
        {filteredMenu.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <a className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                ${isActive 
                  ? "bg-teal-50 text-[#0d6e7e] shadow-sm shadow-teal-900/5" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}
              `}>
                <Icon size={20} className={isActive ? "text-[#0d6e7e]" : "text-gray-400 group-hover:text-gray-600"} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0d6e7e]" />}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User & Settings Footer */}
      <div className="p-4 border-t border-gray-50 space-y-2">
        <Link href="/settings">
          <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
            <Settings size={20} />
            Settings
          </a>
        </Link>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>

        {/* Mini Profile */}
        <div className="mt-4 p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0d6e7e] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.fullName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}