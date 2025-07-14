import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			required: [true, "Review type is required"],
			enum: ["farmer", "product"],
		},
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "farmer",
			required: function () {
				return this.type === "farmer";
			},
		},
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: function () {
				return this.type === "product";
			},
		},
		reviewer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Reviewer is required"],
		},
		rating: {
			type: Number,
			required: [true, "Rating is required"],
			min: [1, "Rating must be at least 1"],
			max: [5, "Rating cannot be more than 5"],
		},
		title: {
			type: String,
			required: [true, "Review title is required"],
			trim: true,
			maxlength: [100, "Title cannot be more than 100 characters"],
		},
		comment: {
			type: String,
			required: [true, "Review comment is required"],
			trim: true,
			maxlength: [1000, "Comment cannot be more than 1000 characters"],
		},
		isVerifiedPurchase: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

// Add indexes for better query performance
reviewSchema.index({ type: 1 });
reviewSchema.index({ farmer: 1 });
reviewSchema.index({ product: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Compound indexes for common queries
reviewSchema.index({ type: 1, farmer: 1 });
reviewSchema.index({ type: 1, product: 1 });

// Helper function to recalculate and update rating
async function recalculateRating(review) {
	// Dynamically import models to avoid circular dependencies
	const { default: Review } = await import('./review.model.js');
	const { Product } = await import('./product.model.js');
	const { Farmer } = await import('./farmer.model.js');

	let model, idField, idValue;
	if (review.type === 'product') {
		model = Product;
		idField = 'product';
		idValue = review.product;
	} else {
		model = Farmer;
		idField = 'farmer';
		idValue = review.farmer;
	}

	// Get all reviews for this product or farmer
	const allReviews = await Review.find({ type: review.type, [idField]: idValue });
	const count = allReviews.length;
	const average = count === 0 ? 0 : allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

	// Update the product or farmer
	await model.findByIdAndUpdate(
		idValue,
		{
			rating: { average: Number(average.toFixed(1)), count },
			reviews: allReviews.map(r => r._id)
		}
	);
}

// Recalculate after save (insert/update)
reviewSchema.post('save', async function (doc, next) {
	await recalculateRating(doc);
	next();
});

// Recalculate after remove (delete)
reviewSchema.post('remove', async function (doc, next) {
	await recalculateRating(doc);
	next();
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
