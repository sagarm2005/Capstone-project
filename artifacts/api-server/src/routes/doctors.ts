import { Router } from "express";
import { DOCTORS } from "../data/seed.js";

const router = Router();

router.get("/doctors", (req, res) => {
  const specialty = (req.query.specialty as string || "").toLowerCase();
  const location = (req.query.location as string || "").toLowerCase();
  let filtered = [...DOCTORS];
  if (specialty) filtered = filtered.filter((d) => d.specialty.toLowerCase().includes(specialty));
  if (location) filtered = filtered.filter((d) => d.location.toLowerCase().includes(location));
  return res.json(filtered);
});

router.get("/doctors/:id", (req, res) => {
  const doctor = DOCTORS.find((d) => d.id === parseInt(req.params.id));
  if (!doctor) return res.status(404).json({ error: "Not found" });
  return res.json(doctor);
});

router.get("/doctors/:id/slots", (req, res) => {
  const slots = [
    { time: "09:00 AM", available: true },
    { time: "09:30 AM", available: false },
    { time: "10:00 AM", available: true },
    { time: "10:30 AM", available: true },
    { time: "11:00 AM", available: false },
    { time: "11:30 AM", available: true },
    { time: "02:00 PM", available: true },
    { time: "02:30 PM", available: true },
    { time: "03:00 PM", available: false },
    { time: "03:30 PM", available: true },
  ];
  return res.json(slots);
});

export default router;
