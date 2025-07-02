import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema(
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
	},
	{ _id: false }
);

const cartItemSchema = new mongoose.Schema(
	{
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Farmer",
			required: true,
		},
		products: [cartProductSchema],
		subtotal: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
	},
);

const cartSchema = new mongoose.Schema(
	{
		consumer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Consumer",
			required: true,
		},
		items: [cartItemSchema],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		status: {
			type: String,
			enum: ["active", "abandoned", "converted"],
			default: "active",
		},
		expiresAt: {
			type: Date,
			default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
		},
	},
	{ timestamps: true },
);

// Pre-save middleware to calculate subtotals
cartSchema.pre("save", function (next) {
	// Calculate subtotal for each item (sum of product subtotals)
	this.items.forEach(item => {
		item.subtotal = item.products.reduce((sum, p) => sum + (p.subtotal || (p.quantity * p.unitPrice)), 0);
	});
	// Calculate totalAmount for the cart (sum of item subtotals)
	this.totalAmount = this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
	next();
});

// Indexes for faster queries
cartSchema.index({ consumer: 1 });
cartSchema.index({ status: 1 });
cartSchema.index({ expiresAt: 1 });
cartSchema.index({ createdAt: -1 });

export const Cart = mongoose.model("Cart", cartSchema);
