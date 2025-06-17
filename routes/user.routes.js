import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
	updateContactInfo,
	getContactInfo,
} from "../controllers/user.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get user contact information
router.get("/contact", getContactInfo);

// Update user contact information
router.put("/contact", updateContactInfo);

export default router;
