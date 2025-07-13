import { User } from "../models/user.model.js";
import { Consumer } from "../models/consumer.model.js";
import { Farmer } from "../models/farmer.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Address } from "../models/address.model.js";
import logger from "./logger.js";
import { faker } from '@faker-js/faker';

/**
 * Extracts all consumers information from the database
 * @returns {Promise<Array>} Array of consumers with their details
 */
const getAllConsumersInfo = async () => {
	try {
		const consumers = await Consumer.find()
			.populate("deliveryAddresses")
			.populate("activeCart")
			.lean();

		return consumers.map((consumer) => ({
			id: consumer._id,
			name: consumer.name,
			email: consumer.email,
			phone: consumer.phone,
			deliveryAddresses: consumer.deliveryAddresses,
			activeCart: consumer.activeCart,
			loyaltyPoints: consumer.loyaltyPoints,
			membershipLevel: consumer.membershipLevel,
			stripeCustomerId: consumer.stripeCustomerId,
			createdAt: consumer.createdAt,
			updatedAt: consumer.updatedAt,
		}));
	} catch (error) {
		logger.error("Error fetching consumers information:", error);
		throw error;
	}
};

/**
 * Extracts all farmers information from the database
 * @returns {Promise<Array>} Array of farmers with their details
 */
const getAllFarmersInfo = async () => {
	try {
		const farmers = await Farmer.find()
			.populate("farmLocation")
			.populate("products")
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
 * Extracts all products information from the database
 * @returns {Promise<Array>} Array of products with their details
 */
const getAllProductsInfo = async () => {
	try {
		const products = await Product.find()
			.populate("category", "name")
			.lean();

		// Get farmer information separately to avoid discriminator issues
		const farmerIds = [...new Set(products.map(p => p.farmer))];
		const farmers = await Farmer.find({ _id: { $in: farmerIds } }).lean();
		const farmerMap = farmers.reduce((map, farmer) => {
			map[farmer._id.toString()] = farmer;
			return map;
		}, {});

		return products.map((product) => ({
			id: product._id,
			name: product.name,
			description: product.description,
			price: product.price,
			stock: product.stock,
			imagePath: product.imagePath,
			isAvailable: product.isAvailable,
			harvestDate: product.harvestDate,
			expiryDate: product.expiryDate,
			certType: product.certType,
			farmingMethod: product.farmingMethod,
			category: product.category,
			farmer: {
				id: product.farmer,
				farmName: farmerMap[product.farmer.toString()]?.farmName || "Unknown Farm"
			},
			measurement: product.measurement,
			rating: product.rating,
			createdAt: product.createdAt,
			updatedAt: product.updatedAt,
		}));
	} catch (error) {
		logger.error("Error fetching products information:", error);
		throw error;
	}
};

/**
 * Generates a random order status
 * @returns {string} Random order status
 */
const generateRandomOrderStatus = () => {
	return faker.helpers.arrayElement([
		"pending",
		"processing", 
		"shipped",
		"delivered",
		"cancelled"
	]);
};

/**
 * Generates a random payment status
 * @returns {string} Random payment status
 */
const generateRandomPaymentStatus = () => {
	return faker.helpers.arrayElement([
		"pending",
		"processing",
		"authorized", 
		"paid",
		"failed",
		"refunded",
		"partially_refunded",
		"cancelled"
	]);
};

/**
 * Generates a random order item status
 * @returns {string} Random order item status
 */
const generateRandomOrderItemStatus = () => {
	return faker.helpers.arrayElement([
		"pending",
		"accepted",
		"sent",
		"delivered", 
		"cancelled"
	]);
};

/**
 * Generates payment details for an order
 * @returns {Object} Payment details object
 */
const generatePaymentDetails = () => {
	const isPaid = faker.datatype.boolean();
	const paymentDate = isPaid ? faker.date.recent({ days: 30 }) : null;
	
	return {
		transactionId: isPaid ? `txn_${faker.string.alphanumeric(10)}` : null,
		paymentDate: paymentDate,
		refundAmount: null,
		refundDate: null,
		paymentGatewayResponse: {
			status: isPaid ? "succeeded" : "pending",
			amount: faker.number.int({ min: 1000, max: 50000 }),
			currency: "eur"
		},
		paymentMethodSnapshot: {
			type: faker.helpers.arrayElement(["credit_card", "debit_card", "card"]),
			processor: "stripe",
			processorToken: `tok_${faker.string.alphanumeric(10)}`,
			displayInfo: {
				lastFourDigits: faker.string.numeric(4),
				cardType: faker.helpers.arrayElement(["visa", "mastercard", "amex"]),
				expiryMonth: faker.number.int({ min: 1, max: 12 }),
				expiryYear: faker.number.int({ min: 2024, max: 2030 })
			}
		}
	};
};

/**
 * Initializes test orders for consumers
 * @returns {Promise<void>}
 */
export const initializeTestOrders = async () => {
	try {
		// Check if orders already exist
		const existingOrders = await Order.find();
		if (existingOrders.length > 0) {
			logger.info("Test orders already exist");
			return;
		}

		const consumers = await getAllConsumersInfo();
		const farmers = await getAllFarmersInfo();
		const products = await getAllProductsInfo();

		if (!consumers.length || !farmers.length || !products.length) {
			logger.warn("No consumers, farmers, or products found to create test orders");
			return;
		}

		const orders = [];

		// Create orders for each consumer
		for (const consumer of consumers) {
			// Generate 1-5 orders per consumer
			const numOrders = faker.number.int({ min: 1, max: 5 });
			
			for (let i = 0; i < numOrders; i++) {
				// Get consumer's delivery addresses
				const deliveryAddresses = await Address.find({ 
					_id: { $in: consumer.deliveryAddresses } 
				});
				
				if (deliveryAddresses.length === 0) {
					logger.warn(`No delivery addresses found for consumer ${consumer.name}`);
					continue;
				}

				// Select a random delivery address
				const shippingAddress = faker.helpers.arrayElement(deliveryAddresses);

				// Group products by farmer to create order items
				const productsByFarmer = {};
				products.forEach(product => {
					const farmerId = product.farmer.id.toString();
					if (!productsByFarmer[farmerId]) {
						productsByFarmer[farmerId] = [];
					}
					productsByFarmer[farmerId].push(product);
				});

				// Debug: Log the grouping
				logger.info(`Products grouped by farmer: ${Object.keys(productsByFarmer).length} farmers with products`);

				// Create order items for 1-3 farmers
				const orderItems = [];
				const availableFarmers = Object.keys(productsByFarmer);
				
				if (availableFarmers.length === 0) {
					logger.warn(`No farmers with products found for consumer ${consumer.name}`);
					continue;
				}

				const numFarmersToSelect = Math.min(faker.number.int({ min: 1, max: 3 }), availableFarmers.length);
				const selectedFarmers = faker.helpers.arrayElements(availableFarmers, numFarmersToSelect);

				logger.info(`Selected ${selectedFarmers.length} farmers for order`);

				for (const farmerId of selectedFarmers) {
					const farmerProducts = productsByFarmer[farmerId];
					const farmer = farmers.find(f => f.id.toString() === farmerId);
					
					if (!farmer || farmerProducts.length === 0) {
						logger.warn(`No farmer or products found for farmerId: ${farmerId}`);
						continue;
					}

					// Select 1-4 products from this farmer
					const numProductsToSelect = Math.min(faker.number.int({ min: 1, max: 4 }), farmerProducts.length);
					const selectedProducts = faker.helpers.arrayElements(farmerProducts, numProductsToSelect);

					logger.info(`Selected ${selectedProducts.length} products from farmer ${farmer.farmName}`);

					const orderProducts = selectedProducts.map(product => ({
						product: product.id,
						quantity: faker.number.int({ min: 1, max: 5 }),
						unitPrice: product.price,
						subtotal: 0 // Will be calculated by pre-save middleware
					}));

					// Calculate subtotal for this order item
					const subtotal = orderProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

					const orderItem = {
						farmer: farmerId,
						products: orderProducts,
						subtotal: subtotal,
						status: generateRandomOrderItemStatus()
					};

					orderItems.push(orderItem);
					logger.info(`Created order item with ${orderProducts.length} products, subtotal: ${subtotal}`);
				}

				if (orderItems.length === 0) {
					logger.warn(`No order items created for consumer ${consumer.name}`);
					continue;
				}

				// Calculate total amount
				const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

				// Generate order status and payment status
				const orderStatus = generateRandomOrderStatus();
				const paymentStatus = generateRandomPaymentStatus();

				// Create the order
				const order = {
					consumer: consumer.id,
					orderItems: orderItems,
					totalAmount: totalAmount,
					status: orderStatus,
					shippingAddress: shippingAddress._id,
					paymentStatus: paymentStatus,
					paymentDetails: generatePaymentDetails(),
					notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
					createdAt: faker.date.past({ years: 1 }),
					updatedAt: faker.date.recent({ days: 30 })
				};

				logger.info(`Created order with ${orderItems.length} order items, total: ${totalAmount}`);
				orders.push(order);
			}
		}

		// Insert all orders at once
		if (orders.length > 0) {
			await Order.insertMany(orders);
			logger.info(`Test orders initialized successfully: ${orders.length} orders created`);
		} else {
			logger.warn("No test orders were created");
		}
	} catch (error) {
		logger.error("Error initializing test orders:", error);
		throw error;
	}
};
