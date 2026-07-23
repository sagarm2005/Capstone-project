import { Router } from "express";
import { PRESCRIPTIONS, PATIENTS, DOCTORS } from "../data/seed.js";

const router = Router();

router.get("/prescriptions", (req, res) => {
  const { patientId, doctorId } = req.query;
  let filtered = [...PRESCRIPTIONS];
  if (patientId) filtered = filtered.filter((p) => p.patientId === parseInt(patientId as string));
  if (doctorId) filtered = filtered.filter((p) => p.doctorId === parseInt(doctorId as string));
  return res.json(filtered);
});

router.post("/prescriptions", (req, res) => {
  const data = req.body;
  const patient = PATIENTS.find((p) => p.id === data.patientId) as any;
  const doctor = DOCTORS.find((d) => d.id === data.doctorId) as any;
  const allergies: string[] = patient?.allergies || [];
  const validations = (data.medicines || []).map((med: any) => {
    const conflict = allergies.some((a) => a.toLowerCase().includes(med.name.toLowerCase().split(" ")[0]));
    return conflict
      ? { type: "error", message: `${med.name} — patient has known allergy conflict` }
      : { type: "success", message: `${med.name} — no allergy conflict detected` };
  });
  const newRx = {
    id: PRESCRIPTIONS.length + 1,
    patientId: data.patientId,
    patientName: patient?.fullName || "",
    doctorId: data.doctorId,
    doctorName: doctor?.fullName || "",
    doctorLicense: "MCI-KA-12345",
    hospital: doctor?.hospital || "",
    diagnosis: data.diagnosis,
    medicines: data.medicines || [],
    labTests: data.labTests || [],
    followupDate: data.followupDate || null,
    validations,
    createdAt: new Date().toISOString(),
  };
  PRESCRIPTIONS.push(newRx);
  return res.status(201).json(newRx);
});

router.get("/prescriptions/:id", (req, res) => {
  const rx = PRESCRIPTIONS.find((p) => p.id === parseInt(req.params.id));
  if (!rx) return res.status(404).json({ error: "Not found" });
  return res.json(rx);
});

export default router;
