import { Router } from "express";
import { APPOINTMENTS, PATIENTS, DOCTORS } from "../data/seed.js";

const router = Router();

router.get("/appointments", (req, res) => {
  const { patientId, doctorId, status } = req.query;
  let filtered = [...APPOINTMENTS];
  if (patientId) filtered = filtered.filter((a) => a.patientId === parseInt(patientId as string));
  if (doctorId) filtered = filtered.filter((a) => a.doctorId === parseInt(doctorId as string));
  if (status) filtered = filtered.filter((a) => a.status === status);
  return res.json(filtered);
});

router.post("/appointments", (req, res) => {
  const data = req.body;
  const patient = PATIENTS.find((p) => p.id === data.patientId) as any;
  const doctor = DOCTORS.find((d) => d.id === data.doctorId) as any;
  const newAppt = {
    id: APPOINTMENTS.length + 1,
    patientId: data.patientId,
    patientName: patient?.fullName || "",
    doctorId: data.doctorId,
    doctorName: doctor?.fullName || "",
    date: data.date,
    time: data.time,
    type: data.type,
    status: "pending",
    fee: doctor?.fee || 600,
    notes: data.notes || "",
  };
  APPOINTMENTS.push(newAppt);
  return res.status(201).json(newAppt);
});

router.get("/appointments/:id", (req, res) => {
  const appt = APPOINTMENTS.find((a) => a.id === parseInt(req.params.id));
  if (!appt) return res.status(404).json({ error: "Not found" });
  return res.json(appt);
});

router.patch("/appointments/:id", (req, res) => {
  const appt = APPOINTMENTS.find((a) => a.id === parseInt(req.params.id));
  if (!appt) return res.status(404).json({ error: "Not found" });
  Object.assign(appt, req.body);
  return res.json(appt);
});

export default router;
