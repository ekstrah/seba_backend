import { Address } from "../models/address.model.js";
import { Consumer } from "../models/consumer.model.js";

// Get all addresses for the current user
export const getAddresses = async (req, res) => {
	try {
		const addresses = await Address.find({ user: req.userId }).sort({
			isDefault: -1,
			createdAt: -1,
		});

		res.json({
			success: true,
			addresses,
		});
	} catch (error) {
		console.error("Error in getAddresses:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
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
		console.error("Error in addAddress:", error);
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
		console.error("Error in updateAddress:", error);
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

		res.json({
			success: true,
			message: "Address deleted successfully",
		});
	} catch (error) {
		console.error("Error in deleteAddress:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};
