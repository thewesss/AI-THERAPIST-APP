import express from "express";
import { auth } from "../middleware/auth";
import { logActivity, getTodayActivities } from "../controllers/activityController";

const router = express.Router();

router.use(auth);

router.post("/", logActivity);

router.get("/today", getTodayActivities);

export default router;