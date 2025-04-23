import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import specs from "./config/swagger.js";
import connectDB from "./config/db.js";
import initializeAdmin from "./utils/initAdmin.js";
import path from "path";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
// import projectRoutes from "./routes/projectRoutes.js";
// import taskRoutes from "./routes/taskRoutes.js";
// import productRoutes from "./routes/productRoutes.js";

// Error handler middleware
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config({ path: ".env.local" });
connectDB().then(() => {
  initializeAdmin();
});

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Your frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Base route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// API Routes
// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
// app.use("/api/projects", projectRoutes);
// app.use("/api/tasks", taskRoutes);
// app.use("/api/products", productRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
