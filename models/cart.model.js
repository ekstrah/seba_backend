import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
    {
        consumer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Consumer",
            required: true,
        },
        items: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "CartItem",
            required: true,
        }],
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        status: {
            type: String,
            enum: ['active', 'abandoned', 'converted'],
            default: 'active',
        },
        expiresAt: {
            type: Date,
            default: () => new Date(+new Date() + 7*24*60*60*1000), // 7 days from now
        }
    },
    { timestamps: true }
);

// Indexes for faster queries
cartSchema.index({ consumer: 1 });
cartSchema.index({ status: 1 });
cartSchema.index({ expiresAt: 1 });
cartSchema.index({ createdAt: -1 });

export const Cart = mongoose.model("Cart", cartSchema); 