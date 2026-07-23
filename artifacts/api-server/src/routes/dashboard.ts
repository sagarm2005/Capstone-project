import { Router } from "express";

const router = Router();

router.get("/dashboard/patient", (_req, res) => {
  return res.json({
    upcomingAppointments: 1,
    pendingLabReports: 1,
    activePrescriptions: 1,
    unreadNotifications: 3,
    nextAppointment: { doctorName: "Dr. Raj Mehta", date: "2026-04-10", time: "10:00 AM", type: "normal" },
    recentActivity: [
      { type: "lab_report", message: "Chest X-Ray report ready", time: "2 hours ago" },
      { type: "appointment", message: "Appointment confirmed with Dr. Raj Mehta", time: "5 hours ago" },
      { type: "prescription", message: "New prescription issued", time: "Yesterday" },
    ],
  });
});

router.get("/dashboard/doctor", (_req, res) => {
  return res.json({
    todayAppointments: 8,
    pendingPrescriptions: 3,
    activePatients: 89,
    pendingLabReviews: 2,
    schedule: [
      { time: "10:00 AM", patientName: "Priya Sharma", type: "normal", status: "confirmed" },
      { time: "11:30 AM", patientName: "Arjun Nair", type: "followup", status: "pending" },
      { time: "02:00 PM", patientName: "Rohan Gupta", type: "normal", status: "confirmed" },
    ],
    recentPatients: [
      { name: "Priya Sharma", lastVisit: "2026-04-08", condition: "Diabetes + Hypertension" },
      { name: "Arjun Nair", lastVisit: "2026-03-28", condition: "Asthma" },
    ],
  });
});

export default router;
