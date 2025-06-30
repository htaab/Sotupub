import express from "express";
import {
  getProjectCompletionStats,
  getUserStats,
  getIncompleteProjectsCount,
  getProductManagerStats,
} from "../controllers/statisticsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Project completion statistics (all roles)
router.get("/project-completion", protect, getProjectCompletionStats);

// User statistics (admin only)
router.get("/users", protect, authorize("admin"), getUserStats);

// Incomplete projects count (project manager, technician)
router.get(
  "/incomplete-projects",
  protect,
  authorize("project manager", "technician"),
  getIncompleteProjectsCount
);

// Product manager specific statistics
router.get(
  "/product-manager",
  protect,
  authorize("admin"),
  getProductManagerStats
);

export default router;
