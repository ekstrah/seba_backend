import mongoose from "mongoose";
import { User } from "./user.model.js";

// Consumer-specific schema that extends User
const consumerSchema = new mongoose.Schema({
    // Inherits all User fields (email, password, name, phone, etc.)
    // Additional Consumer-specific fields
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    deliveryAddresses: [{
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    // orderHistory: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Order'
    // }],
    // wishlist: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Product'
    // }],
    // savedFarmers: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Farmer'
    // }],
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    membershipLevel: {
        type: String,
        enum: ['regular', 'silver', 'gold', 'platinum'],
        default: 'regular'
    }
}, {
    timestamps: true,
    discriminatorKey: 'role'  // This will be set to 'consumer' for all Consumer documents
});

// Create Consumer model as a discriminator of User
export const Consumer = User.discriminator('consumer', consumerSchema); 