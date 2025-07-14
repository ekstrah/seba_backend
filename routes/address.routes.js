import express from "express";
import {
	addAddress,
	deleteAddress,
	getAddresses,
	updateAddress,
	getAddressById
} from "../controllers/address.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorize } from '../middleware/authorize.js';
import { body } from "express-validator";

const addressValidation = [
  body("street").notEmpty().withMessage("Street is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("zipCode").notEmpty().withMessage("Zip code is required"),
  body("country").notEmpty().withMessage("Country is required"),
  body("addressType").notEmpty().withMessage("Address type is required"),
  // isDefault and additionalInfo are optional
];

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all addresses
router.get("/", authorize('getAddresses'), getAddresses);
router.get("/:id", authorize('getAddressById'), getAddressById);


// Add new address
router.post("/", addressValidation, authorize('addAddress'), addAddress);

// Update address
router.put("/:addressId", addressValidation, authorize('updateAddress'), updateAddress);

// Delete address
router.delete("/:addressId", authorize('deleteAddress'), deleteAddress);

export default router;
