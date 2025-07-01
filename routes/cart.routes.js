import express from "express";
import {
	addToCart,
	clearCart,
	getOrCreateCart,
	removeFromCart,
	updateCartItem,
} from "../controllers/cart.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// All cart routes require authentication
router.use(verifyToken);

// Get or create cart
router.get("/", authorize('getOrCreateCart'), getOrCreateCart);

// Add item to cart
router.post("/items", authorize('addToCart'), addToCart);

// Update specific product in a cart item
router.put("/items/:cartItemId/product/:productId", authorize('updateCartItem'), updateCartItem);

// Remove specific product from a cart item
router.delete("/items/:cartItemId/product/:productId", authorize('removeFromCart'), removeFromCart);

// Update cart item quantity
router.put("/items/:cartItemId", authorize('updateCartItem'), updateCartItem);

// Remove item from cart
router.delete("/items/:cartItemId", authorize('removeFromCart'), removeFromCart);

// Clear cart
router.delete("/", authorize('clearCart'), clearCart);

export default router;
