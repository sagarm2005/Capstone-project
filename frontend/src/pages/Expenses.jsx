import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { jsPDF } from "jspdf";
import { 
  Receipt, Stethoscope, FlaskConical, Pill, CheckCircle, 
  Clock, CreditCard, Download, Filter, Search, ArrowUpRight, X, ChevronRight 
} from "lucide-react";

export default function Expenses() {
  const { user } = useAuth();
  const [data, setData] = useState({
    totalExpense: 0,
    doctorCheckupTotal: 0,
    medicalReportsTotal: 0,
    medicineTotal: 0,
    doctorCheckupCount: 0,
    medicalReportsCount: 0,
    medicineCount: 0,
    totalCount: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [payingItem, setPayingItem] = useState(null);
  const [payMethod, setPayMethod] = useState("upi");
  const [payLoading, setPayLoading] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/expenses");
      setData(res);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payingItem) return;
    setPayLoading(true);
    try {
      await api.post(`/expenses/${payingItem.id}/pay`, { method: payMethod });
      setPayingItem(null);
      await fetchExpenses();
    } catch (err) {
      alert(err.message || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  const downloadStatement = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.setTextColor(13, 110, 126);
    pdf.text("MediCore HMS — Healthcare Expense Statement", 14, 22);

    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Patient: ${user?.fullName || "Patient"} | Date: ${new Date().toLocaleDateString()}`, 14, 30);
    pdf.line(14, 34, 196, 34);

    pdf.setFontSize(12);
    pdf.setTextColor(30);
    pdf.text(`Total Healthcare Expense: Rs. ${data.totalExpense.toLocaleString()}`, 14, 44);
    pdf.setFontSize(10);
    pdf.text(`• Doctor Checkups: Rs. ${data.doctorCheckupTotal.toLocaleString()} (${data.doctorCheckupCount} visits)`, 20, 52);
    pdf.text(`• Medical Reports: Rs. ${data.medicalReportsTotal.toLocaleString()} (${data.medicalReportsCount} tests)`, 20, 59);
    pdf.text(`• Medicine Expenses: Rs. ${data.medicineTotal.toLocaleString()} (${data.medicineCount} prescriptions)`, 20, 66);

    pdf.line(14, 72, 196, 72);
    pdf.setFontSize(11);
    pdf.text("Itemized Expense Ledger:", 14, 80);

    let y = 90;
    data.items.slice(0, 20).forEach((item, index) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      const cat = item.category === "consultation" ? "Doctor Checkup" : item.category === "lab" ? "Medical Report" : "Medicines";
      const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
      pdf.setFontSize(9);
      pdf.text(`${index + 1}. [${cat}] ${item.description || item.invoiceId} - ${date}`, 16, y);
      pdf.text(`Rs. ${item.amount} (${item.status || "completed"})`, 155, y);
      y += 8;
    });

    pdf.save(`healthcare-expenses-${user?.id || "patient"}.pdf`);
  };

  const filteredItems = data.items.filter((item) => {
    const cat = (item.category || "").toLowerCase();
    const matchesFilter =
      filter === "all" ? true :
      filter === "doctor" ? (cat === "consultation" || cat === "doctor_checkup" || cat === "emergency") :
      filter === "lab" ? (cat === "lab" || cat === "medical_reports") :
      filter === "medicine" ? (cat === "medicine" || cat === "pharmacy") :
      filter === "pending" ? (item.status === "pending") : true;

    const matchesSearch =
      !search.trim() ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.invoiceId && item.invoiceId.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const doctorPct = data.totalExpense > 0 ? Math.round((data.doctorCheckupTotal / data.totalExpense) * 100) : 0;
  const labPct = data.totalExpense > 0 ? Math.round((data.medicalReportsTotal / data.totalExpense) * 100) : 0;
  const medPct = data.totalExpense > 0 ? Math.round((data.medicineTotal / data.totalExpense) * 100) : 0;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d6e7e]">
              <Receipt size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Total Healthcare Expenses</h1>
              <p className="text-gray-500 text-sm">Doctor checkups, medical reports, and medicine expense ledger</p>
            </div>
          </div>
        </div>
        <button
          onClick={downloadStatement}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Download size={16} className="text-[#0d6e7e]" />
          <span>Export Statement (PDF)</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Grand Total */}
        <div className="bg-gradient-to-br from-[#0d6e7e] to-[#084b56] text-white p-5 rounded-2xl shadow-sm border border-teal-900/20 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-teal-200 text-xs font-semibold uppercase tracking-wider">Grand Total</p>
              <p className="text-3xl font-extrabold mt-1">₹{data.totalExpense.toLocaleString()}</p>
              <p className="text-xs text-teal-100 mt-2 flex items-center gap-1">
                <span>{data.totalCount} total billed items</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-teal-100">
              <Receipt size={22} />
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
        </div>

        {/* Doctor Checkup */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Doctor Checkups</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{data.doctorCheckupTotal.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Stethoscope size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>{data.doctorCheckupCount} Consultations</span>
            <span className="font-semibold text-blue-600">{doctorPct}% of total</span>
          </div>
        </div>

        {/* Medical Reports */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Medical Reports</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{data.medicalReportsTotal.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FlaskConical size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>{data.medicalReportsCount} Lab Tests</span>
            <span className="font-semibold text-purple-600">{labPct}% of total</span>
          </div>
        </div>

        {/* Medicine Expenses */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Medicine Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{data.medicineTotal.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Pill size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>{data.medicineCount} Prescriptions</span>
            <span className="font-semibold text-emerald-600">{medPct}% of total</span>
          </div>
        </div>
      </div>

      {/* Visual Proportion Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          <span>Expense Distribution</span>
          <span>Grand Total: ₹{data.totalExpense.toLocaleString()}</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${doctorPct}%` }} className="bg-blue-500 h-full" title={`Doctor Checkup: ${doctorPct}%`} />
          <div style={{ width: `${labPct}%` }} className="bg-purple-500 h-full" title={`Medical Reports: ${labPct}%`} />
          <div style={{ width: `${medPct}%` }} className="bg-emerald-500 h-full" title={`Medicines: ${medPct}%`} />
        </div>
        <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Doctor Checkup ({doctorPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Medical Reports ({labPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Medicine Expenses ({medPct}%)</span>
          </div>
        </div>
      </div>

      {/* Filter and Itemized Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/70 p-1 rounded-xl">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              All ({data.totalCount})
            </button>
            <button
              onClick={() => setFilter("doctor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === "doctor" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              🩺 Doctor Checkups ({data.doctorCheckupCount})
            </button>
            <button
              onClick={() => setFilter("lab")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === "lab" ? "bg-white text-purple-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              🧪 Medical Reports ({data.medicalReportsCount})
            </button>
            <button
              onClick={() => setFilter("medicine")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === "medicine" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              💊 Medicines ({data.medicineCount})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === "pending" ? "bg-white text-amber-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              Pending Bills
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Ledger Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Type / Category</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5">Invoice / Date</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredItems.map((item) => {
                const cat = (item.category || "").toLowerCase();
                const isDoctor = cat === "consultation" || cat === "doctor_checkup" || cat === "emergency";
                const isLab = cat === "lab" || cat === "medical_reports";
                const isMed = cat === "medicine" || cat === "pharmacy";

                return (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isDoctor ? "bg-blue-50 text-blue-600" :
                          isLab ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {isDoctor ? <Stethoscope size={16} /> : isLab ? <FlaskConical size={16} /> : <Pill size={16} />}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isDoctor ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          isLab ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {isDoctor ? "Doctor Checkup" : isLab ? "Medical Report" : "Medicine"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-gray-900 text-sm">{item.description || "Healthcare Service"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.patientName || user?.fullName}</p>
                    </td>
                    <td className="py-4 px-5 text-xs">
                      <p className="font-mono text-gray-700 font-semibold">{item.invoiceId}</p>
                      <p className="text-gray-400 mt-0.5">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</p>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <p className="text-base font-bold text-gray-900">₹{item.amount?.toLocaleString()}</p>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === "completed" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {item.status === "completed" ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {item.status === "completed" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      {item.status === "pending" ? (
                        <button
                          onClick={() => setPayingItem(item)}
                          className="px-3 py-1.5 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          Pay Bill
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Receipt size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No expense records found matching filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {payingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Settle Healthcare Bill</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{payingItem.invoiceId}</p>
              </div>
              <button onClick={() => setPayingItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Service Description</p>
              <p className="text-sm font-bold text-gray-900">{payingItem.description}</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">Total Due</span>
                <span className="text-2xl font-extrabold text-[#0d6e7e]">₹{payingItem.amount?.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "upi", label: "₹ UPI", desc: "GPay, PhonePe, Paytm" },
                    { id: "card", label: "💳 Card", desc: "Credit / Debit Card" },
                    { id: "cash", label: "💵 Cash", desc: "Pay at Hospital Desk" },
                    { id: "insurance", label: "🏥 Insurance", desc: "Claim Coverage" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        payMethod === m.id ? "border-[#0d6e7e] bg-teal-50/50 ring-2 ring-teal-500/20" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-bold text-sm text-gray-900">{m.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={payLoading}
                className="w-full py-3 bg-[#0d6e7e] text-white rounded-xl font-bold text-sm hover:bg-[#0a5566] disabled:opacity-60 transition-colors shadow-lg shadow-teal-900/10"
              >
                {payLoading ? "Processing Payment..." : `Pay ₹${payingItem.amount?.toLocaleString()} Now`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
