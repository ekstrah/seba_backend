import express from "express";
import {
	createReview,
	deleteReview,
	getReviews,
	updateReview,
} from "../controllers/review.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Create a new review (protected)
router.post("/", verifyToken, createReview);

// Update a review (protected)
router.put("/:id", verifyToken, updateReview);

// Delete a review (protected)
router.delete("/:id", verifyToken, deleteReview);

// Get reviews for a farmer or product (public)
router.get("/:type/:id", getReviews);

export default router;
