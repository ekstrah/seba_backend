import express from "express";
import { createReview, updateReview, deleteReview, getReviews } from "../controllers/review.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new review (requires authentication)
router.post("/", authenticateToken, createReview);

// Update a review (requires authentication)
router.put("/:id", authenticateToken, updateReview);

// Delete a review (requires authentication)
router.delete("/:id", authenticateToken, deleteReview);

// Get reviews for a farmer or product
router.get("/:type/:id", getReviews);

export default router; 