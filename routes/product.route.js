import express from "express";
import {
	createFarmerProduct,
	deleteProduct,
	getFarmerProducts,
	getMyProducts,
	getProductById,
	oFind,
	oGetAll,
	getRelatedProducts,
} from "../controllers/product.controller.js";
import { verifyProductOwnership } from "../middleware/product.middleware.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { Category } from "../models/category.model.js";

const router = express.Router();

// Public routes
router.get("/", oGetAll);
router.get("/search", oFind);
router.get("/:productId/related", getRelatedProducts);
router.get("/:id", getProductById);
router.get("/categories", async (req, res) => {
	try {
		const categories = await Category.find();
		res.status(200).json(categories);
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// Protected routes (require authentication)
router.use(verifyToken);

// Farmer routes
router.post("/farmer", createFarmerProduct);
router.get("/farmer/:farmerId", getFarmerProducts);
router.get("/my-products", getMyProducts);

// Product ID specific routes (require product ownership verification)
router.delete("/:productId", verifyProductOwnership, deleteProduct);

export default router;
