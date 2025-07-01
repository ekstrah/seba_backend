import { Category } from "../models/category.model.js";
import logger from "./logger.js";
import { faker } from '@faker-js/faker';

export const initializeTestCategories = async () => {
	try {
		// Check if categories already exist
		const existingCategories = await Category.find();
		if (existingCategories.length > 0) {
			logger.info("Test categories already exist");
			return;
		}

		// Create parent categories
		const parentNames = ["Vegetable", "Meat", "Fruit"];
		const parentCategories = [];
		for (const name of parentNames) {
			const parent = new Category({ name, description: `Parent category for ${name}` });
			await parent.save();
			parentCategories.push(parent);
		}

		// Create subcategories for each parent
		const subcategories = [];
		for (const parent of parentCategories) {
			let subNames = [];
			if (parent.name === "Vegetable") {
				// Ensure unique vegetable names
				const uniqueNames = new Set();
				while (uniqueNames.size < 5) {
					uniqueNames.add(faker.food.vegetable());
				}
				subNames = Array.from(uniqueNames);
			} else if (parent.name === "Meat") {
				// Ensure unique meat names
				const uniqueNames = new Set();
				while (uniqueNames.size < 5) {
					uniqueNames.add(faker.animal.type());
				}
				subNames = Array.from(uniqueNames);
			} else if (parent.name === "Fruit") {
				// Ensure unique fruit names
				const uniqueNames = new Set();
				while (uniqueNames.size < 5) {
					uniqueNames.add(faker.food.fruit());
				}
				subNames = Array.from(uniqueNames);
			}
			for (const subName of subNames) {
				const sub = new Category({
					name: subName,
					description: `Subcategory of ${parent.name}`,
					parent: parent._id,
				});
				await sub.save();
				subcategories.push(sub);
			}
		}

		logger.info("Test categories (with subcategories) initialized successfully");
	} catch (error) {
		logger.error("Error initializing test categories:", error);
		throw error;
	}
};
