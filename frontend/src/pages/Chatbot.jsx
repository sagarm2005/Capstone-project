import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Send, Bot, User, Sparkles } from "lucide-react";

const INITIAL = {
  id: 0, role: "bot",
  text: "Hello! I'm MediCore AI Assistant. I can help you check doctor availability, book appointments, view lab results, or check your vaccination status. How can I help you today?",
  suggestions: ["Check Availability", "Book Appointment", "Lab Results", "Vaccination Status"],
};

export default function Chatbot() {
  const [messages, setMessages] = useState([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await api.post("/chatbot/query", { message: text });
      const botMsg = { id: Date.now() + 1, role: "bot", text: data.reply, suggestions: data.suggestions };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "bot", text: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl flex flex-col h-[calc(100vh-180px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles size={24} className="text-[#0d6e7e]" /> AI Health Assistant
        </h1>
        <p className="text-gray-500 text-sm">Powered by MediCore AI — 24/7 health support</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "bot" ? "bg-[#0d6e7e]" : "bg-gray-200"}`}>
              {msg.role === "bot" ? <Bot size={14} className="text-white" /> : <User size={14} className="text-gray-600" />}
            </div>
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
              <div className={`px-4 py-3 rounded-2xl text-sm ${msg.role === "bot" ? "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none" : "bg-[#0d6e7e] text-white rounded-tr-none"}`}>
                {msg.text}
              </div>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.suggestions.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs hover:bg-teal-100 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0d6e7e] flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Type your message..." disabled={loading}
        />
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl bg-[#0d6e7e] flex items-center justify-center disabled:opacity-60 hover:bg-[#0a5566] transition-colors">
          <Send size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
