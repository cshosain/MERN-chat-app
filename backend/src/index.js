import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import cors from "cors";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3001;
app.use(express.json({ limit: "2mb" })); // Increase limit as needed
app.use(express.urlencoded({ limit: "2mb", extended: true })); // For form data
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Global error handler for payload too large
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ message: "File too large. Max size is 2MB." });
  }
  // Handle other errors
  res.status(500).json({ message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
