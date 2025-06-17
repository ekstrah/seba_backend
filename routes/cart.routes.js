import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
	getOrCreateCart,
	addToCart,
	updateCartItem,
	removeFromCart,
	clearCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

// All cart routes require authentication
router.use(verifyToken);

// Get or create cart
router.get("/", getOrCreateCart);

// Add item to cart
router.post("/items", addToCart);

// Update cart item quantity
router.put("/items/:cartItemId", updateCartItem);

// Remove item from cart
router.delete("/items/:cartItemId", removeFromCart);

// Clear cart
router.delete("/", clearCart);

export default router;
