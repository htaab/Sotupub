import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import specs from "./config/swagger.js";
import connectDB from "./config/db.js";
import initializeAdmin from "./utils/initAdmin.js";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// Import Notification model
import Notification from "./models/Notification.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Services
import notificationService from "./services/notificationService.js";

// Error handler middleware
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// Add after your database connection is established
const verifyTTLIndex = async () => {
  try {
    const indexes = await Notification.collection.indexes();
    const ttlIndex = indexes.find(
      (index) => index.expireAfterSeconds !== undefined
    );

    if (!ttlIndex) {
      console.warn(
        "⚠️ TTL index not found on Notification collection. Creating index..."
      );
      await Notification.collection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 2592000 }
      );
      console.log("✅ TTL index created successfully");
    }
  } catch (error) {
    console.error("❌ Error verifying TTL index:", error);
  }
};

dotenv.config({ path: ".env.local" });
connectDB().then(() => {
  initializeAdmin();
  verifyTTLIndex();
});

const app = express();
const httpServer = createServer(app);

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
app.use("/api/products", productRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    // Verify JWT token with error handling for expired tokens
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.id) {
        return next(new Error("Authentication error: Invalid token"));
      }

      // Attach user ID to socket
      socket.userId = decoded.id;
      next();
    } catch (jwtError) {
      // Handle expired tokens more gracefully
      if (jwtError.name === "TokenExpiredError") {
        console.log(`Token expired for a user, disconnecting socket`);
        return next(new Error("Authentication error: Token expired"));
      }
      throw jwtError;
    }
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error"));
  }
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  // Join a room specific to this user
  socket.join(socket.userId);

  socket.on("disconnect", () => {});
});

// Subscribe to notification events
notificationService.emitter.on("push", ({ userId, notification }) => {
  io.to(userId).emit("notification", notification);
});

const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
