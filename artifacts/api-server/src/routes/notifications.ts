import { Router } from "express";
import { NOTIFICATIONS } from "../data/seed.js";

const router = Router();

router.get("/notifications", (req, res) => {
  const { userId } = req.query;
  const filtered = userId
    ? NOTIFICATIONS.filter((n) => n.userId === parseInt(userId as string))
    : [...NOTIFICATIONS];
  return res.json(filtered);
});

router.post("/notifications/:id/read", (req, res) => {
  const notif = NOTIFICATIONS.find((n) => n.id === parseInt(req.params.id));
  if (notif) notif.read = true;
  return res.json({ message: "Marked as read" });
});

export default router;
