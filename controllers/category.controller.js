import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

export const oCreate = async (req, res) => {
    const { name, description } = req.body;
    try {
        if (!name || !description) {
            throw new Error("All fields are required");
        }

        const categoryAlreadyExists = await Category.findOne({ name });
        if (categoryAlreadyExists) {
            return res.status(400).json({ success: false, message: "Category already exists" });
        }
        const category = new Category({
            name,
            description
        });
        await category.save();

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            user: {
                ...category._doc,
            },
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
export const oDelete = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const category = await Category.findOne({ name });

        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: "Category not found" 
            });
        }

        // Check if any products are using this category
        const products = await Product.find({ category: category._id });
        
        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete category. There are products associated with it.",
                products: products.map(p => p.name)
            });
        }

        await Category.deleteOne({ _id: category._id });

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            category
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};


export const oReadAll = async (req, res) => {
    try {
        const allCategories = await Category.find();
        if (!allCategories) {
            return res.status(400).json({ sucess: false, messsage: "Category doen'st exists at all" });
        }

        res.status(200).json({
            success: true,
            message: "Categry read successfully",
            categories: {
                allCategories
            },
        });
    } catch {
        console.log("error in oReadAll Category ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};