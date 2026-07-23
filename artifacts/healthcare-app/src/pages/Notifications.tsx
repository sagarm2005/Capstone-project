import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Bell, Calendar, FlaskConical, CreditCard, Clock, CheckCircle } from "lucide-react";

type Notification = {
  id: number; userId: number; type: string; title: string; message: string; read: boolean; createdAt: string;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  appointment: <Calendar size={16} className="text-blue-600" />,
  lab_report: <FlaskConical size={16} className="text-purple-600" />,
  payment: <CreditCard size={16} className="text-green-600" />,
  followup: <Clock size={16} className="text-amber-600" />,
};

const TYPE_BG: Record<string, string> = {
  appointment: "bg-blue-50",
  lab_report: "bg-purple-50",
  payment: "bg-green-50",
  followup: "bg-amber-50",
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifs = () => {
    api.get<Notification[]>(`/notifications?userId=${user?.id}`).then(setNotifications).catch(console.error);
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id: number) => {
    await api.post(`/notifications/${id}/read`, {});
    fetchNotifs();
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => api.post(`/notifications/${n.id}/read`, {})));
    fetchNotifs();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#0d6e7e] hover:bg-teal-50 rounded-lg transition-colors">
            <CheckCircle size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Bell size={40} className="mx-auto mb-3 opacity-40" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!notif.read ? "bg-teal-50/30" : ""}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${TYPE_BG[notif.type] || "bg-gray-50"}`}>
                  {TYPE_ICONS[notif.type] || <Bell size={16} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!notif.read ? "text-gray-900" : "text-gray-700"}`}>{notif.title}</p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#0d6e7e] shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</p>
                    {!notif.read && (
                      <button onClick={() => markRead(notif.id)} className="text-xs text-[#0d6e7e] hover:underline">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
