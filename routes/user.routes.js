import express from "express";
import {
	getContactInfo,
	updateContactInfo,
	listPaymentMethods,
	updateFarmerProfile
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { getAddresses } from "../controllers/address.controller.js";
import { createSetupIntent } from "../controllers/stripeWebhook.controller.js";
import { Farmer } from "../models/farmer.model.js";
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Public route to get farmer details by ID
router.get("/farmer/:id", authorize('getFarmerDetails'), async (req, res) => {
	try {
		const farmer = await Farmer.findById(req.params.id).select("-password");
		if (!farmer) {
			return res.status(404).json({ success: false, message: "Farmer not found" });
		}
		res.status(200).json({ success: true, farmer });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// Apply authentication middleware to all other routes
router.use(verifyToken);

// Update farmer profile information
router.put("/farmer/profile", authorize('updateFarmerProfile'), updateFarmerProfile)

// Get user contact information
router.get("/contact", authorize('getContactInfo'), getContactInfo);

// Update user contact information
router.put("/contact", authorize('updateContactInfo'), updateContactInfo);

// Get user addresses
router.get("/addresses", authorize('getAddresses'), getAddresses);

// Stripe SetupIntent for saving a card
router.post("/payment-methods/create-setup-intent", authorize('createSetupIntent'), createSetupIntent);

// List saved Stripe payment methods
router.get("/payment-methods", authorize('listPaymentMethods'), listPaymentMethods);

export default router;
