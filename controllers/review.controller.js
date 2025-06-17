import Review from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { Farmer } from "../models/farmer.model.js";
import {
	calculateNewRating,
	calculateRatingAfterDeletion,
} from "../utils/ratingCalculator.js";

// Create a new review
export const createReview = async (req, res) => {
	try {
		const { type, rating, title, comment, farmerId, productId } = req.body;
		const reviewer = req.user._id; // Assuming user is authenticated

		// Create the review
		const review = new Review({
			type,
			rating,
			title,
			comment,
			reviewer,
			farmer: type === "farmer" ? farmerId : undefined,
			product: type === "product" ? productId : undefined,
			isVerifiedPurchase: false, // You can implement verification logic later
		});

		await review.save();

		// Update the rating of the reviewed entity (farmer or product)
		if (type === "farmer") {
			const farmer = await Farmer.findById(farmerId);
			farmer.rating = calculateNewRating(farmer.rating, rating);
			farmer.reviews.push(review._id);
			await farmer.save();
		} else {
			const product = await Product.findById(productId);
			product.rating = calculateNewRating(product.rating, rating);
			product.reviews.push(review._id);
			await product.save();
		}

		res.status(201).json(review);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update a review
export const updateReview = async (req, res) => {
	try {
		const { rating, title, comment } = req.body;
		const review = await Review.findById(req.params.id);

		if (!review) {
			return res.status(404).json({ message: "Review not found" });
		}

		// Check if user is the reviewer
		if (review.reviewer.toString() !== req.user._id.toString()) {
			return res
				.status(403)
				.json({ message: "Not authorized to update this review" });
		}

		const oldRating = review.rating;
		review.rating = rating;
		review.title = title;
		review.comment = comment;
		await review.save();

		// Update the rating of the reviewed entity
		if (review.type === "farmer") {
			const farmer = await Farmer.findById(review.farmer);
			farmer.rating = calculateNewRating(farmer.rating, rating, oldRating);
			await farmer.save();
		} else {
			const product = await Product.findById(review.product);
			product.rating = calculateNewRating(product.rating, rating, oldRating);
			await product.save();
		}

		res.json(review);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Delete a review
export const deleteReview = async (req, res) => {
	try {
		const review = await Review.findById(req.params.id);

		if (!review) {
			return res.status(404).json({ message: "Review not found" });
		}

		// Check if user is the reviewer
		if (review.reviewer.toString() !== req.user._id.toString()) {
			return res
				.status(403)
				.json({ message: "Not authorized to delete this review" });
		}

		// Update the rating of the reviewed entity
		if (review.type === "farmer") {
			const farmer = await Farmer.findById(review.farmer);
			farmer.rating = calculateRatingAfterDeletion(
				farmer.rating,
				review.rating,
			);
			farmer.reviews = farmer.reviews.filter(
				(id) => id.toString() !== review._id.toString(),
			);
			await farmer.save();
		} else {
			const product = await Product.findById(review.product);
			product.rating = calculateRatingAfterDeletion(
				product.rating,
				review.rating,
			);
			product.reviews = product.reviews.filter(
				(id) => id.toString() !== review._id.toString(),
			);
			await product.save();
		}

		await review.deleteOne();
		res.json({ message: "Review deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get reviews for a farmer or product
export const getReviews = async (req, res) => {
	try {
		const { type, id } = req.params;
		const reviews = await Review.find({
			type,
			[type === "farmer" ? "farmer" : "product"]: id,
		}).populate("reviewer", "name");

		res.json(reviews);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
