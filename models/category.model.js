import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
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
		parent: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			default: null,
		},
	},
	{ timestamps: true },
);

export const Category = mongoose.model("Category", categorySchema);
