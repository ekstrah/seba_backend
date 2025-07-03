import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import logger from "../utils/logger.js";

// Get or create cart for consumer
export const getOrCreateCart = async (req, res) => {
	try {
		let cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
		}).populate({
			path: "items.products.product items.farmer"
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
			const farmerId = item.farmer.toString();
			if (!totals[farmerId]) {
				totals[farmerId] = {
					farmer: item.farmer,
					totalAmount: 0,
					itemCount: 0,
				};
			}
			totals[farmerId].totalAmount += item.subtotal;
			totals[farmerId].itemCount += item.products.reduce((sum, p) => sum + p.quantity, 0);
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
		logger.error("Error in getOrCreateCart:", error);
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

		const unitPrice = Number.parseFloat(product.price);
		if (Number.isNaN(unitPrice)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product price",
			});
		}

		// Find item for this farmer in the cart
		let cartItem = cart.items.find(item => item.farmer.toString() === product.farmer._id.toString());
		let productInCart = null;
		if (cartItem) {
			// Check if product already exists in products array
			productInCart = cartItem.products.find(p => p.product.toString() === productId);
			if (productInCart) {
				// Update quantity and subtotal
				productInCart.quantity += quantity;
				productInCart.unitPrice = unitPrice;
				productInCart.subtotal = productInCart.quantity * unitPrice;
			} else {
				// Add new product to products array
				cartItem.products.push({
					product: productId,
					quantity,
					unitPrice,
					subtotal: quantity * unitPrice,
				});
			}
			// Update item subtotal
			cartItem.subtotal = cartItem.products.reduce((sum, p) => sum + p.subtotal, 0);
		} else {
			// Create new item for this farmer
			cartItem = {
				farmer: product.farmer._id,
				products: [{
					product: productId,
					quantity,
					unitPrice,
					subtotal: quantity * unitPrice,
				}],
				subtotal: quantity * unitPrice,
			};
			cart.items.push(cartItem);
		}

		await cart.save();
		await cart.populate({ path: "items.products.product items.farmer" });

		// Calculate totals by farmer
		const farmerTotals = cart.items.reduce((totals, item) => {
			const farmerId = item.farmer.toString();
			if (!totals[farmerId]) {
				totals[farmerId] = {
					farmer: item.farmer,
					totalAmount: 0,
					itemCount: 0,
				};
			}
			totals[farmerId].totalAmount += item.subtotal;
			totals[farmerId].itemCount += item.products.reduce((sum, p) => sum + p.quantity, 0);
			return totals;
		}, {});

		res.status(200).json({
			success: true,
			message: productInCart
				? "Cart item quantity updated"
				: "Item added to cart successfully",
			cart: {
				...cart.toObject(),
				farmerTotals: Object.values(farmerTotals),
			},
		});
	} catch (error) {
		logger.error("Error in addToCart:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Update cart item quantity (for a specific product in a farmer group)
export const updateCartItem = async (req, res) => {
	try {
		const { cartItemId, productId } = req.params;
		const { quantity } = req.body;

		if (!quantity) {
			return res.status(400).json({
				success: false,
				message: "Quantity is required",
			});
		}

		let cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
		});
		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
			});
		}

		const cartItem = cart.items.id(cartItemId) || cart.items.find(item => item._id?.toString() === cartItemId);
		if (!cartItem) {
			return res.status(404).json({
				success: false,
				message: "Cart item not found",
			});
		}

		const productInCart = cartItem.products.find(p => p.product.toString() === productId);
		if (!productInCart) {
			return res.status(404).json({
				success: false,
				message: "Product not found in cart item",
			});
		}

		productInCart.quantity = quantity;
		productInCart.subtotal = productInCart.quantity * productInCart.unitPrice;
		cartItem.subtotal = cartItem.products.reduce((sum, p) => sum + p.subtotal, 0);
			await cart.save();
		await cart.populate({ path: "items.products.product items.farmer" });

		res.status(200).json({
			success: true,
			message: "Cart item updated successfully",
			cart,
		});
	} catch (error) {
		logger.error("Error in updateCartItem:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Remove product from cart (from a farmer group)
export const removeFromCart = async (req, res) => {
	try {
		const { cartItemId, productId } = req.params;
		const quantity = req.body?.quantity;

		let cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
		});
		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
			});
		}

		const cartItem = cart.items.id(cartItemId) || cart.items.find(item => item._id?.toString() === cartItemId);
		if (!cartItem) {
			return res.status(404).json({
				success: false,
				message: "Cart item not found",
			});
		}

		const productIndex = cartItem.products.findIndex(p => p.product.toString() === productId);
		if (productIndex === -1) {
			return res.status(404).json({
				success: false,
				message: "Product not found in cart item",
			});
		}

		const productInCart = cartItem.products[productIndex];

		if (quantity && quantity < productInCart.quantity) {
			productInCart.quantity -= quantity;
			productInCart.subtotal = productInCart.quantity * productInCart.unitPrice;
		} else {
			cartItem.products.splice(productIndex, 1);
		}

		// If products array is empty, remove the cart item (farmer group)
		if (cartItem.products.length === 0) {
			cart.items = cart.items.filter(item => item !== cartItem && item._id?.toString() !== cartItemId);
		}

		await cart.save();
		await cart.populate({ path: "items.products.product items.farmer" });

		res.status(200).json({
			success: true,
			message: "Product removed from cart successfully",
			cart,
		});
	} catch (error) {
		logger.error("Error in removeFromCart:", error);
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

		cart.items = [];
		cart.totalAmount = 0;
		await cart.save();

		res.status(200).json({
			success: true,
			message: "Cart cleared successfully",
			cart,
		});
	} catch (error) {
		logger.error("Error in clearCart:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};
