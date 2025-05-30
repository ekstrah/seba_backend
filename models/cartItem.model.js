import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        }
    },
    { timestamps: true }
);

// Pre-save middleware to calculate subtotal
cartItemSchema.pre('save', function(next) {
    this.subtotal = this.quantity * this.unitPrice;
    next();
});

// Index for faster queries
cartItemSchema.index({ product: 1 });

export const CartItem = mongoose.model("CartItem", cartItemSchema); 