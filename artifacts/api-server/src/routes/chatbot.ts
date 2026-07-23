import { Router } from "express";

const router = Router();

const INTENTS: Record<string, string[]> = {
  availability: ["available", "availability", "when", "slot", "schedule", "open", "free"],
  booking: ["book", "appointment", "schedule", "reserve"],
  vaccination: ["vaccine", "vaccination", "immunization", "shot"],
  lab: ["lab", "report", "test", "result", "x-ray", "scan"],
  followup: ["follow", "followup", "follow-up", "revisit"],
  greeting: ["hi", "hello", "hey", "good morning", "good afternoon"],
};

const REPLIES: Record<string, [string, string[]]> = {
  greeting: ["Hello! I'm MediCore Assistant. How can I help you today?", ["Check Availability", "Book Appointment", "Lab Results", "Vaccination Status"]],
  availability: ["Dr. Raj Mehta has slots at 10:00 AM and 3:00 PM tomorrow. Would you like to book one?", ["Book 10:00 AM", "Book 3:00 PM", "See Other Doctors"]],
  booking: ["I'll help you book an appointment. Please choose a doctor and time slot.", ["Dr. Raj Mehta", "Dr. Anita Desai", "Dr. Sunita Reddy"]],
  vaccination: ["You're up to date on all vaccines. Next due: Flu shot in November 2026.", ["View All Vaccines", "Book Flu Shot"]],
  lab: ["Your chest X-ray report is ready. The AI analysis suggests Pneumonia (87% confidence) — please consult your doctor.", ["View Report", "Contact Doctor"]],
  followup: ["You have a follow-up due with Dr. Raj Mehta on July 10, 2026.", ["Book Follow-up", "Remind Me Later"]],
  general: ["I can help you check doctor availability, book appointments, view lab results, or check your vaccination status. What would you like to do?", ["Book Appointment", "Check Availability", "Lab Results", "Vaccination Status"]],
};

function detectIntent(message: string): string {
  const msg = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some((k) => msg.includes(k))) return intent;
  }
  return "general";
}

router.post("/chatbot/query", (req, res) => {
  const { message } = req.body;
  const intent = detectIntent(message || "");
  const [reply, suggestions] = REPLIES[intent] || REPLIES.general;
  return res.json({ reply, intent, suggestions });
});

export default router;
