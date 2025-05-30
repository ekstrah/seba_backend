import bcryptjs from 'bcryptjs';
import { Consumer } from '../models/consumer.model.js';
import { Farmer } from '../models/farmer.model.js';
import { User } from '../models/user.model.js';

const TEST_ACCOUNTS = {
    consumer: {
        email: 'testc@example.com',
        password: 'test123',
        name: 'Test Consumer',
        phone: '1234567890',
        role: 'consumer',
        isVerified: true
    },
    // farmer: {
    //     email: 'testf@example.com',
    //     password: 'test123',
    //     name: 'Test Farmer',
    //     phone: '1234567891',
    //     role: 'farmer',
    //     isVerified: true,
    //     farmName: 'Test Farm',
    //     introduction: 'This is a test farm',
    //     farmLocation: 'Test Location'
    // },
    // admin: {
    //     email: 'admin@example.com',
    //     password: 'admin123',
    //     name: 'Test Admin',
    //     phone: '1234567892',
    //     role: 'admin',
    //     isVerified: true
    // }
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
            console.log('Test consumer account created');
        }

        // Check and create farmer
        // let farmer = await Farmer.findOne({ email: TEST_ACCOUNTS.farmer.email });
        // if (!farmer) {
        //     const hashedPassword = await bcryptjs.hash(TEST_ACCOUNTS.farmer.password, 10);
        //     farmer = await Farmer.create({
        //         ...TEST_ACCOUNTS.farmer,
        //         password: hashedPassword
        //     });
        //     console.log('Test farmer account created');
        // }

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
            consumer
            // farmer,
            // admin
        };
    } catch (error) {
        console.error('Error initializing test accounts:', error);
        throw error;
    }
}; 