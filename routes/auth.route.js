import express from "express";
import {
	checkAuth,
	forgotPassword,
	login,
	logout,
	resetPassword,
	signup,
	verifyEmail,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.get("/check-auth", verifyToken, authorize('checkAuth'), checkAuth);
router.post("/signup", authorize('signup'), signup);
router.post("/login", authorize('login'), login);
router.post("/logout", verifyToken, authorize('logout'), logout);

router.post("/verify-email", authorize('verifyEmail'), verifyEmail);
router.post("/forgot-password", authorize('forgotPassword'), forgotPassword);

router.post("/reset-password/:token", authorize('resetPassword'), resetPassword);

export default router;

// https://youtu.be/pmvEgZC55Cg?t=1028
