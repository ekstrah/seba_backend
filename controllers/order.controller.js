import { Order } from "../models/order.model.js";
import { OrderItem } from "../models/orderItem.model.js";

// Create a new order
export const createOrder = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            notes
        } = req.body;

        // Validate required fields
        if (!orderItems || !shippingAddress || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: "Order items, shipping address, and payment method are required"
            });
        }

        // Calculate total amount from order items
        const orderItemsData = await OrderItem.find({ _id: { $in: orderItems } });
        const totalAmount = orderItemsData.reduce((sum, item) => sum + item.subtotal, 0);

        // Create new order
        const order = new Order({
            consumer: req.userId, // From auth middleware
            orderItems,
            totalAmount,
            shippingAddress,
            paymentMethod,
            notes
        });

        await order.save();

        // Populate order details
        await order.populate([
            { path: 'orderItems', populate: { path: 'product' } },
            { path: 'paymentMethod' }
        ]);

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order
        });
    } catch (error) {
        console.error("Error in createOrder:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get all orders (with pagination)
export const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find()
            .populate([
                { path: 'orderItems', populate: { path: 'product' } },
                { path: 'paymentMethod' }
            ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments();

        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully",
            orders,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error in getAllOrders:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate([
                { path: 'orderItems', populate: { path: 'product' } },
                { path: 'paymentMethod' }
            ]);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Order retrieved successfully",
            order
        });
    } catch (error) {
        console.error("Error in getOrderById:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order
        });
    } catch (error) {
        console.error("Error in updateOrderStatus:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, paymentDetails } = req.body;

        if (!paymentStatus) {
            return res.status(400).json({
                success: false,
                message: "Payment status is required"
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        order.paymentStatus = paymentStatus;
        if (paymentDetails) {
            order.paymentDetails = {
                ...order.paymentDetails,
                ...paymentDetails
            };
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            order
        });
    } catch (error) {
        console.error("Error in updatePaymentStatus:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get orders by consumer
export const getOrdersByConsumer = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ consumer: req.userId })
            .populate([
                { path: 'orderItems', populate: { path: 'product' } },
                { path: 'paymentMethod' }
            ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments({ consumer: req.userId });

        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully",
            orders,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error in getOrdersByConsumer:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check if order can be cancelled
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Order cannot be cancelled"
            });
        }

        order.status = 'cancelled';
        order.paymentStatus = 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order
        });
    } catch (error) {
        console.error("Error in cancelOrder:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}; 