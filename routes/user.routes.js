import express from "express";
import {
	getContactInfo,
	updateContactInfo,
	listPaymentMethods,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { getAddresses } from "../controllers/address.controller.js";
import { createSetupIntent } from "../controllers/stripeWebhook.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get user contact information
router.get("/contact", getContactInfo);

// Update user contact information
router.put("/contact", updateContactInfo);

// Get user addresses
router.get("/addresses", getAddresses);

// Stripe SetupIntent for saving a card
router.post("/payment-methods/create-setup-intent", createSetupIntent);

// List saved Stripe payment methods
router.get("/payment-methods", listPaymentMethods);

export default router;
