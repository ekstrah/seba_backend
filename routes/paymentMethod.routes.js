import express from "express";
import {
	checkPaymentMethods,
	getPaymentMethods,
} from "../controllers/paymentMethod.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// All payment method routes require authentication
router.use(verifyToken);

// Check if user has payment methods
router.get("/check", checkPaymentMethods);

// Get all payment methods
router.get("/", getPaymentMethods);

export default router;
