import express from "express";
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  addTaskAttachments,
  removeTaskAttachments,
  addWorkEvidence,
  removeWorkEvidence,
  updateTaskPosition,
  addTaskComment,
  deleteTaskComment,
  addTaskPrivateMessage,
  deleteTaskPrivateMessage,
} from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { handleUploadError, upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Task ID
 *         name:
 *           type: string
 *           description: Task name
 *         description:
 *           type: string
 *           description: Task description
 *         beginDate:
 *           type: string
 *           format: date-time
 *           description: Task start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Task end date
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High, Urgent]
 *           description: Task priority
 *         status:
 *           type: string
 *           enum: [To Do, In Progress, In Review, Completed]
 *           description: Task status
 *         assignedTo:
 *           type: object
 *           description: Technician assigned to the task
 *         project:
 *           type: string
 *           description: Project ID the task belongs to
 *         comments:
 *           type: array
 *           description: Public comments on the task
 *         privateMessages:
 *           type: array
 *           description: Private messages between users
 *         attachments:
 *           type: array
 *           description: Task attachments
 *         workEvidence:
 *           type: array
 *           description: Work evidence images
 *         changeLog:
 *           type: array
 *           description: History of changes to the task
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
 * /api/tasks/project/{projectId}:
 *   get:
 *     summary: Get all tasks for a project (Trello-like view)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project to fetch tasks for
 *     responses:
 *       200:
 *         description: Tasks fetched successfully
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
 *                     tasks:
 *                       type: object
 *                       properties:
 *                         To Do:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *                         In Progress:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *                         In Review:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *                         Completed:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *                     totalCount:
 *                       type: integer
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - You don't have permission to access tasks for this project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get("/project/:projectId", protect, getProjectTasks);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task (Admin and Project manager only)
 *     tags: [Tasks]
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
 *               - description
 *               - beginDate
 *               - endDate
 *               - projectId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Task name
 *               description:
 *                 type: string
 *                 description: Task description
 *               beginDate:
 *                 type: string
 *                 format: date
 *                 description: Task start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Task end date
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Urgent]
 *                 default: Medium
 *                 description: Task priority
 *               status:
 *                 type: string
 *                 enum: [To Do, In Progress, In Review, Completed]
 *                 default: To Do
 *                 description: Task status
 *               assignedTo:
 *                 type: string
 *                 description: ID of technician to assign
 *               projectId:
 *                 type: string
 *                 description: Project ID the task belongs to
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Only admins and project managers can create tasks
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post("/", protect, authorize("admin", "project manager"), createTask);

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   put:
 *     summary: Update a task (Admin and Project manager only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to update
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Task name
 *               description:
 *                 type: string
 *                 description: Task description
 *               beginDate:
 *                 type: string
 *                 format: date
 *                 description: Task start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Task end date
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Urgent]
 *                 description: Task priority
 *               status:
 *                 type: string
 *                 enum: [To Do, In Progress, In Review, Completed]
 *                 description: Task status
 *               assignedTo:
 *                 type: string
 *                 description: ID of technician to assign
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Only admins and project managers can update tasks
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:taskId",
  protect,
  authorize("admin", "project manager"),
  updateTask
);

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task (Admin and Project manager only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to delete
 *     responses:
 *       200:
 *         description: Task deleted successfully
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
 *       403:
 *         description: Forbidden - Only admins and project managers can delete tasks
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:taskId",
  protect,
  authorize("admin", "project manager"),
  deleteTask
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   post:
 *     summary: Add attachments to a task (Admin and Project manager only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to add attachments to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to attach to the task
 *     responses:
 *       200:
 *         description: Attachments added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *       400:
 *         description: No files uploaded or invalid files
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Only admins and project managers can add attachments
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post(
  "/:taskId/attachments",
  protect,
  authorize("admin", "project manager"),
  upload.array("files", 5),
  handleUploadError,
  addTaskAttachments
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   delete:
 *     summary: Remove attachments from a task (Admin and Project manager only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to remove attachments from
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attachmentIds
 *             properties:
 *               attachmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of attachments to remove
 *     responses:
 *       200:
 *         description: Attachments removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *       400:
 *         description: No attachment IDs provided or invalid IDs
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Only admins and project managers can remove attachments
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:taskId/attachments",
  protect,
  authorize("admin", "project manager"),
  removeTaskAttachments
);

/**
 * @swagger
 * /api/tasks/{taskId}/evidence:
 *   post:
 *     summary: Add work evidence to a task (Admin, Project manager, or assigned Technician)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to add work evidence to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files as work evidence (JPEG, PNG, GIF, WebP only)
 *     responses:
 *       200:
 *         description: Work evidence added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *       400:
 *         description: No files uploaded or invalid files
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - You don't have permission to add work evidence to this task
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post(
  "/:taskId/evidence",
  protect,
  upload.array("files", 5),
  handleUploadError,
  addWorkEvidence
);

/**
 * @swagger
 * /api/tasks/{taskId}/evidence:
 *   delete:
 *     summary: Remove work evidence from a task (Admin, Project manager, or evidence uploader)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to remove work evidence from
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - evidenceIds
 *             properties:
 *               evidenceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of work evidence items to remove
 *     responses:
 *       200:
 *         description: Work evidence removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *       400:
 *         description: No evidence IDs provided or invalid IDs
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - You don't have permission to remove this work evidence
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete("/:taskId/evidence", protect, removeWorkEvidence);

/**
 * @swagger
 * /api/tasks/{taskId}/position:
 *   patch:
 *     summary: Update task position and status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [To Do, In Progress, In Review, Completed]
 */
router.patch("/:taskId/position", protect, updateTaskPosition);

// Comment routes
router.post("/:taskId/comments", protect, addTaskComment);
router.delete("/:taskId/comments/:commentId", protect, deleteTaskComment);

// Private message routes
router.post("/:taskId/private-messages", protect, addTaskPrivateMessage);
router.delete(
  "/:taskId/private-messages/:messageId",
  protect,
  deleteTaskPrivateMessage
);

export default router;
