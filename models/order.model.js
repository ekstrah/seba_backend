import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		consumer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Consumer",
			required: false,
		},
		orderItems: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "OrderItem",
				required: true,
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
			default: "pending",
		},
		shippingAddress: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Address",
			required: true,
		},
		paymentStatus: {
			type: String,
			enum: [
				"pending", // Initial state when order is created
				"processing", // Payment is being processed
				"authorized", // Payment is authorized but not captured
				"paid", // Payment is successful
				"failed", // Payment failed
				"refunded", // Payment was refunded
				"partially_refunded", // Partial refund was issued
				"cancelled", // Payment was cancelled
			],
			default: "pending",
		},
		paymentDetails: {
			transactionId: String,
			paymentDate: Date,
			refundAmount: Number,
			refundDate: Date,
			paymentGatewayResponse: {
				type: Map,
				of: mongoose.Schema.Types.Mixed,
			},
			// Store a snapshot of the payment method at time of order
			paymentMethodSnapshot: {
				type: {
					type: String,
					enum: ["credit_card", "debit_card", "bank_account", "card"],
					required: false,
				},
				processor: {
					type: String,
					enum: ["stripe", "paypal", "square"],
					required: false,
				},
				processorToken: {
					type: String,
					required: false,
				},
				displayInfo: {
					lastFourDigits: String,
					cardType: String,
					expiryMonth: Number,
					expiryYear: Number,
				},
			},
		},
		notes: {
			type: String,
		},
	},
	{ timestamps: true },
);

// Indexes for faster queries
orderSchema.index({ consumer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

// Pre-save middleware to capture payment method snapshot
orderSchema.pre("save", async function (next) {
	if (this.isModified("paymentMethod") && this.paymentMethod) {
		const PaymentMethod = mongoose.model("PaymentMethod");
		const paymentMethod = await PaymentMethod.findById(this.paymentMethod);
		if (paymentMethod) {
			this.paymentDetails.paymentMethodSnapshot = {
				type: paymentMethod.type,
				processor: paymentMethod.processor,
				processorToken: paymentMethod.processorToken,
				displayInfo: {
					lastFourDigits: paymentMethod.displayInfo.lastFourDigits,
					cardType: paymentMethod.displayInfo.cardType,
					expiryMonth: paymentMethod.displayInfo.expiryMonth,
					expiryYear: paymentMethod.displayInfo.expiryYear,
				},
			};
		}
	}
	next();
});

export const Order = mongoose.model("Order", orderSchema);
