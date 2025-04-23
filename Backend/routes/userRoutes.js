import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { handleUploadError, upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           description: User's email
 *         role:
 *           type: string
 *           enum: [admin, client, project manager, stock manager, technician]
 *           description: User's role
 *         image:
 *           type: string
 *           description: User's profile image URL
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         address:
 *           type: string
 *           description: User's address
 *         isActive:
 *           type: boolean
 *           description: User's active status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
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
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, client, project manager, stock manager, technician]
 *         description: Filter users by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter users by active status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, email, role, createdAt]
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
 *         description: List of users with pagination
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
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
 * /api/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *               role:
 *                 type: string
 *                 enum: [client, project manager, stock manager, technician]
 *                 description: User's role in the system
 *               phoneNumber:
 *                 type: string
 *                 description: User's contact number
 *               matriculeNumber:
 *                 type: string
 *                 description: User's matricule number (required for non-admin users)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: User's profile image (max 10MB, formats- .png, .jpg, .jpeg, .gif, .webp)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: User's account status
 *     responses:
 *       201:
 *         description: User created successfully. Password sent via email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data, email already exists, or invalid file upload
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error or email sending failed
 */

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Update a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *               role:
 *                 type: string
 *                 enum: [client, project manager, stock manager, technician]
 *                 description: User's role in the system
 *               phoneNumber:
 *                 type: string
 *                 description: User's contact number
 *               matriculeNumber:
 *                 type: string
 *                 description: User's matricule number (must be unique)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: User's profile image (max 10MB, formats- .png, .jpg, .jpeg, .gif, .webp)
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data, email/matricule already exists, or invalid file upload
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *         description: Forbidden - Admin access required or cannot delete admin users
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{userId}/toggle-active:
 *   patch:
 *     summary: Toggle user active status (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to toggle status
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required or cannot modify admin users
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.use(protect);
router
  .route("/")
  .get(authorize("admin"), getUsers)
  .post(
    authorize("admin"),
    upload.single("image"),
    handleUploadError,
    createUser
  );

router
  .route("/:userId")
  .put(
    authorize("admin"),
    upload.single("image"),
    handleUploadError,
    updateUser
  )
  .delete(authorize("admin"), deleteUser);

router
  .route("/:userId/toggle-active")
  .patch(authorize("admin"), toggleUserActive);

export default router;
