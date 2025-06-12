import bcryptjs from 'bcryptjs';
import { Consumer } from '../models/consumer.model.js';
import { Farmer } from '../models/farmer.model.js';
import { Address } from '../models/address.model.js';

const TEST_ACCOUNTS = {
    consumer: {
        email: 'testc@example.com',
        password: 'test123',
        name: 'Test Consumer',
        phone: '1234567890',
        isVerified: true
    },
    farmer: {
        email: 'testf@example.com',
        password: 'test123',
        name: 'Test Farmer',
        phone: '1234567891',
        isVerified: true,
        farmName: 'Test Farm',
        introduction: 'This is a test farm with a detailed introduction that meets the minimum length requirement of 50 characters. We are committed to sustainable farming practices.',
        farmingMethods: ['organic', 'natural']
    },
};

export const initializeTestAccounts = async () => {
    try {
        // Check and create consumer
        let consumer = await Consumer.findOne({ email: TEST_ACCOUNTS.consumer.email });
        if (!consumer) {
            const hashedPassword = await bcryptjs.hash(TEST_ACCOUNTS.consumer.password, 10);
            consumer = await Consumer.create({
                ...TEST_ACCOUNTS.consumer,
                password: hashedPassword
            });

            // Create a test delivery address for consumer
            const deliveryAddress = await Address.create({
                street: '123 Consumer St',
                city: 'Consumer City',
                state: 'CS',
                zipCode: '12345',
                addressType: 'home',
                isDefault: true
            });

            // Add the address to consumer's delivery addresses
            await consumer.addDeliveryAddress(deliveryAddress);

            // Create a test payment method for consumer
            const paymentMethod = await consumer.addPaymentMethod({
                type: 'credit_card',
                isDefault: true,
                processor: 'stripe',
                processorToken: 'tok_test_' + Math.random().toString(36).substring(7),
                displayInfo: {
                    lastFourDigits: '4242',
                    cardType: 'visa',
                    expiryMonth: 12,
                    expiryYear: new Date().getFullYear() + 1
                },
                billingAddress: deliveryAddress._id
            });

            console.log('Test consumer account created with delivery address and payment method');
        }

        // Check and create farmer
        let farmer = await Farmer.findOne({ email: TEST_ACCOUNTS.farmer.email });
        if (!farmer) {
            const hashedPassword = await bcryptjs.hash(TEST_ACCOUNTS.farmer.password, 10);
            
            // Create farm location address first
            const farmLocation = await Address.create({
                street: '456 Farm Road',
                city: 'Farmville',
                state: 'FS',
                zipCode: '67890',
                addressType: 'farm',
                coordinates: {
                    latitude: 37.7749
                }
            });

            farmer = await Farmer.create({
                ...TEST_ACCOUNTS.farmer,
                password: hashedPassword,
                farmLocation: farmLocation._id
            });

            console.log('Test farmer account created with farm location');
        }

        // Check and create admin
        // let admin = await User.findOne({ email: TEST_ACCOUNTS.admin.email });
        // if (!admin) {
        //     const hashedPassword = await bcryptjs.hash(TEST_ACCOUNTS.admin.password, 10);
        //     admin = await User.create({
        //         ...TEST_ACCOUNTS.admin,
        //         password: hashedPassword
        //     });
        //     console.log('Test admin account created');
        // }

        return {
            consumer,
            farmer,
            // admin
        };
    } catch (error) {
        console.error('Error initializing test accounts:', error);
        throw error;
    }
}; 