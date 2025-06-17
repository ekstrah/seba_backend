import bcryptjs from "bcryptjs";
import { Consumer } from "../models/consumer.model.js";
import { Farmer } from "../models/farmer.model.js";
import { Address } from "../models/address.model.js";

const TEST_ACCOUNTS = {
	consumers: [
		{
			email: "consumer1@example.com",
			password: "test123",
			name: "John Consumer",
			phone: "1234567890",
			isVerified: true,
		},
		{
			email: "consumer2@example.com",
			password: "test123",
			name: "Jane Consumer",
			phone: "1234567891",
			isVerified: true,
		},
		{
			email: "consumer3@example.com",
			password: "test123",
			name: "Bob Consumer",
			phone: "1234567892",
			isVerified: true,
		},
	],
	farmers: [
		{
			email: "farmer1@example.com",
			password: "test123",
			name: "John Farmer",
			phone: "9876543210",
			isVerified: true,
			farmName: "Green Valley Farm",
			introduction:
				"A sustainable organic farm specializing in seasonal vegetables and fruits. We practice regenerative agriculture and focus on soil health.",
			farmingMethods: ["organic", "biodynamic"],
		},
		{
			email: "farmer2@example.com",
			password: "test123",
			name: "Sarah Farmer",
			phone: "9876543211",
			isVerified: true,
			farmName: "Sunny Meadows",
			introduction:
				"Family-owned dairy farm producing organic milk and cheese. Our cows are pasture-raised and we follow traditional farming methods.",
			farmingMethods: ["organic", "natural"],
		},
		{
			email: "farmer3@example.com",
			password: "test123",
			name: "Mike Farmer",
			phone: "9876543212",
			isVerified: true,
			farmName: "Heritage Orchard",
			introduction:
				"Specializing in heirloom fruits and nuts. We maintain a diverse orchard with over 50 varieties of trees and practice integrated pest management.",
			farmingMethods: ["natural", "permaculture"],
		},
	],
};

export const initializeTestAccounts = async () => {
	try {
		const createdAccounts = {
			consumers: [],
			farmers: [],
		};

		// Create consumers
		for (const consumerData of TEST_ACCOUNTS.consumers) {
			let consumer = await Consumer.findOne({ email: consumerData.email });
			if (!consumer) {
				const hashedPassword = await bcryptjs.hash(consumerData.password, 10);
				consumer = await Consumer.create({
					...consumerData,
					password: hashedPassword,
				});

				// Create a test delivery address for consumer
				const deliveryAddress = await Address.create({
					user: consumer._id,
					street: `${Math.floor(Math.random() * 1000)} Consumer St`,
					city: "Consumer City",
					state: "CS",
					zipCode: "12345",
					addressType: "home",
					isDefault: true,
				});

				// Add the address to consumer's delivery addresses
				await consumer.addDeliveryAddress(deliveryAddress);

				// Create a test payment method for consumer
				await consumer.addPaymentMethod({
					type: "credit_card",
					isDefault: true,
					processor: "stripe",
					processorToken: "tok_test_" + Math.random().toString(36).substring(7),
					displayInfo: {
						lastFourDigits: "4242",
						cardType: "visa",
						expiryMonth: 12,
						expiryYear: new Date().getFullYear() + 1,
					},
					billingAddress: deliveryAddress._id,
				});

				console.log(`Test consumer account created for ${consumerData.email}`);
			}
			createdAccounts.consumers.push(consumer);
		}

		// Create farmers
		for (const farmerData of TEST_ACCOUNTS.farmers) {
			let farmer = await Farmer.findOne({ email: farmerData.email });
			if (!farmer) {
				const hashedPassword = await bcryptjs.hash(farmerData.password, 10);

				// Create farm location address
				const farmLocation = await Address.create({
					street: `${Math.floor(Math.random() * 1000)} Farm Road`,
					city: "Farmville",
					state: "FS",
					zipCode: "67890",
					addressType: "farm",
				});

				// Create farmer with farm location
				farmer = await Farmer.create({
					...farmerData,
					password: hashedPassword,
					farmLocation: farmLocation._id,
				});

				console.log(`Test farmer account created for ${farmerData.email}`);
			}
			createdAccounts.farmers.push(farmer);
		}

		return createdAccounts;
	} catch (error) {
		console.error("Error initializing test accounts:", error);
		throw error;
	}
};
