import { Router } from "express";
import { PATIENTS, FOLLOWUPS } from "../data/seed.js";

const router = Router();

router.get("/patients", (req, res) => {
  const search = (req.query.search as string || "").toLowerCase();
  const limit = parseInt(req.query.limit as string || "20");
  const offset = parseInt(req.query.offset as string || "0");
  const filtered = PATIENTS.filter((p) =>
    !search || p.fullName.toLowerCase().includes(search) || p.email.toLowerCase().includes(search)
  );
  return res.json({ patients: filtered.slice(offset, offset + limit), total: filtered.length });
});

router.get("/patients/:id", (req, res) => {
  const patient = PATIENTS.find((p) => p.id === parseInt(req.params.id));
  if (!patient) return res.status(404).json({ error: "Not found" });
  return res.json(patient);
});

router.get("/patients/:id/history", (req, res) => {
  const visits = [
    { id: 1, date: "2026-03-15", doctorName: "Dr. Raj Mehta", diagnosis: "Type 2 Diabetes review", notes: "BP controlled, adjust Metformin" },
    { id: 2, date: "2026-01-10", doctorName: "Dr. Raj Mehta", diagnosis: "Hypertension follow-up", notes: "Continue Lisinopril 10mg" },
    { id: 3, date: "2025-11-20", doctorName: "Dr. Anita Desai", diagnosis: "Seasonal flu", notes: "Rest and fluids prescribed" },
  ];
  return res.json({ visits });
});

router.get("/patients/:id/followups", (req, res) => {
  const id = parseInt(req.params.id);
  return res.json(FOLLOWUPS.filter((f) => f.patientId === id));
});

export default router;
