import express from "express";
import dotenv from "dotenv";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json()); // allows us to parse incoming requests:req.body
app.use("/api/auth", authRoutes);

export default app;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    connectDB();
    console.log(`Server started at 0.0.0.0:${PORT}`);
  });
}

// app.listen(PORT, () => {
//   connectDB();
//   console.log("Server Started at 0.0.0.0: ", PORT);
// });
