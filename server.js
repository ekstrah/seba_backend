import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { connectDB } from "./db/connectDB.js";
import { initializeTestAccounts } from "./utils/testAccounts.js";
import logger from "./utils/logger.js";

import authRoutes from "./routes/auth.route.js";
import categoryRoutes from "./routes/category.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import reviewRoutes from "./routes/review.route.js";
import paymentMethodRoutes from "./routes/paymentMethod.routes.js";
import addressRoutes from "./routes/address.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined', { stream: logger.stream }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/addresses", addressRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, async () => {
        try {
            await connectDB();
            logger.info('MongoDB connected successfully');
            
            // Initialize test accounts after database connection
            await initializeTestAccounts();
            logger.info('Test accounts initialized successfully');
            
            logger.info(`Server started at 0.0.0.0:${PORT}`);
        } catch (error) {
            logger.error('Failed to start server:', { error: error.message, stack: error.stack });
            process.exit(1);
        }
    });
}
