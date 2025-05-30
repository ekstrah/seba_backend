import express from "express";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    getOrdersByConsumer,
    cancelOrder
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create new order
router.post("/", createOrder);

// Get all orders (admin only)
router.get("/", getAllOrders);

// Get order by ID
router.get("/:id", getOrderById);

// Update order status
router.patch("/:id/status", updateOrderStatus);

// Update payment status
router.patch("/:id/payment", updatePaymentStatus);

// Get orders by consumer
router.get("/consumer/orders", getOrdersByConsumer);

// Cancel order
router.post("/:id/cancel", cancelOrder);

export default router; 