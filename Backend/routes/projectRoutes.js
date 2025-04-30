import express from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { handleUploadError, upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Project ID
 *         name:
 *           type: string
 *           description: Project name
 *         entreprise:
 *           type: string
 *           description: Company name
 *         description:
 *           type: string
 *           description: Project description
 *         beginDate:
 *           type: string
 *           format: date-time
 *           description: Project start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Project end date
 *         status:
 *           type: string
 *           enum: [To Do, In Progress, Completed, Cancelled]
 *           description: Project status
 *         client:
 *           type: object
 *           description: Client user reference
 *         projectManager:
 *           type: object
 *           description: Project manager user reference
 *         stockManager:
 *           type: object
 *           description: Stock manager user reference
 *         products:
 *           type: array
 *           description: Products associated with the project
 *         tasks:
 *           type: array
 *           description: Tasks associated with the project
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           enum: [10, 25, 50]
 *         description: Number of projects per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search projects by name or entreprise
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [To Do, In Progress, Completed, Cancelled]
 *         description: Filter projects by status
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filter projects by client ID
 *       - in: query
 *         name: projectManager
 *         schema:
 *           type: string
 *         description: Filter projects by project manager ID
 *       - in: query
 *         name: stockManager
 *         schema:
 *           type: string
 *         description: Filter projects by stock manager ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter projects by start date (greater than or equal)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter projects by end date (less than or equal)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, entreprise, beginDate, endDate, status, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of projects with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project to fetch
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - entreprise
 *               - beginDate
 *               - endDate
 *               - client
 *               - projectManager
 *               - stockManager
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               entreprise:
 *                 type: string
 *                 description: Company name
 *               description:
 *                 type: string
 *                 description: Project description
 *               beginDate:
 *                 type: string
 *                 format: date
 *                 description: Project start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Project end date
 *               status:
 *                 type: string
 *                 enum: [To Do, In Progress, Completed, Cancelled]
 *                 default: To Do
 *                 description: Project status
 *               client:
 *                 type: string
 *                 description: Client user ID
 *               projectManager:
 *                 type: string
 *                 description: Project manager user ID
 *               stockManager:
 *                 type: string
 *                 description: Stock manager user ID
 *               products:
 *                 type: array
 *                 description: Products to associate with the project
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: Product ID
 *                     quantity:
 *                       type: number
 *                       description: Quantity of the product
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               entreprise:
 *                 type: string
 *                 description: Company name
 *               description:
 *                 type: string
 *                 description: Project description
 *               beginDate:
 *                 type: string
 *                 format: date
 *                 description: Project start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Project end date
 *               status:
 *                 type: string
 *                 enum: [To Do, In Progress, Completed, Cancelled]
 *                 description: Project status
 *               client:
 *                 type: string
 *                 description: Client user ID
 *               projectManager:
 *                 type: string
 *                 description: Project manager user ID
 *               stockManager:
 *                 type: string
 *                 description: Stock manager user ID
 *               products:
 *                 type: array
 *                 description: Products to associate with the project
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: Product ID
 *                     quantity:
 *                       type: number
 *                       description: Quantity of the product
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project to delete
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */

router.use(protect);

// Routes with different authorization levels
router
  .route("/")
  .get(getProjects) // All authenticated users can get their projects
  .post(authorize("admin"), createProject); // Only admin can create projects

// Routes for specific project operations
router
  .route("/:projectId")
  .get(getProjectById) // Authorization check is in the controller
  .put(authorize("admin"), updateProject) // Only admin can update projects
  .delete(authorize("admin"), deleteProject); // Only admin can delete projects

export default router;
