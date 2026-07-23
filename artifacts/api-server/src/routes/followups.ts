import { Router } from "express";
import { PRESCRIPTIONS } from "../data/seed.js";

const router = Router();

router.get("/followups", (req, res) => {
  const { patientId } = req.query;
  
  if (!patientId) {
    return res.status(400).json({ error: "patientId required" });
  }
  
  const patientFollowups = PRESCRIPTIONS
    .filter((rx) => rx.patientId === parseInt(patientId as string) && rx.followupDate)
    .map((rx) => ({
      id: rx.id,
      patientId: rx.patientId,
      patientName: rx.patientName,
      doctorId: rx.doctorId,
      doctorName: rx.doctorName,
      diagnosis: rx.diagnosis,
      followupDate: rx.followupDate,
      prescriptionId: rx.id,
      createdAt: rx.createdAt,
    }))
    .sort((a, b) => new Date(a.followupDate).getTime() - new Date(b.followupDate).getTime());
  
  return res.json(patientFollowups);
});

export default router;
