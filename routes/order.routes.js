import express from "express";
import {
	cancelOrder,
	createOrderFromCart,
	getAllOrders,
	getOrderById,
	getOrdersByConsumer,
	getOrdersByFarmer,
	updateOrderItemStatus,
	updateOrderStatus,
	updatePaymentStatus,
	createGuestOrder,
	guestPaymentIntent,
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();


// Guest payment intent for guest checkout (should be before verifyToken)
router.post("/guest/payment-intent", guestPaymentIntent);

// Guest order creation for guest checkout (should be before verifyToken)
router.post("/guest", createGuestOrder);

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all orders (admin only)
router.get("/", getAllOrders);

// Get orders by consumer
router.get("/my-orders", getOrdersByConsumer);

// Get orders by farmer
router.get("/farmer-orders", getOrdersByFarmer);

// Get order by ID
router.get("/:id", getOrderById);

// Create order from cart
router.post("/from-cart", createOrderFromCart);

// Update order status
router.patch("/:id/status", updateOrderStatus);

// Update payment status
router.patch("/:id/payment", updatePaymentStatus);

// Cancel order
router.post("/:id/cancel", cancelOrder);

// Update order item status
router.patch("/items/:orderItemId/status", updateOrderItemStatus);

export default router;
