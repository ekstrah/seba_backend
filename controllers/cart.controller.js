import { Cart } from "../models/cart.model.js";
import { CartItem } from "../models/cartItem.model.js";
import { Product } from "../models/product.model.js";

// Get or create cart for consumer
export const getOrCreateCart = async (req, res) => {
	try {
		let cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
		}).populate({
			path: "items",
			populate: [{ path: "product" }, { path: "farmer" }],
		});

		if (!cart) {
			cart = new Cart({
				consumer: req.userId,
				items: [],
				totalAmount: 0,
			});
			await cart.save();
		}

		// Calculate totals by farmer
		const farmerTotals = cart.items.reduce((totals, item) => {
			const farmerId = item.farmer._id.toString();
			if (!totals[farmerId]) {
				totals[farmerId] = {
					farmer: item.farmer,
					totalAmount: 0,
					itemCount: 0,
				};
			}
			totals[farmerId].totalAmount += item.subtotal;
			totals[farmerId].itemCount += item.quantity;
			return totals;
		}, {});

		res.status(200).json({
			success: true,
			message: "Cart retrieved successfully",
			cart: {
				...cart.toObject(),
				farmerTotals: Object.values(farmerTotals),
			},
		});
	} catch (error) {
		console.error("Error in getOrCreateCart:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Add item to cart
export const addToCart = async (req, res) => {
	try {
		const { productId, quantity } = req.body;

		if (!productId || !quantity) {
			return res.status(400).json({
				success: false,
				message: "Product ID and quantity are required",
			});
		}

		// Get or create cart
		let cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
		});

		if (!cart) {
			cart = new Cart({
				consumer: req.userId,
				items: [],
				totalAmount: 0,
			});
		}

		// Check if product exists
		const product = await Product.findById(productId).populate("farmer");
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Convert product price from string to number
		const unitPrice = Number.parseFloat(product.price);
		if (isNaN(unitPrice)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product price",
			});
		}

		// Check if item already exists in cart
		const existingCartItem = await CartItem.findOne({
			_id: { $in: cart.items },
			product: productId,
			farmer: product.farmer._id,
		});

		let cartItem;
		if (existingCartItem) {
			// Update existing cart item
			existingCartItem.quantity += quantity;
			existingCartItem.unitPrice = unitPrice; // Update price in case it changed
			existingCartItem.subtotal = existingCartItem.quantity * unitPrice; // Calculate subtotal
			await existingCartItem.save();
			cartItem = existingCartItem;
		} else {
			// Create new cart item
			cartItem = new CartItem({
				product: productId,
				farmer: product.farmer._id,
				quantity,
				unitPrice,
				subtotal: quantity * unitPrice, // Calculate initial subtotal
			});
			await cartItem.save();
			cart.items.push(cartItem._id);
		}

		// Update cart total
		cart.totalAmount = (
			await CartItem.find({ _id: { $in: cart.items } })
		).reduce((sum, item) => sum + item.subtotal, 0);
		await cart.save();

		// Populate cart details
		await cart.populate({
			path: "items",
			populate: [{ path: "product" }, { path: "farmer" }],
		});

		// Calculate totals by farmer
		const farmerTotals = cart.items.reduce((totals, item) => {
			const farmerId = item.farmer._id.toString();
			if (!totals[farmerId]) {
				totals[farmerId] = {
					farmer: item.farmer,
					totalAmount: 0,
					itemCount: 0,
				};
			}
			totals[farmerId].totalAmount += item.subtotal;
			totals[farmerId].itemCount += item.quantity;
			return totals;
		}, {});

		res.status(200).json({
			success: true,
			message: existingCartItem
				? "Cart item quantity updated"
				: "Item added to cart successfully",
			cart: {
				...cart.toObject(),
				farmerTotals: Object.values(farmerTotals),
			},
		});
	} catch (error) {
		console.error("Error in addToCart:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
	try {
		const { cartItemId } = req.params;
		const { quantity } = req.body;

		if (!quantity) {
			return res.status(400).json({
				success: false,
				message: "Quantity is required",
			});
		}

		const cartItem = await CartItem.findById(cartItemId);
		if (!cartItem) {
			return res.status(404).json({
				success: false,
				message: "Cart item not found",
			});
		}

		// Calculate the difference in subtotal
		const oldSubtotal = cartItem.subtotal;
		cartItem.quantity = quantity;
		await cartItem.save();
		const newSubtotal = cartItem.subtotal;
		const subtotalDifference = newSubtotal - oldSubtotal;

		// Update cart total
		const cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
			items: cartItemId,
		});

		if (cart) {
			cart.totalAmount += subtotalDifference;
			await cart.save();
		}

		res.status(200).json({
			success: true,
			message: "Cart item updated successfully",
			cartItem,
		});
	} catch (error) {
		console.error("Error in updateCartItem:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
	try {
		const { cartItemId } = req.params;
		const quantity = req.body?.quantity || 1; // Default to 1 if not specified

		const cartItem = await CartItem.findById(cartItemId);
		if (!cartItem) {
			return res.status(404).json({
				success: false,
				message: "Cart item not found",
			});
		}

		const cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
			items: cartItemId,
		});

		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
			});
		}

		// If quantity to remove is less than current quantity, reduce it
		if (quantity < cartItem.quantity) {
			// Remove specific quantity
			const oldSubtotal = cartItem.subtotal;
			cartItem.quantity -= quantity;
			cartItem.subtotal = cartItem.quantity * cartItem.unitPrice;
			await cartItem.save();

			// Update cart total
			cart.totalAmount -= oldSubtotal - cartItem.subtotal;
			await cart.save();

			// Populate cart details
			await cart.populate({
				path: "items",
				populate: [{ path: "product" }, { path: "farmer" }],
			});

			// Calculate totals by farmer
			const farmerTotals = cart.items.reduce((totals, item) => {
				const farmerId = item.farmer._id.toString();
				if (!totals[farmerId]) {
					totals[farmerId] = {
						farmer: item.farmer,
						totalAmount: 0,
						itemCount: 0,
					};
				}
				totals[farmerId].totalAmount += item.subtotal;
				totals[farmerId].itemCount += item.quantity;
				return totals;
			}, {});

			return res.status(200).json({
				success: true,
				message: "Quantity reduced successfully",
				cart: {
					...cart.toObject(),
					farmerTotals: Object.values(farmerTotals),
				},
			});
		}

		// If quantity to remove is equal to or greater than current quantity, remove the entire item
		cart.items = cart.items.filter((item) => item.toString() !== cartItemId);
		cart.totalAmount -= cartItem.subtotal;
		await cart.save();

		// Delete cart item
		await CartItem.findByIdAndDelete(cartItemId);

		// Populate cart details
		await cart.populate({
			path: "items",
			populate: [{ path: "product" }, { path: "farmer" }],
		});

		// Calculate totals by farmer
		const farmerTotals = cart.items.reduce((totals, item) => {
			const farmerId = item.farmer._id.toString();
			if (!totals[farmerId]) {
				totals[farmerId] = {
					farmer: item.farmer,
					totalAmount: 0,
					itemCount: 0,
				};
			}
			totals[farmerId].totalAmount += item.subtotal;
			totals[farmerId].itemCount += item.quantity;
			return totals;
		}, {});

		res.status(200).json({
			success: true,
			message: "Item removed from cart successfully",
			cart: {
				...cart.toObject(),
				farmerTotals: Object.values(farmerTotals),
			},
		});
	} catch (error) {
		console.error("Error in removeFromCart:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Clear cart
export const clearCart = async (req, res) => {
	try {
		const cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
		});

		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
			});
		}

		// Delete all cart items
		await CartItem.deleteMany({ _id: { $in: cart.items } });

		// Reset cart
		cart.items = [];
		cart.totalAmount = 0;
		await cart.save();

		res.status(200).json({
			success: true,
			message: "Cart cleared successfully",
			cart,
		});
	} catch (error) {
		console.error("Error in clearCart:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};
