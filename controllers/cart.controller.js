import { Cart } from "../models/cart.model.js";
import { CartItem } from "../models/cartItem.model.js";
import { Product } from "../models/product.model.js";

// Get or create cart for consumer
export const getOrCreateCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ 
            consumer: req.userId,
            status: 'active'
        }).populate({
            path: 'items',
            populate: { path: 'product' }
        });

        if (!cart) {
            cart = new Cart({
                consumer: req.userId,
                items: [],
                totalAmount: 0
            });
            await cart.save();
        }

        res.status(200).json({
            success: true,
            message: "Cart retrieved successfully",
            cart
        });
    } catch (error) {
        console.error("Error in getOrCreateCart:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
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
                message: "Product ID and quantity are required"
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ 
            consumer: req.userId,
            status: 'active'
        });

        if (!cart) {
            cart = new Cart({
                consumer: req.userId,
                items: [],
                totalAmount: 0
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Convert product price from string to number
        const unitPrice = parseFloat(product.price);
        if (isNaN(unitPrice)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product price"
            });
        }

        // Create cart item
        const cartItem = new CartItem({
            product: productId,
            quantity,
            unitPrice
        });

        await cartItem.save();

        // Add to cart
        cart.items.push(cartItem._id);
        cart.totalAmount = (cart.totalAmount || 0) + cartItem.subtotal;
        await cart.save();

        // Populate cart details
        await cart.populate({
            path: 'items',
            populate: { path: 'product' }
        });

        res.status(200).json({
            success: true,
            message: "Item added to cart successfully",
            cart
        });
    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
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
                message: "Quantity is required"
            });
        }

        const cartItem = await CartItem.findById(cartItemId);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        // Update quantity and let the pre-save middleware handle subtotal
        cartItem.quantity = quantity;
        await cartItem.save();

        // Update cart total
        const cart = await Cart.findOne({ 
            consumer: req.userId,
            status: 'active',
            items: cartItemId
        });

        if (cart) {
            cart.totalAmount = (await CartItem.find({ _id: { $in: cart.items } }))
                .reduce((sum, item) => sum + item.subtotal, 0);
            await cart.save();
        }

        res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            cartItem
        });
    } catch (error) {
        console.error("Error in updateCartItem:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const { cartItemId } = req.params;

        const cart = await Cart.findOne({ 
            consumer: req.userId,
            status: 'active',
            items: cartItemId
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart or cart item not found"
            });
        }

        // Remove item from cart
        cart.items = cart.items.filter(item => item.toString() !== cartItemId);
        
        // Update cart total
        cart.totalAmount = (await CartItem.find({ _id: { $in: cart.items } }))
            .reduce((sum, item) => sum + item.subtotal, 0);
        
        await cart.save();

        // Delete cart item
        await CartItem.findByIdAndDelete(cartItemId);

        res.status(200).json({
            success: true,
            message: "Item removed from cart successfully",
            cart
        });
    } catch (error) {
        console.error("Error in removeFromCart:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ 
            consumer: req.userId,
            status: 'active'
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
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
            cart
        });
    } catch (error) {
        console.error("Error in clearCart:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}; 