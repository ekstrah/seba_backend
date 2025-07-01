import express from "express";
import {
	createReview,
	deleteReview,
	getReviews,
	updateReview,
} from "../controllers/review.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Create a new review (protected)
router.post("/", verifyToken, authorize('createReview'), createReview);

// Update a review (protected)
router.put("/:id", verifyToken, authorize('updateReview'), updateReview);

// Delete a review (protected)
router.delete("/:id", verifyToken, authorize('deleteReview'), deleteReview);

// Get reviews for a farmer or product (public)
router.get("/:type/:id", authorize('getReviews'), getReviews);

export default router;
