import { Category } from "../models/category.model.js";
import logger from "./logger.js";

export const initializeTestCategories = async () => {
    try {
        // Check if categories already exist
        const existingCategories = await Category.find();
        if (existingCategories.length > 0) {
            logger.info('Test categories already exist');
            return;
        }

        const categories = [
            {
                name: "Apple",
                description: "Fresh and crisp apples from local farms"
            },
            {
                name: "Banana",
                description: "Sweet and nutritious bananas"
            },
            {
                name: "Orange",
                description: "Juicy and vitamin C rich oranges"
            },
            {
                name: "Watermelon",
                description: "Sweet and refreshing watermelons"
            }
        ];

        await Category.insertMany(categories);
        logger.info('Test categories initialized successfully');
    } catch (error) {
        logger.error('Error initializing test categories:', error);
        throw error;
    }
};
