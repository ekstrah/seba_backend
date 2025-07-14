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
import { body } from "express-validator";

const updateContactValidation = [
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
];

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

// Public route to get 10 random farmers
router.get("/farmers/random", async (req, res) => {
  try {
    const count = Number(req.query.count) || 10;
    const farmers = await Farmer.aggregate([
      { $match: { role: "farmer" } },
      { $sample: { size: count } }
    ]);
    res.status(200).json({ success: true, farmers });
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
router.put("/contact", updateContactValidation, authorize('updateContactInfo'), updateContactInfo);

// Get user addresses
router.get("/addresses", authorize('getAddresses'), getAddresses);

// Stripe SetupIntent for saving a card
router.post("/payment-methods/create-setup-intent", authorize('createSetupIntent'), createSetupIntent);

// List saved Stripe payment methods
router.get("/payment-methods", authorize('listPaymentMethods'), listPaymentMethods);

export default router;
