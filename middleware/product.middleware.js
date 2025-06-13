import { Product } from "../models/product.model.js";
import { Farmer } from "../models/farmer.model.js";

export const verifyProductOwnership = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const userId = req.userId;

        // Verify the user is a farmer
        const farmer = await Farmer.findOne({ _id: userId, role: 'farmer' });
        if (!farmer) {
            return res.status(403).json({
                success: false,
                message: "Only farmers can perform this action"
            });
        }

        // Find the product and verify ownership
        const product = await Product.findOne({ _id: productId, farmer: userId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found or you don't have permission to access it"
            });
        }

        // Add product to request for use in route handlers
        req.product = product;
        next();
    } catch (error) {
        console.error("Error in verifyProductOwnership:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}; 