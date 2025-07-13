import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { sendOrderConfirmationEmail } from './email.controller.js';
import stripe from '../utils/stripe.js';
import { Consumer } from '../models/consumer.model.js';
import logger from "../utils/logger.js";

// Get all orders (with pagination)
export const getAllOrders = async (req, res) => {
	try {
		const page = Number.parseInt(req.query.page) || 1;
		const limit = Number.parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const orders = await Order.find()
			.populate([
				{ path: "orderItems.products.product" },
				{ path: "orderItems.farmer" },
				{ path: "shippingAddress" },
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
		logger.error("Error in getAllOrders:", error);
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
			{ path: "orderItems.products.product" },
			{ path: "orderItems.farmer" },
			{ path: "shippingAddress" },
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
		logger.error("Error in getOrderById:", error);
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
		logger.error("Error in updateOrderStatus:", error);
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
		logger.error("Error in updatePaymentStatus:", error);
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
				{ path: "orderItems.products.product" },
				{ path: "orderItems.farmer" },
				{ path: "shippingAddress" },
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
		logger.error("Error in getOrdersByConsumer:", error);
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
		logger.error("Error in cancelOrder:", error);
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

		// Get cart with items and products
		const cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
		}).populate({
			path: "items.products.product items.farmer"
		});

		if (!cart || cart.items.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Cart is empty",
			});
		}

		// Find the consumer and get their Stripe customer ID
		const consumer = await Consumer.findById(req.userId);
		if (!consumer || !consumer.stripeCustomerId) {
			return res.status(404).json({ success: false, message: "Consumer or Stripe customer not found" });
		}

		// Create a PaymentIntent with Stripe
		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(cart.totalAmount * 100), // amount in cents
			currency: 'eur',
			customer: consumer.stripeCustomerId,
			payment_method: paymentMethodId,
			off_session: false,
			confirm: true,
			automatic_payment_methods: {
				enabled: true,
				allow_redirects: 'never'
			},
			metadata: {
				consumerId: consumer._id.toString(),
			},
		});

		// Fetch payment method details from Stripe for snapshot
		const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

		// Create order and embed order items from cart
		const order = new Order({
			consumer: req.userId,
			totalAmount: cart.totalAmount,
			shippingAddress: shippingAddressId,
			status: "pending",
			paymentStatus: "pending",
			orderItems: cart.items.map(cartItem => ({
				farmer: cartItem.farmer?._id || cartItem.farmer,
				products: cartItem.products.map(p => ({
					product: p.product._id || p.product,
					quantity: p.quantity,
					unitPrice: p.unitPrice,
					subtotal: p.subtotal,
				})),
				subtotal: cartItem.subtotal,
				status: "pending",
			})),
			paymentDetails: {
				transactionId: paymentIntent.id,
				status: paymentIntent.status,
				paymentMethodSnapshot: paymentMethod && paymentMethod.card ? {
					type: paymentMethod.type,
					processor: 'stripe',
					processorToken: paymentMethod.id,
					displayInfo: {
						lastFourDigits: paymentMethod.card.last4,
						cardType: paymentMethod.card.brand,
						expiryMonth: paymentMethod.card.exp_month,
						expiryYear: paymentMethod.card.exp_year,
					},
				} : undefined,
			},
		});

		// Check all products for availability and update stock
		for (const cartItem of cart.items) {
			for (const p of cartItem.products) {
				const dbProduct = await Product.findById(p.product._id || p.product);
				if (!dbProduct || dbProduct.quantity < p.quantity) {
					return res.status(400).json({
						success: false,
						message: `Insufficient quantity for product: ${dbProduct ? dbProduct.name : p.product._id || p.product}`,
					});
				}
			}
		}
		for (const cartItem of cart.items) {
			for (const p of cartItem.products) {
				const dbProduct = await Product.findById(p.product._id || p.product);
				dbProduct.quantity -= p.quantity;
				await dbProduct.save();
			}
		}

		await order.save();

		// Delete cart
		await Cart.findByIdAndDelete(cart._id);

		// Populate order details (including product image, name, and farmName)
		await order.populate([
			{
				path: "orderItems.products.product",
					select: "name imagePath measurement farmer",
					populate: { path: "farmer", select: "farmName" }
			},
			{ path: "orderItems.farmer" },
			{ path: "shippingAddress" },
		]);

		// Add debug log before sending order confirmation email
		await sendOrderConfirmationEmail(
			consumer.email,
			consumer.name,
			order
		);
		res.status(201).json({
			success: true,
			message: "Order created and payment initiated",
			order,
			paymentIntentStatus: paymentIntent.status,
		});
	} catch (error) {
		logger.error("Error in createOrderFromCart:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get orders by farmer
export const getOrdersByFarmer = async (req, res) => {
	try {
		logger.info("Farmer ID from token:", req.userId);

		const page = Number.parseInt(req.query.page) || 1;
		const limit = Number.parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		// Find orders that contain order items belonging to this farmer
		const orders = await Order.find({
			"orderItems.farmer": req.userId
		})
		.populate([
			{
				path: "orderItems.products.product",
				select: "name imagePath measurement price"
			},
			{
				path: "consumer",
				select: "name email phone role",
				model: "User",
			},
			{ path: "shippingAddress" },
		])
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit);

		// Filter order items to only include those belonging to this farmer
		orders.forEach(order => {
			order.orderItems = order.orderItems.filter(item => 
				item.farmer.toString() === req.userId
			);
		});

		// Remove orders that have no order items after filtering
		const filteredOrders = orders.filter(order => order.orderItems.length > 0);

		// Get total count for pagination
		const totalResult = await Order.aggregate([
			{
				$match: {
					"orderItems.farmer": req.userId
				}
			},
			{
				$unwind: "$orderItems"
			},
			{
				$match: {
					"orderItems.farmer": req.userId
				}
			},
			{
				$group: {
					_id: "$_id"
				}
			},
			{
				$count: "total"
			}
		]);

		const total = totalResult.length > 0 ? totalResult[0].total : 0;

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
		logger.error("Error in getOrdersByFarmer:", error);
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

		// Find the order that contains this order item
		const order = await Order.findOne({
			"orderItems._id": orderItemId
		}).populate("orderItems.products.product");

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order item not found",
			});
		}

		// Find the specific order item
		const orderItem = order.orderItems.find(item => item._id.toString() === orderItemId);

		if (!orderItem) {
			return res.status(404).json({
				success: false,
				message: "Order item not found",
			});
		}

		// Verify the product belongs to this farmer
		const product = orderItem.products[0]?.product;
		if (!product || product.farmer.toString() !== req.userId) {
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

		// Update the status of the specific order item
		orderItem.status = status;
		await order.save();

		// If all items in the order are delivered, update order status
		if (status === "delivered") {
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
		logger.error("Error in updateOrderItemStatus:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// Create guest order
export const createGuestOrder = async (req, res) => {
	try {
		logger.info("createGuestOrder request body:", req.body); // Log the incoming request body
		const { cartItems, shippingAddress, contactInfo, notes, payment } = req.body;
		if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
			logger.info("Missing or invalid cartItems");
			return res.status(400).json({ success: false, message: "Cart items are required" });
		}
		if (!shippingAddress || !contactInfo) {
			logger.info("Missing shippingAddress or contactInfo");
			return res.status(400).json({ success: false, message: "Shipping address and contact info are required" });
		}
		if (!contactInfo.name || !contactInfo.email) {
			logger.info("Missing guest name or email");
			return res.status(400).json({ success: false, message: "Name and email are required for guest checkout" });
		}
		// Check product availability and calculate total
		let totalAmount = 0;
		for (const item of cartItems) {
			const product = await Product.findById(item.productId);
			if (!product || product.quantity < item.quantity) {
				return res.status(400).json({ success: false, message: `Insufficient quantity for product: ${product ? product.name : item.productId}` });
			}
			totalAmount += (item.unitPrice || product.price) * item.quantity;
		}
		// Create guest address document
		const { street, city, state, zipCode, country, addressType, additionalInfo } = shippingAddress;
		const guestAddress = new (await import('../models/address.model.js')).Address({
			street,
			city,
			state,
			zipCode,
			country,
			addressType,
			additionalInfo,
			isGuest: true,
		});
		await guestAddress.save();
		// Create order (no consumer field yet, and no orderItems yet)
		const order = new Order({
			orderItems: [],
			totalAmount,
			shippingAddress: guestAddress._id,
			contactInfo,
			notes,
			payment, // Store the payment object for demo
			status: "pending",
			paymentStatus: "pending",
			isGuest: true,
		});
		await order.save();
		// Create order items, linking to the order
		for (const item of cartItems) {
			const product = await Product.findById(item.productId);
			if (!product || product.quantity < item.quantity) {
				return res.status(400).json({ success: false, message: `Insufficient quantity for product: ${product ? product.name : item.productId}` });
			}
			order.orderItems.push({
				farmer: product.farmer,
				products: [{
					product: item.productId,
					quantity: item.quantity,
					unitPrice: item.unitPrice || product.price,
					subtotal: (item.unitPrice || product.price) * item.quantity,
				}],
				subtotal: (item.unitPrice || product.price) * item.quantity,
				status: "pending",
			});
			// Update product quantity
			product.quantity -= item.quantity;
			await product.save();
		}
		await order.save();
		await order.populate([
			{
				path: "orderItems",
				populate: {
					path: "products.product",
					select: "name imagePath measurement farmer",
					populate: { path: "farmer", select: "farmName" }
				}
			},
			{ path: "shippingAddress" },
		]);

		// Add debug log before sending order confirmation email
		await sendOrderConfirmationEmail(
			contactInfo.email,
			contactInfo.name,
			order
		);

		logger.info("Guest order created successfully:", order);
		res.status(201).json({
			success: true,
			message: "Order placed successfully as guest!",
			order,
		});
	} catch (error) {
		if (error.name === 'ValidationError' || error.code === 11000) {
			logger.error("Validation error in createGuestOrder:", error);
			return res.status(400).json({ success: false, message: error.message, error });
		}
		logger.error("Error in createGuestOrder:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// Guest payment intent for guest checkout
export const guestPaymentIntent = async (req, res) => {
	try {
		const { amount, currency = 'eur' } = req.body;
		if (!amount || isNaN(amount) || amount <= 0) {
			return res.status(400).json({ error: 'Valid amount is required' });
		}
		const paymentIntent = await stripe.paymentIntents.create({
			amount,
			currency,
			automatic_payment_methods: { enabled: true },
		});
		res.json({ clientSecret: paymentIntent.client_secret });
	} catch (err) {
		logger.error('Error in guestPaymentIntent:', err);
		res.status(500).json({ error: err.message });
	}
};
