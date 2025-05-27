import { Category } from "../models/category.model.js";

export const oCreate = async (req, res) => {
    const { name, description } = req.body;
    try {
        if (!name || !description) {
            throw new Error("All fields are required");
        }

        const categoryAlreadyExists = await Category.findOne({ name });
        console.log("Category Already Exists", categoryAlreadyExists);
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
    const { name } = req.body;
    try {
        if (!name) {
            throw new Error("Name fields are required");
        }

        const categoryAlreadyExists = await Category.findOne({ name });
        if (!categoryAlreadyExists) {
            return res.status(400).json({ sucess: false, messsage: "Category doen'st exists" });
        }
        const category = new Category({
            name
        });
        await category.deleteOne();
        res.status(200).json({
            success: true,
            message: "Categry deleted successfully",
            category: {
                ...category._doc,
            },
        });
    } catch {
        console.log("error in oDelete Category ", error);
        res.status(500).json({ success: false, message: "Server error" });
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