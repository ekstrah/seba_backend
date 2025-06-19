import { Cart } from "../models/cart.model.js";
import { CartItem } from "../models/cartItem.model.js";
import { Order } from "../models/order.model.js";
import { OrderItem } from "../models/orderItem.model.js";
import { PaymentMethod } from "../models/paymentMethod.model.js";
import { Product } from "../models/product.model.js";

// Create a new order
export const createOrder = async (req, res) => {
	try {
		const { orderItems, shippingAddress, paymentMethod, notes } = req.body;

		// Validate required fields
		if (!orderItems || !shippingAddress || !paymentMethod) {
			return res.status(400).json({
				success: false,
				message:
					"Order items, shipping address, and payment method are required",
			});
		}

		// Calculate total amount from order items
		const orderItemsData = await OrderItem.find({ _id: { $in: orderItems } });
		const totalAmount = orderItemsData.reduce(
			(sum, item) => sum + item.subtotal,
			0,
		);

		// Create new order
		const order = new Order({
			consumer: req.userId, // From auth middleware
			orderItems,
			totalAmount,
			shippingAddress,
			paymentMethod,
			notes,
		});

		await order.save();

		// Populate order details
		await order.populate([
			{ path: "orderItems", populate: { path: "product" } },
			{ path: "paymentMethod" },
		]);

		res.status(201).json({
			success: true,
			message: "Order created successfully",
			order,
		});
	} catch (error) {
		console.error("Error in createOrder:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Get all orders (with pagination)
export const getAllOrders = async (req, res) => {
	try {
		const page = Number.parseInt(req.query.page) || 1;
		const limit = Number.parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const orders = await Order.find()
			.populate([
				{ path: "orderItems", populate: { path: "product" } },
				{ path: "paymentMethod" },
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
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error in getAllOrders:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Get order by ID
export const getOrderById = async (req, res) => {
	try {
		const { id } = req.params;

		const order = await Order.findById(id).populate([
			{ path: "orderItems", populate: { path: "product" } },
			{ path: "paymentMethod" },
		]);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		res.status(200).json({
			success: true,
			message: "Order retrieved successfully",
			order,
		});
	} catch (error) {
		console.error("Error in getOrderById:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
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
				message: "Status is required",
			});
		}

		const order = await Order.findById(id);
		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		order.status = status;
		await order.save();

		res.status(200).json({
			success: true,
			message: "Order status updated successfully",
			order,
		});
	} catch (error) {
		console.error("Error in updateOrderStatus:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
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
				message: "Payment status is required",
			});
		}

		const order = await Order.findById(id);
		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		order.paymentStatus = paymentStatus;
		if (paymentDetails) {
			order.paymentDetails = {
				...order.paymentDetails,
				...paymentDetails,
			};
		}

		await order.save();

		res.status(200).json({
			success: true,
			message: "Payment status updated successfully",
			order,
		});
	} catch (error) {
		console.error("Error in updatePaymentStatus:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Get orders by consumer
export const getOrdersByConsumer = async (req, res) => {
	try {
		const page = Number.parseInt(req.query.page) || 1;
		const limit = Number.parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const orders = await Order.find({ consumer: req.userId })
			.populate([
				{ path: "orderItems", populate: { path: "product" } },
				{ path: "paymentMethod" },
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
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error in getOrdersByConsumer:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
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
				message: "Order not found",
			});
		}

		// Check if order can be cancelled
		if (order.status === "delivered" || order.status === "cancelled") {
			return res.status(400).json({
				success: false,
				message: "Order cannot be cancelled",
			});
		}

		order.status = "cancelled";
		order.paymentStatus = "cancelled";
		await order.save();

		res.status(200).json({
			success: true,
			message: "Order cancelled successfully",
			order,
		});
	} catch (error) {
		console.error("Error in cancelOrder:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Create order from cart
export const createOrderFromCart = async (req, res) => {
	try {
		const { paymentMethodId, shippingAddressId } = req.body;

		if (!paymentMethodId || !shippingAddressId) {
			return res.status(400).json({
				success: false,
				message: "Payment method and shipping address are required",
			});
		}

		// Get cart with items
		const cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
		}).populate({
			path: "items",
			populate: [{ path: "product" }, { path: "farmer" }],
		});

		if (!cart || cart.items.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Cart is empty",
			});
		}

		// Verify payment method
		const paymentMethod = await PaymentMethod.findOne({
			_id: paymentMethodId,
			consumer: req.userId,
			isActive: true,
		});

		if (!paymentMethod) {
			return res.status(400).json({
				success: false,
				message: "Invalid payment method",
			});
		}

		// Create order first
		const order = new Order({
			consumer: req.userId,
			totalAmount: cart.totalAmount,
			shippingAddress: shippingAddressId,
			paymentMethod: paymentMethodId,
			status: "pending",
			paymentStatus: "pending",
			paymentDetails: {
				paymentMethodSnapshot: {
					type: paymentMethod.type,
					processor: paymentMethod.processor,
					processorToken: paymentMethod.processorToken,
					displayInfo: paymentMethod.displayInfo,
				},
			},
		});

		await order.save();

		// Create order items from cart items
		const orderItems = [];
		for (const cartItem of cart.items) {
			// Check product availability
			const product = await Product.findById(cartItem.product._id);
			if (!product || product.quantity < cartItem.quantity) {
				// If product is not available, delete the order and return error
				await Order.findByIdAndDelete(order._id);
				return res.status(400).json({
					success: false,
					message: `Insufficient quantity for product: ${product.name}`,
				});
			}

			// Create order item
			const orderItem = new OrderItem({
				order: order._id,
				product: cartItem.product._id,
				quantity: cartItem.quantity,
				unitPrice: cartItem.unitPrice,
				subtotal: cartItem.subtotal,
				farmer: product.farmer, // Set the farmer from the product
				status: "pending",
			});
			await orderItem.save();
			orderItems.push(orderItem._id);

			// Update product quantity
			product.quantity -= cartItem.quantity;
			await product.save();
		}

		// Update order with order items
		order.orderItems = orderItems;
		await order.save();

		// Clear cart
		await CartItem.deleteMany({ _id: { $in: cart.items } });
		cart.items = [];
		cart.totalAmount = 0;
		cart.status = "converted";
		await cart.save();

		// Populate order details
		await order.populate([
			{ path: "orderItems", populate: { path: "product" } },
			{ path: "shippingAddress" },
			{ path: "paymentMethod" },
		]);

		res.status(201).json({
			success: true,
			message: "Order created successfully",
			order,
		});
	} catch (error) {
		console.error("Error in createOrderFromCart:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Get orders by farmer
export const getOrdersByFarmer = async (req, res) => {
	try {
		console.log("Farmer ID from token:", req.userId);

		const page = Number.parseInt(req.query.page) || 1;
		const limit = Number.parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		// First, find all products belonging to this farmer
		const products = await Product.find({ farmer: req.userId });
		console.log("Found products for farmer:", products.length);

		if (products.length === 0) {
			return res.status(200).json({
				success: true,
				message: "No products found for this farmer",
				orders: [],
				pagination: {
					total: 0,
					page,
					pages: 0,
				},
			});
		}

		const productIds = products.map((product) => product._id);
		console.log("Product IDs:", productIds);

		// Find all order items that contain these products
		const orderItems = await OrderItem.find({
			product: { $in: productIds },
		});
		console.log("Found order items:", orderItems.length);

		if (orderItems.length === 0) {
			return res.status(200).json({
				success: true,
				message: "No orders found for farmer's products",
				orders: [],
				pagination: {
					total: 0,
					page,
					pages: 0,
				},
			});
		}

		// Get unique order IDs, filtering out any undefined values
		const orderIds = [
			...new Set(
				orderItems
					.map((item) => item.order)
					.filter((id) => id !== undefined && id !== null),
			),
		];
		console.log("Unique order IDs:", orderIds);

		if (orderIds.length === 0) {
			return res.status(200).json({
				success: true,
				message: "No valid orders found for farmer's products",
				orders: [],
				pagination: {
					total: 0,
					page,
					pages: 0,
				},
			});
		}

		// Get orders with pagination
		const orders = await Order.find({ _id: { $in: orderIds } })
			.populate([
				{
					path: "orderItems",
					populate: [
						{
							path: "product",
							match: { farmer: req.userId },
						},
					],
				},
				{
					path: "consumer",
					select: "name email phone role",
					model: "User",
				},
				{ path: "shippingAddress" },
				{ path: "paymentMethod" },
			])
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		console.log("Found orders:", orders.length);

		// Filter out orders where all products are null (from the match condition)
		const filteredOrders = orders.filter((order) =>
			order.orderItems.some((item) => item.product !== null),
		);
		console.log("Filtered orders:", filteredOrders.length);

		const total = await Order.countDocuments({ _id: { $in: orderIds } });

		res.status(200).json({
			success: true,
			message: "Orders retrieved successfully",
			orders: filteredOrders,
			pagination: {
				total,
				page,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error in getOrdersByFarmer:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// Update order item status
export const updateOrderItemStatus = async (req, res) => {
	try {
		const { orderItemId } = req.params;
		const { status } = req.body;

		if (!status) {
			return res.status(400).json({
				success: false,
				message: "Status is required",
			});
		}

		// Find the order item and verify it belongs to this farmer
		const orderItem = await OrderItem.findById(orderItemId).populate("product");

		if (!orderItem) {
			return res.status(404).json({
				success: false,
				message: "Order item not found",
			});
		}

		// Verify the product belongs to this farmer
		if (orderItem.product.farmer.toString() !== req.userId) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to update this order item",
			});
		}

		// Validate status transition
		const validTransitions = {
			pending: ["accepted", "cancelled"],
			accepted: ["sent", "cancelled"],
			sent: ["delivered", "cancelled"],
			delivered: [],
			cancelled: [],
		};

		if (!validTransitions[orderItem.status].includes(status)) {
			return res.status(400).json({
				success: false,
				message: `Cannot change status from ${orderItem.status} to ${status}`,
			});
		}

		// Update the status
		orderItem.status = status;
		await orderItem.save();

		// If all items in the order are delivered, update order status
		if (status === "delivered") {
			const order = await Order.findById(orderItem.order).populate(
				"orderItems",
			);

			const allItemsDelivered = order.orderItems.every(
				(item) => item.status === "delivered" || item.status === "cancelled",
			);

			if (allItemsDelivered) {
				order.status = "delivered";
				await order.save();
			}
		}

		res.status(200).json({
			success: true,
			message: "Order item status updated successfully",
			orderItem,
		});
	} catch (error) {
		console.error("Error in updateOrderItemStatus:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};
