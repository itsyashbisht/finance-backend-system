import { Router } from "express";
import {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} from "../controllers/financialRecord.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { ROLES } from "../constant.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// All roles -- data scoping handled inside controller
router.route("/").post(createRecord);
router.route("/").get(getAllRecords);
router.route("/:id").get(getRecordById);
router.route("/:id").patch(updateRecord);

// ADMIN + MANAGER only
router
  .route("/:id")
  .delete(authorize(ROLES.ADMIN, ROLES.MANAGER), deleteRecord);

export default router;
