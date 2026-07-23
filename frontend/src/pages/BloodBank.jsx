import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Droplet, Plus, Minus, X, AlertCircle, TrendingUp, Search, MapPin, Phone } from "lucide-react";

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export default function BloodBank() {
  const { user } = useAuth();
  const [banks, setBanks] = useState([]);
  const [bank, setBank] = useState(null);
  const [stock, setStock] = useState({});
  const [reservations, setReservations] = useState([]);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState("add");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveForm, setReserveForm] = useState({ bankId: null, group: "O+", patientName: "" });

  const role = (user?.role || "").toLowerCase().replace(/ /g, "_");

  useEffect(() => {
    if (user?.id) {
      fetchBankData();
    }
  }, [user]);

  const fetchBankData = async () => {
    try {
      const banks = await api.get("/blood-banks");
      setBanks(banks || []);
      
      if (role === "blood_bank") {
        const bankData = banks.find(b => b.managerId === user.id) || banks[0];
        setBank(bankData);
        if (bankData) {
          setStock(bankData.stock || {});
          const reservs = await api.get(`/blood-reservations?bloodBankId=${bankData.id}`);
          setReservations(reservs || []);
        }
      } else {
        const reservs = await api.get(`/blood-reservations?doctorId=${user.id}`);
        setReservations(reservs || []);
      }
    } catch (err) {
      console.error("Failed to fetch bank data:", err);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedBloodGroup || !bank) return;

    setLoading(true);
    try {
      await api.patch(`/blood-banks/${bank.id}/stock`, {
        bloodGroup: selectedBloodGroup,
        quantity: parseInt(quantity),
        action,
      });

      // Refresh data
      await fetchBankData();
      setSelectedBloodGroup(null);
      setQuantity(1);
      setAction("add");
    } catch (err) {
      console.error("Failed to update stock:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/blood-reservations", {
        bloodBankId: reserveForm.bankId,
        bloodGroup: reserveForm.group,
        units: 1,
        patientName: reserveForm.patientName
      });
      setShowReserveModal(false);
      fetchBankData();
    } catch (err) {
      alert(err.message || "Failed to reserve blood");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    try {
      await api.patch(`/blood-reservations/${reservationId}`, { status: "cancelled" });
      await fetchBankData();
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
    }
  };

  const handleMarkCollected = async (reservationId) => {
    try {
      await api.patch(`/blood-reservations/${reservationId}`, { status: "collected" });
      await fetchBankData();
    } catch (err) {
      console.error("Failed to mark as collected:", err);
    }
  };

  const getStockStatus = (count) => {
    if (count === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (count < 10) return { label: "Low Stock", color: "bg-amber-100 text-amber-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  if (role === "doctor") {
    const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.location.toLowerCase().includes(search.toLowerCase()));
    return (
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Blood Bank Directory</h1>
            <p className="text-gray-500 text-sm mt-1">Locate and reserve blood packets across the network</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm shadow-sm"
              placeholder="Search by bank name or area..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBanks.map(b => (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{b.name}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
                      <MapPin size={14} className="text-red-500" /> {b.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                    <Phone size={12} /> {b.phone}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  {BLOOD_GROUPS.map(group => {
                    const count = b.stock?.[group] || 0;
                    return (
                      <div key={group} className={`p-2 rounded-xl text-center border ${count > 0 ? 'bg-red-50/30 border-red-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter">{group}</p>
                        <p className="text-sm font-bold text-gray-900">{count}</p>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => {
                    setReserveForm({ bankId: b.id, group: "O+", patientName: "" });
                    setShowReserveModal(true);
                  }}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/10 flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Reserve Blood Packet
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Reservations Table for Doctors */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-900">Your Recent Reservations</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {reservations.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.patientName}</p>
                  <p className="text-xs text-gray-500">{r.bloodGroup} • {r.units} Unit • {banks.find(b => b.id === r.bloodBankId)?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  r.status === "reserved" ? "bg-amber-100 text-amber-700" :
                  r.status === "collected" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {showReserveModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reserve Blood Packet</h2>
                <button onClick={() => setShowReserveModal(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleReserve} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Patient Name</label>
                  <input value={reserveForm.patientName} onChange={e => setReserveForm({...reserveForm, patientName: e.target.value})} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Enter patient name..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Blood Group</label>
                  <select value={reserveForm.group} onChange={e => setReserveForm({...reserveForm, group: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none">
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-relaxed font-medium">Reservations are held for 72 hours. Please ensure collection within the expiry period to prevent cancellation.</p>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
                  {loading ? "Confirming..." : "Confirm Reservation"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Blood Bank Management</h1>
        <p className="text-gray-500 text-sm mt-1">{bank?.name} • {bank?.location}</p>
      </div>

      {/* Stock Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Droplet size={20} className="text-red-600" />
            </div>
            <p className="text-sm text-gray-500">Total Stock</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalStock}</p>
          <p className="text-xs text-gray-400 mt-2">units available</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <AlertCircle size={20} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Active Reservations</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{reservations.filter(r => r.status === "reserved").length}</p>
          <p className="text-xs text-gray-400 mt-2">pending collection</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Collected Today</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{reservations.filter(r => r.status === "collected" && new Date(r.createdAt).toDateString() === new Date().toDateString()).length}</p>
          <p className="text-xs text-gray-400 mt-2">reservations fulfilled</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Droplet size={20} className="text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">Blood Groups</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{BLOOD_GROUPS.length}</p>
          <p className="text-xs text-gray-400 mt-2">types available</p>
        </div>
      </div>

      {/* Blood Stock Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Droplet size={18} className="text-red-600" /> Blood Stock Inventory
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BLOOD_GROUPS.map((group) => {
              const count = stock[group] || 0;
              const status = getStockStatus(count);
              return (
                <div key={group} className="border border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-lg text-gray-900">{group}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {count > 0 ? count : "0"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{status.label}</p>
                  <button
                    onClick={() => {
                      setSelectedBloodGroup(group);
                      setQuantity(1);
                      setAction("add");
                    }}
                    className="w-full py-2 text-xs font-medium rounded-lg bg-gray-50 hover:bg-teal-50 text-gray-700 hover:text-teal-700 transition-colors"
                  >
                    Manage
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Adjustment Panel */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">Adjust Stock</h3>

          {selectedBloodGroup ? (
            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Blood Group</p>
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-300">
                  <span className="font-bold text-lg text-gray-900">{selectedBloodGroup}</span>
                  <span className="text-sm text-gray-600">Current: {stock[selectedBloodGroup] || 0} units</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="add">Add Stock</option>
                  <option value="subtract">Remove Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium text-sm flex items-center justify-center gap-2"
                >
                  {action === "add" ? <Plus size={16} /> : <Minus size={16} />}
                  {loading ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBloodGroup(null)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-300 font-medium text-sm"
                >
                  <X size={16} />
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-600 text-center py-8">Select a blood group to adjust stock</p>
          )}
        </div>
      </div>

      {/* Active Reservations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle size={18} className="text-blue-600" /> Active Reservations
          </h2>
        </div>

        {reservations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Droplet size={40} className="mx-auto mb-3 opacity-40" />
            <p>No reservations at this time</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-gray-900">{reservation.patientName}</p>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                      {reservation.bloodGroup}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {reservation.units} units
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Requested by: {reservation.doctorName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Reserved: {new Date(reservation.reservedDate).toLocaleDateString()} • 
                    Expires: {new Date(reservation.expiryDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    reservation.status === "reserved" ? "bg-amber-100 text-amber-700" :
                    reservation.status === "collected" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {reservation.status}
                  </span>
                  {reservation.status === "reserved" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMarkCollected(reservation.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium"
                      >
                        Collected
                      </button>
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
