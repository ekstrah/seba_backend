import mongoose from "mongoose";
import { User } from "./user.model.js";
import { Address } from "./address.model.js";
import { PaymentMethod } from "./paymentMethod.model.js";
import { Cart } from "./cart.model.js";

// Consumer-specific schema that extends User
const consumerSchema = new mongoose.Schema({
    // Inherits all User fields (email, password, name, phone, etc.)
    // Additional Consumer-specific fields
    activeCart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    },
    deliveryAddresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    }],
    paymentMethods: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod'
    }],
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

// Helper method to get or create active cart
consumerSchema.methods.getActiveCart = async function () {
    if (!this.activeCart) {
        const cart = await Cart.create({
            consumer: this._id,
            status: 'active'
        });
        this.activeCart = cart._id;
        await this.save();
        return cart;
    }

    const cart = await Cart.findById(this.activeCart);
    if (!cart || cart.status !== 'active') {
        const newCart = await Cart.create({
            consumer: this._id,
            status: 'active'
        });
        this.activeCart = newCart._id;
        await this.save();
        return newCart;
    }

    return cart;
};

// Helper methods for address management
consumerSchema.methods.addDeliveryAddress = async function (addressData) {
    const address = await Address.create(addressData);
    this.deliveryAddresses.push(address._id);
    return this.save();
};

consumerSchema.methods.removeDeliveryAddress = async function (addressId) {
    this.deliveryAddresses = this.deliveryAddresses.filter(
        addr => addr.toString() !== addressId.toString()
    );
    await Address.findByIdAndDelete(addressId);
    return this.save();
};

consumerSchema.methods.getDefaultAddress = async function () {
    return await Address.findOne({
        _id: { $in: this.deliveryAddresses },
        isDefault: true
    });
};

consumerSchema.methods.setDefaultAddress = async function (addressId) {
    // First, unset all default addresses
    await Address.updateMany(
        { _id: { $in: this.deliveryAddresses } },
        { isDefault: false }
    );

    // Then set the new default
    await Address.findByIdAndUpdate(addressId, { isDefault: true });
    return this.save();
};

// Helper methods for payment method management
consumerSchema.methods.addPaymentMethod = async function (paymentMethodData) {
    const paymentMethod = await PaymentMethod.create({
        ...paymentMethodData,
        consumer: this._id
    });
    this.paymentMethods.push(paymentMethod._id);
    return this.save();
};

consumerSchema.methods.removePaymentMethod = async function (paymentMethodId) {
    this.paymentMethods = this.paymentMethods.filter(
        pm => pm.toString() !== paymentMethodId.toString()
    );
    await PaymentMethod.findByIdAndDelete(paymentMethodId);
    return this.save();
};

consumerSchema.methods.getDefaultPaymentMethod = async function () {
    return await PaymentMethod.findOne({
        _id: { $in: this.paymentMethods },
        isDefault: true,
        isActive: true
    });
};

consumerSchema.methods.setDefaultPaymentMethod = async function (paymentMethodId) {
    await PaymentMethod.updateMany(
        {
            _id: { $in: this.paymentMethods },
            isDefault: true
        },
        { isDefault: false }
    );

    await PaymentMethod.findByIdAndUpdate(paymentMethodId, { isDefault: true });
    return this.save();
};

// Create Consumer model as a discriminator of User
export const Consumer = User.discriminator('consumer', consumerSchema); 