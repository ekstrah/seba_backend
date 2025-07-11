import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";

import { connectDB } from "./db/connectDB.js";
import addressRoutes from "./routes/address.routes.js";
import authRoutes from "./routes/auth.route.js";
import cartRoutes from "./routes/cart.routes.js";
import categoryRoutes from "./routes/category.route.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.route.js";
import reviewRoutes from "./routes/review.route.js";
import userRoutes from "./routes/user.routes.js";
import logger from "./utils/logger.js";
import { initializeTestAccounts } from "./utils/testAccounts.js";
import { initializeTestCategories } from "./utils/testCategories.js";
import { initializeTestProducts } from "./utils/testProducts.js";
import { initializeTestReviews } from "./utils/testReviews.js";
import { stripeWebhook } from "./controllers/stripeWebhook.controller.js";
import "./models/index.js";

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);

		const allowedOrigins = [
			"http://localhost:8000",
			"http://localhost:5173",
			"http://127.0.0.1:8000",
			"http://127.0.0.1:5173",
			"http://frontend:8000",
			"http://backend:8080",
			process.env.CLIENT_URL,
		].filter(Boolean); // Remove any undefined values

		if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
	],
	exposedHeaders: ["Set-Cookie"],
	maxAge: 86400, // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("combined", { stream: logger.stream }));

// Register Stripe webhook route directly BEFORE body parsers
app.post("/api/payment-methods/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// Routes (excluding webhook, which is already registered)
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/user", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
	logger.error("Unhandled error:", { error: err.message, stack: err.stack });
	res.status(500).json({ error: "Internal Server Error" });
});

export default app;

if (process.env.NODE_ENV !== "test") {
	app.listen(PORT, async () => {
		try {
			await connectDB();
			logger.info("MongoDB connected successfully");

			// Initialize test accounts after database connection
			await initializeTestAccounts();
			logger.info("Test accounts initialized successfully");

			await initializeTestCategories();
			logger.info("Test categories intiailized sucessfully");

			await initializeTestProducts();
			logger.info("Test products initialized sucessfully");

			await initializeTestReviews();
			logger.info("Test reviews initialized successfully");

			logger.info(`Server started at 0.0.0.0:${PORT}`);
		} catch (error) {
			logger.error("Failed to start server:", {
				error: error.message,
				stack: error.stack,
			});
			process.exit(1);
		}
	});
}
