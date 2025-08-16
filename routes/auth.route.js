import express from "express";
import {
  login,
  logout,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
  resendverification,
  getCurrentUser, // Make sure this is imported
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { completeBusinessRegistration } from "../controllers/auth.controller.js";
const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/resend-verification", resendverification); // Fixed route name to match frontend
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get('/me', getCurrentUser);
router.post("/complete-business-registration", completeBusinessRegistration);

export default router;