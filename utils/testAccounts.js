import bcryptjs from "bcryptjs";
import { Address } from "../models/address.model.js";
import { Consumer } from "../models/consumer.model.js";
import { Farmer } from "../models/farmer.model.js";
import { fakerDE as faker  } from '@faker-js/faker';

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
				// Generate random name and phone
				const randomName = faker.person.fullName();
				const randomPhone = faker.phone.number({ style: 'international'  });
				const randomCity = faker.location.city();
				const randomStreetAddress = faker.location.streetAddress(); 
				const randomZipCode = faker.location.zipCode();
				
				consumer = await Consumer.create({
					...consumerData,
					name: randomName,
					phone: randomPhone,
					password: hashedPassword,
				});

				// Create a test delivery address for consumer
				const deliveryAddress = await Address.create({
					user: consumer._id,
					street: randomStreetAddress,
					city: randomCity,
					state: randomCity,
					zipCode: randomZipCode,
					addressType: "home",
					isDefault: true,
				});

				// Add the address to consumer's delivery addresses
				await consumer.addDeliveryAddress(deliveryAddress);
			}
			createdAccounts.consumers.push(consumer);
		}

		// Create farmers
		for (const farmerData of TEST_ACCOUNTS.farmers) {
			let farmer = await Farmer.findOne({ email: farmerData.email });
			if (!farmer) {
				const hashedPassword = await bcryptjs.hash(farmerData.password, 10);
				// Generate random name and phone
				const randomName = faker.person.fullName();
				const randomPhone = faker.phone.number({ country: 'DE', type: 'mobile' });

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
					name: randomName,
					phone: randomPhone,
					password: hashedPassword,
					farmLocation: farmLocation._id,
				});
			}
			createdAccounts.farmers.push(farmer);
		}

		return createdAccounts;
	} catch (error) {
		console.error("Error initializing test accounts:", error);
		throw error;
	}
};
