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
			populate: [
				{ path: "products.product" },
				{ path: "farmer" }
			],
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

		const unitPrice = Number.parseFloat(product.price);
		if (Number.isNaN(unitPrice)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product price",
			});
		}

		// Find CartItem for this farmer in the cart
		let cartItem = await CartItem.findOne({
			_id: { $in: cart.items },
			farmer: product.farmer._id,
		});

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
			await cartItem.save();
		} else {
			// Create new CartItem for this farmer
			cartItem = new CartItem({
				farmer: product.farmer._id,
				products: [{
					product: productId,
					quantity,
					unitPrice,
					subtotal: quantity * unitPrice,
				}],
				subtotal: quantity * unitPrice,
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
			populate: [
				{ path: "products.product" },
				{ path: "farmer" }
			],
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
		console.error("Error in addToCart:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Update cart item quantity (for a specific product in a CartItem)
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

		const cartItem = await CartItem.findById(cartItemId);
		if (!cartItem) {
			return res.status(404).json({
				success: false,
				message: "Cart item not found",
			});
		}

		// Find the product in the products array
		const productInCart = cartItem.products.find(p => p.product.toString() === productId);
		if (!productInCart) {
			return res.status(404).json({
				success: false,
				message: "Product not found in cart item",
			});
		}

		// Update quantity and subtotal
		productInCart.quantity = quantity;
		productInCart.subtotal = productInCart.quantity * productInCart.unitPrice;
		await cartItem.save();

		// Update cartItem subtotal (handled by pre-save hook)
		await cartItem.save();

		// Update cart total
		const cart = await Cart.findOne({
			consumer: req.userId,
			status: "active",
			items: cartItemId,
		});
		if (cart) {
			cart.totalAmount = (
				await CartItem.find({ _id: { $in: cart.items } })
			).reduce((sum, item) => sum + item.subtotal, 0);
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

// Remove product from cart (from a CartItem's products array)
export const removeFromCart = async (req, res) => {
	try {
		const { cartItemId, productId } = req.params;
		const quantity = req.body?.quantity;

		const cartItem = await CartItem.findById(cartItemId);
		if (!cartItem) {
			return res.status(404).json({
				success: false,
				message: "Cart item not found",
			});
		}

		// Find the product in the products array
		const productIndex = cartItem.products.findIndex(p => p.product.toString() === productId);
		if (productIndex === -1) {
			return res.status(404).json({
				success: false,
				message: "Product not found in cart item",
			});
		}

		const productInCart = cartItem.products[productIndex];

		// Only decrement if quantity is provided and less than current quantity
		if (quantity && quantity < productInCart.quantity) {
			productInCart.quantity -= quantity;
			productInCart.subtotal = productInCart.quantity * productInCart.unitPrice;
			await cartItem.save();
		} else {
			// Remove the product from the products array
			cartItem.products.splice(productIndex, 1);
			await cartItem.save();
		}

		// If products array is empty, remove the CartItem from the cart and delete it
		let cart;
		if (cartItem.products.length === 0) {
			cart = await Cart.findOne({
				consumer: req.userId,
				status: "active",
				items: cartItemId,
			});
			if (cart) {
				cart.items = cart.items.filter((item) => item.toString() !== cartItemId);
				await cart.save();
			}
			await CartItem.findByIdAndDelete(cartItemId);
		} else {
			// Otherwise, update the cart total
			cart = await Cart.findOne({
				consumer: req.userId,
				status: "active",
				items: cartItemId,
			});
			if (cart) {
				cart.totalAmount = (
					await CartItem.find({ _id: { $in: cart.items } })
				).reduce((sum, item) => sum + item.subtotal, 0);
				await cart.save();
			}
		}

		// Populate cart details
		if (cart) {
			await cart.populate({
				path: "items",
				populate: [
					{ path: "products.product" },
					{ path: "farmer" }
				],
			});
		}

		const farmerTotals = cart && cart.items ? cart.items.reduce((totals, item) => {
			const farmerId = item.farmer._id.toString();
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
		}, {}) : {};

		res.status(200).json({
			success: true,
			message: "Product removed from cart successfully",
			cart: cart ? {
				...cart.toObject(),
				farmerTotals: Object.values(farmerTotals),
			} : null,
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
