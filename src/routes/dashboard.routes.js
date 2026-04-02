import { Router } from "express";
import {
  getSummary,
  getByCategory,
  getMonthlyTrend,
  getRecentActivity,
} from "../controllers/dashboard.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { ROLES } from "../constant.js";

const router = Router();

// All dashboard routes -- authenticated + ADMIN or MANAGER only
router.use(verifyJWT);
router.use(authorize(ROLES.ADMIN, ROLES.MANAGER));

router.route("/summary").get(getSummary);
router.route("/by-category").get(getByCategory);
router.route("/monthly-trend").get(getMonthlyTrend);
router.route("/recent-activity").get(getRecentActivity);

export default router;
