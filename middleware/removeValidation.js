import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

export const checkCategoryDeletable = async (req, res, next) => {
    console.log("checkCategoryDeletable");
    try {
        const category = await Category.findOne({ name: req.params.name });
        console.log(category);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const productCount = await Product.countDocuments({ category: category._id });

        if (productCount > 0) {
            return res.status(400).json({
                message: "Cannot delete category. There are products associated with it.",
            });
        }

        // Attach category to req for deletion
        req.category = category;
        next();
    } catch (err) {
        console.error("Middleware error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};