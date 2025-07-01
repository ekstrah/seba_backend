import { Category } from "../models/category.model.js";
import { Farmer } from "../models/farmer.model.js";
import { Product } from "../models/product.model.js";
import logger from "./logger.js";
import { faker } from '@faker-js/faker';

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
 * Generates a random price number in the format XX.XX
 * @returns {Promise<number>} Random price number
 */
const generateRandomPrice = async () => {
	const wholeNumber = Math.floor(Math.random() * 100);
	const decimal = Math.floor(Math.random() * 91);
	return parseFloat(`${wholeNumber}.${decimal.toString().padStart(2, "0")}`);
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
				// Generate a random number of products per farmer-category
				const numProducts = faker.number.int({ min: 5, max: 10 });
				for (let i = 0; i < numProducts; i++) {
					let measurement;
					if (category.name.toLowerCase() === 'meat') {
						measurement = 'g';
					} else {
						measurement = faker.helpers.arrayElement(['kg', 'g', 'qty']);
					}
					const product = {
						name: `${farmer.farmName} ${category.name} ${faker.string.alphanumeric(5)}`,
						description: faker.commerce.productDescription(),
						price: parseFloat(faker.commerce.price({ min: 1, max: 100, dec: 2 })),
						stock: faker.number.int({ min: 10, max: 200 }),
						imagePath: faker.image.urlPicsumPhotos({ width: 400, height: 400 }),
						harvestDate: faker.date.past({ years: 1 }).toISOString().split('T')[0],
						expiryDate: faker.date.future({ years: 1 }).toISOString().split('T')[0],
						certType: faker.helpers.arrayElement(['organic', 'conventional', 'hydroponic']),
						farmingMethod: faker.helpers.arrayElement(['organic', 'hydroponic', 'permaculture']),
						category: category.id,
						farmer: farmer.id,
						processorToken: `tok_test_${faker.string.alphanumeric(10)}`,
						measurement,
					};
					products.push(product);
				}
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
