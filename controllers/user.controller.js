import { User } from "../models/user.model.js";

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
		console.error("Error in updateContactInfo:", error);
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
		console.error("Error in getContactInfo:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};
