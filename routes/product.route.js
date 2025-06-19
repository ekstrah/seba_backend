import express from "express";
import {
	createFarmerProduct,
	deleteProduct,
	getFarmerProducts,
	getMyProducts,
	getProductById,
	oFind,
	oGetAll,
} from "../controllers/product.controller.js";
import { verifyProductOwnership } from "../middleware/product.middleware.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/", oGetAll);
router.get("/search", oFind);
router.get("/:id", getProductById);

// Protected routes (require authentication)
router.use(verifyToken);

// Farmer routes
router.post("/farmer", createFarmerProduct);
router.get("/farmer/:farmerId", getFarmerProducts);
router.get("/my-products", getMyProducts);

// Product ID specific routes (require product ownership verification)
router.delete("/:productId", verifyProductOwnership, deleteProduct);

export default router;
