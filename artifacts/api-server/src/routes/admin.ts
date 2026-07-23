import { Router } from "express";
import { LOCATIONS, DISEASE_DATA, SPREAD_PREDICTIONS } from "../data/seed.js";

const router = Router();

router.get("/admin/stats", (_req, res) => {
  return res.json({
    totalDoctors: 248,
    activeDoctors: 231,
    totalPatients: 12847,
    totalFacilities: 34,
    criticalAlerts: 7,
    appointmentsToday: 12,
    prescriptionsToday: 8,
    pendingLabReports: 3,
  });
});

router.get("/admin/locations", (_req, res) => {
  return res.json(LOCATIONS);
});

router.get("/admin/disease-data", (_req, res) => {
  return res.json(DISEASE_DATA);
});

router.get("/admin/spread-prediction", (_req, res) => {
  return res.json(SPREAD_PREDICTIONS);
});

export default router;
