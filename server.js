import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import categoryRoutes from "./routes/category.route.js";
import productRoutes from "./routes/product.route.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);

export default app;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    connectDB();
    console.log(`Server started at 0.0.0.0:${PORT}`);
  });
}
