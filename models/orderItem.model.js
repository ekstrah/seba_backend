import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
	{
		order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
			required: true,
		},
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
		},
		status: {
			type: String,
			enum: ["pending", "accepted", "sent", "delivered", "cancelled"],
			default: "pending",
		},
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Farmer",
			required: true,
		},
	},
	{ timestamps: true },
);

// Pre-save middleware to calculate subtotal
orderItemSchema.pre("save", function (next) {
	this.subtotal = this.quantity * this.unitPrice;
	next();
});

// Indexes for faster queries
orderItemSchema.index({ product: 1 });
orderItemSchema.index({ order: 1 });
orderItemSchema.index({ farmer: 1 });
orderItemSchema.index({ status: 1 });

export const OrderItem = mongoose.model("OrderItem", orderItemSchema);
