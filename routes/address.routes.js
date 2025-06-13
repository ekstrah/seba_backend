import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress
} from "../controllers/address.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all addresses
router.get("/", getAddresses);

// Add new address
router.post("/", addAddress);

// Update address
router.put("/:addressId", updateAddress);

// Delete address
router.delete("/:addressId", deleteAddress);

export default router; 