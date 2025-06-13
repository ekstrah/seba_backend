import express from "express";
import { 
    createFarmerProduct, 
    getFarmerProducts, 
    getMyProducts,
    deleteProduct 
} from "../controllers/product.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new product (farmer only)
router.post("/farmer", authenticateToken, createFarmerProduct);

// Get all products for a specific farmer
router.get("/farmer/:farmerId", getFarmerProducts);

// Get products for the authenticated farmer
router.get("/my-products", authenticateToken, getMyProducts);

// Delete a product (farmer only, and only their own products)
router.delete("/:productId", authenticateToken, deleteProduct);

export default router;