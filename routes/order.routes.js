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
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Guest payment intent for guest checkout (should be before verifyToken)
router.post("/guest/payment-intent", authorize('guestPaymentIntent'), guestPaymentIntent);

// Guest order creation for guest checkout (should be before verifyToken)
router.post("/guest", authorize('createGuestOrder'), createGuestOrder);

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all orders (admin only)
router.get("/", authorize('getAllOrders'), getAllOrders);

// Get orders by consumer
router.get("/my-orders", authorize('getOrdersByConsumer'), getOrdersByConsumer);

// Get orders by farmer
router.get("/farmer-orders", authorize('getOrdersByFarmer'), getOrdersByFarmer);

// Get order by ID
router.get("/:id", authorize('getOrderById'), getOrderById);

// Create order from cart
router.post("/from-cart", authorize('createOrderFromCart'), createOrderFromCart);

// Update order status
router.patch("/:id/status", authorize('updateOrderStatus'), updateOrderStatus);

// Update payment status
router.patch("/:id/payment", authorize('updatePaymentStatus'), updatePaymentStatus);

// Cancel order
router.post("/:id/cancel", authorize('cancelOrder'), cancelOrder);

// Update order item status
router.patch("/items/:orderItemId/status", authorize('updateOrderItemStatus'), updateOrderItemStatus);

export default router;
