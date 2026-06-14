import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
    getActiveStreak,
	getDashboard,
	getMostImproved,
	getWeeklyActivity,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getDashboard);
router.get("/most-improved", getMostImproved);
router.get("/weekly-activity", getWeeklyActivity);
router.get("/active-streak", getActiveStreak);

export default router;
