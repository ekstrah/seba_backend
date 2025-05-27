import { Product } from "../models/product.model.js";

export const oCreate = async (req, res) => {
    const { name, description, price, stock, imagePath, isAvailable, expiryDate, harvestDate, certType, farmingMethod, category } = req.body;
    try {
        const oProduct = new Product({
            name,
            description,
            price,
            stock,
            imagePath,
            isAvailable,
            harvestDate,
            expiryDate,
            certType,
            farmingMethod,
            category,
        });

        await oProduct.save();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: {
                ...oProduct._doc,
            },
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const oGetAll = async (req, res) => {
    try {
        const allProducts = await Product.find();
        if (!allProducts) {
            return res.status(400).json({ sucess: false, messsage: "Products doen'st exists at all" });
        }

        res.status(200).json({
            success: true,
            message: "Product List read successfully",
            products: {
                allProducts
            },
        });
    } catch {
        console.log("error in oGetAll Product ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}