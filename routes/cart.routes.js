import express from "express";
import {
	addToCart,
	clearCart,
	getOrCreateCart,
	removeFromCart,
	updateCartItem,
} from "../controllers/cart.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// All cart routes require authentication
router.use(verifyToken);

// Get or create cart
router.get("/", getOrCreateCart);

// Add item to cart
router.post("/items", addToCart);

// Update specific product in a cart item
router.put("/items/:cartItemId/product/:productId", updateCartItem);

// Remove specific product from a cart item
router.delete("/items/:cartItemId/product/:productId", removeFromCart);

// Update cart item quantity
router.put("/items/:cartItemId", updateCartItem);

// Remove item from cart
router.delete("/items/:cartItemId", removeFromCart);

// Clear cart
router.delete("/", clearCart);

export default router;
