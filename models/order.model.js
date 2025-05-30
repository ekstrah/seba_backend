import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        consumer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Consumer",
            required: true,
        },
        orderItems: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrderItem",
            required: true,
        }],
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        shippingAddress: {
            street: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
            zipCode: {
                type: String,
                required: true,
            },
        },
        paymentStatus: {
            type: String,
            enum: [
                'pending',           // Initial state when order is created
                'processing',        // Payment is being processed
                'authorized',        // Payment is authorized but not captured
                'paid',             // Payment is successful
                'failed',           // Payment failed
                'refunded',         // Payment was refunded
                'partially_refunded', // Partial refund was issued
                'cancelled'         // Payment was cancelled
            ],
            default: 'pending',
        },
        paymentMethod: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentMethod",
            required: true,
        },
        paymentDetails: {
            transactionId: String,
            paymentDate: Date,
            refundAmount: Number,
            refundDate: Date,
            paymentGatewayResponse: {
                type: Map,
                of: mongoose.Schema.Types.Mixed
            }
        },
        notes: {
            type: String,
        }
    },
    { timestamps: true }
);

// Indexes for faster queries
orderSchema.index({ consumer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ paymentMethod: 1 });

export const Order = mongoose.model("Order", orderSchema); 