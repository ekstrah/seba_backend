import { Address } from "../models/address.model.js";
import { Consumer } from "../models/consumer.model.js";
import logger from "../utils/logger.js";

// Get all addresses for the current user
export const getAddresses = async (req, res) => {
	try {
		const addresses = await Address.find({ user: req.userId });
		res.status(200).json({ addresses });
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch addresses" });
	}
};

// Add a new address
export const addAddress = async (req, res) => {
	try {
		const {
			street,
			city,
			state,
			zipCode,
			country,
			isDefault,
			addressType,
			additionalInfo,
		} = req.body;

		// Create the address
		const address = new Address({
			user: req.userId,
			street,
			city,
			state,
			zipCode,
			country,
			isDefault,
			addressType,
			additionalInfo,
		});

		await address.save();

		// Add address to consumer's deliveryAddresses
		const consumer = await Consumer.findById(req.userId);
		if (!consumer) {
			return res.status(404).json({
				success: false,
				message: "Consumer not found",
			});
		}

		consumer.deliveryAddresses.push(address._id);
		await consumer.save();

		res.status(201).json({
			success: true,
			message: "Address added successfully",
			address,
		});
	} catch (error) {
		logger.error("Error in addAddress:", error);
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "This address already exists",
			});
		}
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Update an address
export const updateAddress = async (req, res) => {
	try {
		const { addressId } = req.params;
		const updateData = req.body;

		// If setting this address as default, unset default for all others
		if (updateData.isDefault) {
			await Address.updateMany(
				{ user: req.userId, _id: { $ne: addressId }, isDefault: true },
				{ isDefault: false }
			);
		}

		const address = await Address.findOneAndUpdate(
			{ _id: addressId, user: req.userId },
			updateData,
			{ new: true, runValidators: true },
		);

		if (!address) {
			return res.status(404).json({
				success: false,
				message: "Address not found",
			});
		}

		res.json({
			success: true,
			message: "Address updated successfully",
			address,
		});
	} catch (error) {
		logger.error("Error in updateAddress:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

// Delete an address
export const deleteAddress = async (req, res) => {
	try {
		const { addressId } = req.params;

		// Remove address from consumer's deliveryAddresses
		const consumer = await Consumer.findById(req.userId);
		if (consumer) {
			consumer.deliveryAddresses = consumer.deliveryAddresses.filter(
				(addr) => addr.toString() !== addressId,
			);
			await consumer.save();
		}

		// Find the address to check if it is default
		const address = await Address.findOneAndDelete({
			_id: addressId,
			user: req.userId,
		});

		if (!address) {
			return res.status(404).json({
				success: false,
				message: "Address not found",
			});
		}

		// If the deleted address was default, set another as default if any exist
		if (address.isDefault) {
			const another = await Address.findOne({ user: req.userId });
			if (another) {
				another.isDefault = true;
				await another.save();
			}
		}

		res.json({
			success: true,
			message: "Address deleted successfully",
		});
	} catch (error) {
		logger.error("Error in deleteAddress:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};
