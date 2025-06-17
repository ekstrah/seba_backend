import { PaymentMethod } from "../models/paymentMethod.model.js";

// Check if user has payment methods
export const checkPaymentMethods = async (req, res) => {
	try {
		const paymentMethods = await PaymentMethod.find({
			consumer: req.userId,
			isActive: true,
		}).populate("billingAddress");

		// Check if any payment methods are expired
		const validPaymentMethods = paymentMethods.filter(
			(method) => !method.isExpired(),
		);

		res.status(200).json({
			success: true,
			hasPaymentMethods: validPaymentMethods.length > 0,
			paymentMethods: validPaymentMethods,
			defaultPaymentMethod:
				validPaymentMethods.find((method) => method.isDefault) || null,
		});
	} catch (error) {
		console.error("Error in checkPaymentMethods:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Get all payment methods for a user
export const getPaymentMethods = async (req, res) => {
	try {
		const paymentMethods = await PaymentMethod.find({
			consumer: req.userId,
			isActive: true,
		}).populate("billingAddress");

		// Filter out expired payment methods
		const validPaymentMethods = paymentMethods.filter(
			(method) => !method.isExpired(),
		);

		res.status(200).json({
			success: true,
			paymentMethods: validPaymentMethods,
			defaultPaymentMethod:
				validPaymentMethods.find((method) => method.isDefault) || null,
		});
	} catch (error) {
		console.error("Error in getPaymentMethods:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};
