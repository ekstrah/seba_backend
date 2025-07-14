// name, description, price, stock, imagePath, isAvailable, harvestDate, expiryDate, certType, farmingMethod, category

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		stock: {
			type: Number,
			default: Date.now,
		},
		imagePath: {
			type: String,
			default: false,
		},
		isAvailable: {
			type: Boolean,
			default: false,
		},
		harvestDate: {
			type: Date,
			default: null,
		},
		expiryDate: {
			type: Date,
			default: null,
		},
		certType: {
			type: String,
			default: false,
		},
		farmingMethod: {
			type: String,
			default: false,
		},
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "farmer",
			required: true,
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			required: true,
		},
		reviews: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Review",
			},
		],
		rating: {
			average: {
				type: Number,
				default: 0,
				min: 0,
				max: 5,
			},
			count: {
				type: Number,
				default: 0,
			},
		},
		measurement: {
			type: String,
			enum: ['kg', 'g', 'qty'],
			required: true,
		},
	},
	{ timestamps: true },
);

export const Product = mongoose.model("Product", productSchema);
