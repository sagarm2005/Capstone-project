import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import patientsRouter from "./patients.js";
import doctorsRouter from "./doctors.js";
import appointmentsRouter from "./appointments.js";
import prescriptionsRouter from "./prescriptions.js";
import labRouter from "./lab.js";
import followupsRouter from "./followups.js";
import bloodBankRouter from "./blood-bank.js";
import paymentsRouter from "./payments.js";
import notificationsRouter from "./notifications.js";
import adminRouter from "./admin.js";
import chatbotRouter from "./chatbot.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(patientsRouter);
router.use(doctorsRouter);
router.use(appointmentsRouter);
router.use(prescriptionsRouter);
router.use(labRouter);
router.use(followupsRouter);
router.use(bloodBankRouter);
router.use(paymentsRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(chatbotRouter);
router.use(dashboardRouter);

export default router;
