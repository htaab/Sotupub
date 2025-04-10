import express from "express";
import { getProjects } from "../controllers/projectController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Project routes with role-based authorization
router.get("/", getProjects);

export default router;
