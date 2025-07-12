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
	updateProduct,
} from "../controllers/product.controller.js";
import { verifyProductOwnership } from "../middleware/product.middleware.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorize } from '../middleware/authorize.js';
import { Category } from "../models/category.model.js";

const router = express.Router();

// Public routes
router.get("/", authorize('getAllProducts'), oGetAll);
router.get("/search", authorize('getAllProducts'), oFind);
router.get("/:productId/related", authorize('getRelatedProducts'), getRelatedProducts);
router.get("/:id", authorize('getProductById'), getProductById);
router.get("/categories", authorize('readAllCategories'), async (req, res) => {
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
router.post("/farmer/create-product", authorize('createProduct'), createFarmerProduct);
router.get("/farmer/:farmerId", authorize('getFarmerProducts'), getFarmerProducts);
router.get("/my-products", authorize('getMyProducts'), getMyProducts); // Not being used

// Product ID specific routes (require product ownership verification)
router.delete("/:productId", verifyProductOwnership, authorize('deleteProduct'), deleteProduct);
router.put("/:productId", verifyProductOwnership, authorize('updateProduct'), updateProduct)
export default router;
