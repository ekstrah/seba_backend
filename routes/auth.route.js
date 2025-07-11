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
import { body } from "express-validator";
import rateLimit from "express-rate-limit";

const signupValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("role").isIn(["consumer", "farmer"]).withMessage("Role must be consumer or farmer"),
  // For farmers, farmName and introduction are required
  body("farmName").if(body("role").equals("farmer")).notEmpty().withMessage("Farm name is required for farmers"),
  body("introduction").if(body("role").equals("farmer")).notEmpty().withMessage("Introduction is required for farmers"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

const resetPasswordValidation = [
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many login attempts from this IP, please try again after 5 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const router = express.Router();

router.get("/check-auth", verifyToken, authorize('checkAuth'), checkAuth);
router.post("/signup", signupValidation, authorize('signup'), signup);
router.post("/login", loginRateLimiter, loginValidation, authorize('login'), login);
router.post("/logout", verifyToken, authorize('logout'), logout);

router.post("/verify-email", authorize('verifyEmail'), verifyEmail);
router.post("/forgot-password", forgotPasswordValidation, authorize('forgotPassword'), forgotPassword);

router.post("/reset-password/:token", resetPasswordValidation, authorize('resetPassword'), resetPassword);

export default router;

// https://youtu.be/pmvEgZC55Cg?t=1028
