import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
    {
        methodType: {
            type: String,
            required: true,
            unique: true,
            enum: ['credit_card', 'stripe', 'bank_transfer'],
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'sucess', 'failed'],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        supportedCurrencies: [{
            type: String,
            default: ['EUR'],
        }],
        amount: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

// Indexes for faster queries
paymentMethodSchema.index({ methodType: 1 });
paymentMethodSchema.index({ isActive: 1 });

export const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema); 