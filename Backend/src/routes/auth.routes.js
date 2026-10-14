import express from "express";
import {
  register_user,
  login_user,
  getCurrentUser,
  logout_user,
  refresh_access_token,
} from "../controller/auth.controller.js";
import { authmiddleware } from "../middleware/auth.middleware.js";
import {
  validateAuthInput,
  validateLoginInput,
} from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, validateAuthInput, register_user);
router.post("/login", authLimiter, validateLoginInput, login_user);
router.post("/refresh", refresh_access_token);
router.get("/me", authmiddleware, getCurrentUser);
router.post("/logout", logout_user);

export default router;
