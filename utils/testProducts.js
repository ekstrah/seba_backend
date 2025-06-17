import { Farmer } from "../models/farmer.model.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import logger from "./logger.js";

/**
 * Extracts all farmers information from the database
 * @returns {Promise<Array>} Array of farmers with their details
 */
const getAllFarmersInfo = async () => {
	try {
		const farmers = await Farmer.find()
			.populate("farmLocation")
			.populate("products")
			.populate("reviews")
			.lean();

		return farmers.map((farmer) => ({
			id: farmer._id,
			farmName: farmer.farmName,
			introduction: farmer.introduction,
			certifications: farmer.certifications,
			farmLocation: farmer.farmLocation,
			farmingMethods: farmer.farmingMethods,
			products: farmer.products,
			rating: farmer.rating,
			reviews: farmer.reviews,
			createdAt: farmer.createdAt,
			updatedAt: farmer.updatedAt,
		}));
	} catch (error) {
		logger.error("Error fetching farmers information:", error);
		throw error;
	}
};

/**
 * Extracts all categories information from the database
 * @returns {Promise<Array>} Array of categories with their details
 */
const getAllCategoriesInfo = async () => {
	try {
		const categories = await Category.find().lean();

		return categories.map((category) => ({
			id: category._id,
			name: category.name,
			description: category.description,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
		}));
	} catch (error) {
		logger.error("Error fetching categories information:", error);
		throw error;
	}
};

/**
 * Generates a random price string in the format "XX.XX"
 * @returns {Promise<string>} Random price string
 */
const generateRandomNumberString = async () => {
	const wholeNumber = Math.floor(Math.random() * 100);
	const decimal = Math.floor(Math.random() * 91);
	const formattedDecimal = String(decimal).padStart(2, "0");
	return `${wholeNumber}.${formattedDecimal}`;
};

/**
 * Initializes test products for each farmer and category combination
 * @returns {Promise<void>}
 */
export const initializeTestProducts = async () => {
	try {
		// Check if products already exist
		const existingProducts = await Product.find();
		if (existingProducts.length > 0) {
			logger.info("Test products already exist");
			return;
		}

		const categories = await getAllCategoriesInfo();
		const farmers = await getAllFarmersInfo();

		if (!categories.length || !farmers.length) {
			logger.warn("No categories or farmers found to create test products");
			return;
		}

		const products = [];

		// Create products for each farmer-category combination
		for (const farmer of farmers) {
			for (const category of categories) {
				const product = {
					name: `${farmer.farmName} ${category.name}`,
					description: `${farmer.farmName} ${category.name}`,
					price: await generateRandomNumberString(),
					stock: 100,
					imagePath: "/to/image.jpg",
					harvestDate: "2024-03-20",
					expiryDate: "2024-04-20",
					certType: "organic",
					farmingMethod: "organic",
					category: category.id,
					farmer: farmer.id,
				};
				products.push(product);
			}
		}
		// Insert all products at once
		await Product.insertMany(products);
		logger.info("Test products initialized successfully");
	} catch (error) {
		logger.error("Error initializing test products:", error);
		throw error;
	}
};
