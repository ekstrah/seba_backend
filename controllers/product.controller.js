import { Farmer } from "../models/farmer.model.js";
import { Product } from "../models/product.model.js";

export const oGetAll = async (req, res) => {
	try {
		const allProducts = await Product.find();
		if (!allProducts) {
			return res
				.status(400)
				.json({ sucess: false, messsage: "Products doen'st exists at all" });
		}

		res.status(200).json({
			success: true,
			message: "Product List read successfully",
			products: {
				allProducts,
			},
		});
	} catch (error) {
		console.log("error in oGetAll Product ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

export const oFind = async (req, res) => {
	const {
		name,
		minPrice,
		maxPrice,
		isAvailable,
		certType,
		farmingMethod,
		category,
		page = 1,
		limit = 10,
	} = req.query;
	const query = {};
	if (name) {
		query.name = { $regex: name, $options: "i" };
	}
	if (category) {
		query.category = category;
	}
	if (isAvailable) {
		query.isAvailable = isAvailable;
	}
	if (certType) {
		query.certType = certType;
	}
	if (farmingMethod) {
		query.farmingMethod = farmingMethod;
	}
	if (minPrice || maxPrice) {
		query.price = {};
		if (minPrice) query.price.$gte = Number(minPrice);
		if (maxPrice) query.price.$lte = Number(maxPrice);
	}
	// Add rating filter
	if (req.query.rating) {
		query["rating.average"] = { $gte: Number(req.query.rating) };
	}
	try {
		const skip = (page - 1) * limit;

		const products = await Product.find(query)
			.skip(Number(skip))
			.limit(Number(limit));
		const total = await Product.countDocuments(query);

		res.status(200).json({
			success: true,
			message: "Product List read successfully",
			products: {
				products,
				total,
			},
		});
	} catch (error) {
		console.log("error in find Product ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// Create a new product for a farmer
export const createFarmerProduct = async (req, res) => {
	try {
		const userId = req.userId;
		const {
			name,
			description,
			price,
			stock,
			imagePath,
			harvestDate,
			expiryDate,
			certType,
			farmingMethod,
			category,
			measurement,
		} = req.body;

		// Verify the user is a farmer
		const farmer = await Farmer.findOne({ _id: userId, role: "farmer" });
		if (!farmer) {
			return res.status(403).json({
				success: false,
				message: "Only farmers can add products",
			});
		}

		// Create the product
		const product = new Product({
			name,
			description,
			price,
			stock,
			imagePath,
			harvestDate,
			expiryDate,
			certType,
			farmingMethod,
			category,
			farmer: userId,
			isAvailable: true,
			measurement,
		});

		await product.save();

		// Add product to farmer's products array
		farmer.products.push(product._id);
		await farmer.save();

		res.status(201).json({
			success: true,
			message: "Product added successfully",
			product,
		});
	} catch (error) {
		console.error("Error in createFarmerProduct:", error);
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Get all products for a specific farmer
export const getFarmerProducts = async (req, res) => {
	try {
		const farmerId = req.params.farmerId;
		const products = await Product.find({ farmer: farmerId })
			.populate("category", "name")
			.populate("reviews");

		res.status(200).json({
			success: true,
			products,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Get products for the authenticated farmer
export const getMyProducts = async (req, res) => {
	try {
		const farmerId = req.userId;

		// Verify the user is a farmer
		const farmer = await Farmer.findOne({ _id: farmerId, role: "farmer" });
		if (!farmer) {
			return res.status(403).json({
				success: false,
				message: "Only farmers can access their products",
			});
		}

		const products = await Product.find({ farmer: farmerId })
			.populate("category", "name")
			.populate("reviews");

		res.status(200).json({
			success: true,
			products,
		});
	} catch (error) {
		console.error("Error in getMyProducts:", error);
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Delete a product (farmer only, and only their own products)
export const deleteProduct = async (req, res) => {
	try {
		const userId = req.userId;
		const productId = req.params.productId;

		// First verify the user is a farmer
		const farmer = await Farmer.findOne({ _id: userId, role: "farmer" });
		if (!farmer) {
			return res.status(403).json({
				success: false,
				message: "Only farmers can delete products",
			});
		}

		// Find the product and verify ownership
		const product = await Product.findOne({ _id: productId, farmer: userId });
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found or you don't have permission to delete it",
			});
		}

		// Remove product from farmer's products array
		farmer.products = farmer.products.filter(
			(id) => id.toString() !== productId,
		);
		await farmer.save();

		// Delete the product
		await product.deleteOne();

		res.status(200).json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Get product by ID
export const getProductById = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id)
			.populate("category", "name")
			.populate("reviews");
		if (!product) {
			return res
				.status(404)
				.json({ success: false, message: "Product not found" });
		}
		res.status(200).json({ success: true, product });
	} catch (error) {
		res.status(500).json({ success: false, message: "Server error" });
	}
};

export const getRelatedProducts = async (req, res) => {
	try {
		const { productId } = req.params;
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ success: false, message: "Product not found" });
		}
		const relatedProducts = await Product.find({
			category: product.category,
			_id: { $ne: productId },
		})
		.sort({ "rating.average": -1 })
		.limit(8);
		res.status(200).json({ success: true, products: relatedProducts });
	} catch (error) {
		console.error("Error in getRelatedProducts:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
