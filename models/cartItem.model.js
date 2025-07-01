import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
	{
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
	},
	{ timestamps: true },
);

// Pre-save middleware to calculate subtotal for the cart item (sum of all product subtotals)
cartItemSchema.pre("save", function (next) {
	this.subtotal = this.products.reduce((sum, p) => sum + (p.subtotal || (p.quantity * p.unitPrice)), 0);
	next();
});

// Indexes for faster queries
cartItemSchema.index({ farmer: 1 });

export const CartItem = mongoose.model("CartItem", cartItemSchema);
