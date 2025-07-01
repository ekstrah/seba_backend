import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
	{
		order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
			required: true,
		},
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Farmer",
			required: true,
		},
		products: [
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
				},
			}
		],
		subtotal: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		status: {
			type: String,
			enum: ["pending", "accepted", "sent", "delivered", "cancelled"],
			default: "pending",
		},
	},
	{ timestamps: true },
);

// Pre-save middleware to calculate subtotal for the order item (sum of all product subtotals)
orderItemSchema.pre("save", function (next) {
	this.subtotal = this.products.reduce((sum, p) => sum + (p.subtotal || (p.quantity * p.unitPrice)), 0);
	next();
});

// Indexes for faster queries
orderItemSchema.index({ farmer: 1 });
orderItemSchema.index({ order: 1 });
orderItemSchema.index({ status: 1 });

export const OrderItem = mongoose.model("OrderItem", orderItemSchema);
