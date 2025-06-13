import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"

import { connectDB } from "./db/connectDB.js";
import { initializeTestAccounts } from "./utils/testAccounts.js";

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
app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/addresses", addressRoutes);

export default app;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, async () => {
    await connectDB();
    // Initialize test accounts after database connection
    await initializeTestAccounts();
    console.log(`Server started at 0.0.0.0:${PORT}`);
  });
}
