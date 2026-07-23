import { Router } from "express";
import { LAB_REQUESTS, PATIENTS, DOCTORS } from "../data/seed.js";

const router = Router();

router.get("/lab/requests", (req, res) => {
  const { status, labId } = req.query;
  let filtered = [...LAB_REQUESTS];
  
  if (labId) {
    filtered = filtered.filter((r) => r.labId === parseInt(labId as string));
  }
  if (status) {
    filtered = filtered.filter((r) => r.status === status);
  }
  
  return res.json(filtered);
});

router.post("/lab/requests", (req, res) => {
  const data = req.body;
  const patient = PATIENTS.find((p) => p.id === data.patientId) as any;
  const doctor = DOCTORS.find((d) => d.id === data.doctorId) as any;
  const newReq = {
    id: LAB_REQUESTS.length + 1,
    patientId: data.patientId,
    patientName: patient?.fullName || "",
    doctorId: data.doctorId,
    doctorName: doctor?.fullName || "",
    labId: data.labId || 3,
    testType: data.testType,
    priority: data.priority,
    status: "pending",
    reportUrl: null,
    aiAnalysis: null,
    createdAt: new Date().toISOString(),
  };
  LAB_REQUESTS.push(newReq);
  return res.status(201).json(newReq);
});

router.post("/lab/requests/:id/report", (req, res) => {
  const req2 = LAB_REQUESTS.find((r) => r.id === parseInt(req.params.id));
  if (!req2) return res.status(404).json({ error: "Not found" });
  req2.reportUrl = req.body.reportUrl;
  req2.status = "ready";
  req2.aiAnalysis = {
    primaryCondition: "Pneumonia",
    confidence: 0.87,
    secondaryConditions: [{ condition: "Normal", confidence: 0.09 }],
    disclaimer: "AI analysis is assistive only. Clinical judgment required.",
  };
  return res.json(req2);
});

export default router;
