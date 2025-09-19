import express from "express";
import {
  login,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  logout,
  getCurrentUser,
  deleteAccount,
  deactivateAccount,
  updatePassword,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/resend-verification", resendVerification);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/update-password", updatePassword);
router.get("/me", verifyToken, getCurrentUser);
router.post("/delete-account", verifyToken, deleteAccount);
router.post("/deactivate-account", verifyToken, deactivateAccount);

export default router;
