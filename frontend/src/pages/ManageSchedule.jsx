import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Save, Plus, Trash2, Clock, CheckCircle } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ManageSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get(`/doctors/${user.id}/schedule`)
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setSchedule(data);
        } else {
          // Initialize empty
          const empty = DAYS.reduce((acc, day) => ({ ...acc, [day]: { active: false, slots: [] } }), {});
          setSchedule(empty);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/doctors/${user.id}/schedule`, schedule);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], active: !schedule[day].active }
    });
  };

  const addSlot = (day) => {
    const newSlot = { id: Date.now().toString(), start: "09:00", end: "10:00", capacity: 5 };
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], slots: [...schedule[day].slots, newSlot] }
    });
  };

  const updateSlot = (day, slotId, field, value) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        slots: schedule[day].slots.map(s => s.id === slotId ? { ...s, [field]: value } : s)
      }
    });
  };

  const removeSlot = (day, slotId) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        slots: schedule[day].slots.filter(s => s.id !== slotId)
      }
    });
  };

  if (loading) return <div className="text-center mt-10">Loading schedule...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Schedule</h1>
          <p className="text-gray-500 mt-1">Configure your weekly availability and patient capacities.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0d6e7e] text-white px-5 py-2.5 rounded-xl font-medium tracking-wide hover:bg-[#0a5a67] transition-colors disabled:opacity-70"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
          Save Schedule
        </button>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-200 shadow-sm animate-fade-in">
          <CheckCircle className="text-green-500" size={20} />
          <span className="font-medium">Schedule updated successfully. patients will now see these limits!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {DAYS.map((day, idx) => (
          <div key={day} className={`p-6 ${idx !== DAYS.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex items-center gap-4 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={schedule[day]?.active || false}
                  onChange={() => toggleDay(day)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0d6e7e]"></div>
              </label>
              <h3 className="text-lg font-semibold text-gray-800 w-32">{day}</h3>
              
              {schedule[day]?.active && (
                <button
                  onClick={() => addSlot(day)}
                  className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[#0d6e7e] hover:text-[#0a5a67] bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={16} /> Add Time Block
                </button>
              )}
            </div>

            {schedule[day]?.active ? (
              <div className="space-y-3 pl-14">
                {schedule[day].slots.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No time blocks added yet for {day}. Add one to open slots.</p>
                ) : (
                  schedule[day].slots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <Clock size={16} className="text-gray-400" />
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(day, slot.id, "start", e.target.value)}
                          className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 p-0"
                        />
                        <span className="text-gray-400 font-medium">to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(day, slot.id, "end", e.target.value)}
                          className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 p-0"
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Capacity</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={slot.capacity}
                            onChange={(e) => updateSlot(day, slot.id, "capacity", parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                          <span className="text-sm text-gray-500 font-medium">Patients</span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeSlot(day, slot.id)}
                        className="ml-auto p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Block"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 pl-14 italic">You are not taking appointments on {day}s.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
