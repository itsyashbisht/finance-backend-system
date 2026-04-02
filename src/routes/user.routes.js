import { Router } from "express";
import {
  getMe,
  updateMe,
  getAllUsers,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { ROLES } from "../constant.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// All roles
router.route("/me").get(getMe);
router.route("/me").patch(updateMe);

// ADMIN only
router.route("/").get(authorize(ROLES.ADMIN), getAllUsers);
router.route("/:id/role").patch(authorize(ROLES.ADMIN), updateUserRole);
router.route("/:id").delete(authorize(ROLES.ADMIN), deleteUser);
router.route("/:id/status").patch(authorize(ROLES.ADMIN), toggleUserStatus);

export default router;
