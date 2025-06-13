import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { createReview, updateReview, deleteReview, getReviews } from "../controllers/review.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Create a new review
router.post("/", createReview);

// Update a review
router.put("/:id", updateReview);

// Delete a review
router.delete("/:id", deleteReview);

// Get reviews for a farmer or product
router.get("/:type/:id", getReviews);

export default router; 