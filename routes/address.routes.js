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

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all addresses
router.get("/", authorize('getAddresses'), getAddresses);
router.get("/:id", authorize('getAddressById'), getAddressById);


// Add new address
router.post("/", authorize('addAddress'), addAddress);

// Update address
router.put("/:addressId", authorize('updateAddress'), updateAddress);

// Delete address
router.delete("/:addressId", authorize('deleteAddress'), deleteAddress);

export default router;
