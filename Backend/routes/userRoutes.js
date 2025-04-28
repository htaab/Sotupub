import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getProfile,
  updateProfile,
  updatePassword,
  resetUserPassword,
} from "../controllers/userController.js";
import {
  protect,
  authorize,
  authorizeUserOrAdmin,
} from "../middleware/authMiddleware.js";
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

/**
 * @swagger
 * /api/users/{userId}/reset-password:
 *   post:
 *     summary: Reset user password (Admin only)
 *     description: Allows administrators to reset a user's password without requiring the current password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose password needs to be reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: New password for the user
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input - new password required
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
 * /api/users/profile/{userId}:
 *   get:
 *     summary: Get user profile (Admin or Profile Owner)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user profile to fetch
 *     responses:
 *       200:
 *         description: Profile fetched successfully
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
 *         description: Access denied - Not admin or profile owner
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   put:
 *     summary: Update user profile (Admin or Profile Owner)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user profile to update
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
 *               phoneNumber:
 *                 type: string
 *                 description: User's contact number
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: User's profile image (max 10MB, formats- .png, .jpg, .jpeg, .gif, .webp)
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *         description: Invalid input data or email already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied - Not admin or profile owner
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/profile/{userId}/password:
 *   put:
 *     summary: Update user password (Admin or Profile Owner)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input - both passwords required
 *       401:
 *         description: Not authorized or current password incorrect
 *       403:
 *         description: Access denied - Not admin or profile owner
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

router
  .route("/:userId/reset-password")
  .post(authorize("admin"), resetUserPassword);

// User Profile Routes
router.get("/profile/:userId", protect, authorizeUserOrAdmin, getProfile);
router.put(
  "/profile/:userId",
  protect,
  authorizeUserOrAdmin,
  upload.single("image"),
  handleUploadError,
  updateProfile
);
router.put(
  "/profile/:userId/password",
  protect,
  authorizeUserOrAdmin,
  updatePassword
);

export default router;
