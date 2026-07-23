import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { CreditCard, TrendingUp, CheckCircle, Clock, X } from "lucide-react";

const METHOD_LABELS = { upi: "₹ UPI", card: "💳 Card", cash: "💵 Cash", insurance: "🏥 Insurance" };

export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "consultation", method: "upi" });
  const [loading, setLoading] = useState(false);

  const fetchPayments = () => {
    const param = user?.role === "patient" ? `?patientId=${user.id}` : "";
    api.get(`/payments${param}`).then(setPayments).catch(console.error);
  };
  useEffect(() => { fetchPayments(); }, []);

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/payments", { ...form, amount: Number(form.amount), patientId: user?.id });
      fetchPayments();
      setShowCreate(false);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm">Track your healthcare expenses</p>
        </div>
        {user?.role === "patient" && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d6e7e] text-white rounded-lg hover:bg-[#0a5566] text-sm font-medium">
            <CreditCard size={16} /> New Payment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-[#0d6e7e] to-[#0a5566] rounded-xl p-5 text-white">
          <p className="text-teal-200 text-sm">Total Spent</p>
          <p className="text-3xl font-bold mt-1">₹{totalAmount.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-teal-200 text-xs">
            <TrendingUp size={12} /> {payments.length} transactions
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Completed</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{payments.filter((p) => p.status === "completed").length}</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-xs"><CheckCircle size={12} /> All settled</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{payments.filter((p) => p.status === "pending").length}</p>
          <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs"><Clock size={12} /> Action needed</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Transaction History</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {payments.map((payment) => (
            <div key={payment.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm">{payment.patientName}</p>
                <p className="text-xs text-gray-500">{payment.invoiceId} • {payment.category} • {METHOD_LABELS[payment.method] || payment.method}</p>
                <p className="text-xs text-gray-400">{new Date(payment.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-800">₹{payment.amount.toLocaleString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${payment.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {payment.status}
                </span>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <CreditCard size={40} className="mx-auto mb-3 opacity-40" />
              <p>No payments found</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">New Payment</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="consultation">Consultation</option>
                  <option value="emergency">Emergency</option>
                  <option value="lab">Lab Test</option>
                  <option value="medicine">Medicine</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#0d6e7e] text-white rounded-lg font-medium text-sm hover:bg-[#0a5566] disabled:opacity-60">
                {loading ? "Processing..." : "Process Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
