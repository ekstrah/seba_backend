import { User } from "../models/user.model.js";
import { Consumer } from "../models/consumer.model.js";
import stripe from "../utils/stripe.js";
import logger from "../utils/logger.js";
import { Farmer } from "../models/farmer.model.js";

// Update user contact information
export const updateContactInfo = async (req, res) => {
	try {
		const { name, phone, email } = req.body;
		const userId = req.userId;

		// Check if email is being changed and if it's already taken
		if (email) {
			const existingUser = await User.findOne({ email, _id: { $ne: userId } });
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: "Email is already in use",
				});
			}
		}

		// Update user information
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{
				...(name && { name }),
				...(phone && { phone }),
				...(email && { email }),
				updatedAt: Date.now(),
			},
			{ new: true, runValidators: true },
		).select("-password");

		if (!updatedUser) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			message: "Contact information updated successfully",
			user: updatedUser,
		});
	} catch (error) {
		logger.error("Error in updateContactInfo:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Get user contact information
export const getContactInfo = async (req, res) => {
	try {
		const userId = req.userId;
		const user = await User.findById(userId).select("name phone email");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			contactInfo: {
				name: user.name,
				phone: user.phone,
				email: user.email,
			},
		});
	} catch (error) {
		logger.error("Error in getContactInfo:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// List saved Stripe payment methods for the authenticated consumer
export const listPaymentMethods = async (req, res) => {
	try {
		const userId = req.userId;
		// Find the consumer by userId
		const consumer = await Consumer.findById(userId);
		if (!consumer || !consumer.stripeCustomerId) {
			return res.status(404).json({
				success: false,
				message: "No Stripe customer found for this user."
			});
		}
		logger.info('Listing payment methods for consumer:', consumer._id, 'stripeCustomerId:', consumer.stripeCustomerId);
		// List payment methods from Stripe
		const paymentMethods = await stripe.paymentMethods.list({
			customer: consumer.stripeCustomerId,
			type: 'card',
		});
		res.status(200).json({
			success: true,
			paymentMethods: paymentMethods.data,
		});
	} catch (error) {
		logger.error("Error in listPaymentMethods:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Update farmer profile (name, email, phone, introduction, farmName)
export const updateFarmerProfile = async (req, res) => {
	try {
		console.log(req)
		const userId = req.userId;
		const { name, email, phone, introduction, farmName } = req.body;

		// Find the user and ensure they are a farmer
		const user = await User.findById(userId);
		if (!user || user.role !== "farmer") {
			return res.status(403).json({
				success: false,
				message: "Only farmers can update their profile."
			});
		}

		// Check if email is being changed and if it's already taken
		if (email && email !== user.email) {
			const existingUser = await User.findOne({ email, _id: { $ne: userId } });
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: "Email is already in use",
				});
			}
		}

		// Update User fields
		user.name = name ?? user.name;
		user.email = email ?? user.email;
		user.phone = phone ?? user.phone;
		user.updatedAt = Date.now();
		await user.save();

		// Update Farmer fields
		const farmer = await Farmer.findById(userId);
		if (!farmer) {
			return res.status(404).json({
				success: false,
				message: "Farmer profile not found."
			});
		}
		farmer.introduction = introduction ?? farmer.introduction;
		farmer.farmName = farmName ?? farmer.farmName;
		farmer.updatedAt = Date.now();
		await farmer.save();

		// Return updated profile (excluding password)
		const updatedProfile = await Farmer.findById(userId).select("-password");
		res.status(200).json({
			success: true,
			message: "Farmer profile updated successfully",
			farmer: updatedProfile,
		});
	} catch (error) {
		logger.error("Error in updateFarmerProfile:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};
