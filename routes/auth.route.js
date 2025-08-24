import express from "express";
import {
  login,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
} from "../controllers/auth.controller.js";
import { completeBusinessRegistration } from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/resend-verification", resendVerification);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/complete-business-registration", completeBusinessRegistration);

export default router;
