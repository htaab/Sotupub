import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Project routes with role-based authorization
router.post("/", authorize("admin", "project manager"), createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", authorize("admin", "project manager"), updateProject);
router.delete("/:id", authorize("admin"), deleteProject);

export default router;
