import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		password: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
			index: true,
		},
		phone: {
			type: String,
			required: true,
			index: true,
		},
		lastLogin: {
			type: Date,
			default: Date.now,
			index: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
			index: true,
		},
		imagePath: {
			type: String,
			default: "https://via.placeholder.com/150",
		},
		role: {
			type: String,
			enum: ["admin", "consumer", "farmer"],
			required: true,
			index: true,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
		isVerified: {
			type: Boolean,
			default: false,
			index: true,
		},
		resetPasswordToken: String,
		resetPasswordExpiresAt: Date,
		verificationToken: String,
		verificationTokenExpiresAt: Date,
	},
	{ 
		timestamps: true,
		discriminatorKey: 'role'
	}
);

// Compound indexes for common query patterns
userSchema.index({ email: 1, role: 1 });
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Base User model
export const User = mongoose.model("User", userSchema);