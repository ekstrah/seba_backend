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
      ref: "Farmer",
      required: function() {
        return this.type === "farmer";
      },
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function() {
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
    }
  },
  {
    timestamps: true,
  }
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

const Review = mongoose.model("Review", reviewSchema);

export default Review; 