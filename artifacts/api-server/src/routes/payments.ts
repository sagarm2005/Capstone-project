import { Router } from "express";
import { PAYMENTS, PATIENTS } from "../data/seed.js";

const router = Router();

router.get("/payments", (req, res) => {
  const { patientId } = req.query;
  const filtered = patientId
    ? PAYMENTS.filter((p) => p.patientId === parseInt(patientId as string))
    : [...PAYMENTS];
  return res.json(filtered);
});

router.post("/payments", (req, res) => {
  const data = req.body;
  const patient = PATIENTS.find((p) => p.id === data.patientId) as any;
  const newPayment = {
    id: PAYMENTS.length + 1,
    patientId: data.patientId,
    patientName: patient?.fullName || "",
    appointmentId: data.appointmentId || null,
    amount: data.amount,
    category: data.category,
    method: data.method,
    status: "completed",
    invoiceId: `INV-2026-${String(PAYMENTS.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };
  PAYMENTS.push(newPayment);
  return res.status(201).json(newPayment);
});

export default router;
