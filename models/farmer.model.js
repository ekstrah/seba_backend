import mongoose from "mongoose";
import { User } from "./user.model.js";

const farmerSchema = new mongoose.Schema(
	{
		farmName: {
			type: String,
			required: true,
			trim: true,
		},
		introduction: {
			type: String,
			required: true,
			trim: true,
			minlength: 50,
			maxlength: 1000,
		},
		certifications: {
			type: [
				{
					type: {
						type: String,
						required: true,
						enum: [
							"organic",
							"natural",
							"biodynamic",
							"permaculture",
							"fair-trade",
							"rainforest-alliance",
						],
					},
					issuer: {
						type: String,
						required: true,
					},
					issueDate: {
						type: Date,
						required: true,
					},
					expiryDate: {
						type: Date,
						required: true,
					},
					certificateNumber: {
						type: String,
						required: true,
					},
				},
			],
			default: [],
		},
		farmLocation: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Address",
			required: false,
		},
		farmingMethods: [
			{
				type: String,
				enum: [
					"organic",
					"natural",
					"conventional",
					"biodynamic",
					"permaculture",
				],
			},
		],
		products: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
			},
		],
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
	},
	{
		timestamps: true,
		discriminatorKey: "role"
	},
);

// Create Farmer model as a discriminator of User
export const Farmer = User.discriminator("Farmer", farmerSchema);
