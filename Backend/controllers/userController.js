import User from "../models/User.js";
import { generatePassword, hashPassword } from "../utils/passwordUtils.js";
import sendEmail from "../utils/sendEmail.js";
import { sanitizeUser, validateEmail } from "../utils/validators.js";
import fs from "fs";
import path from "path";

const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      isActive,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Validate role if provided
    if (
      role &&
      ![
        "admin",
        "client",
        "project manager",
        "stock manager",
        "technician",
      ].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Validate isActive if provided
    if (isActive !== undefined && isActive !== null) {
      const boolValue = isActive.toLowerCase();
      if (boolValue !== "true" && boolValue !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean value",
        });
      }
    }

    // Validate order parameter
    if (order && !["asc", "desc"].includes(order.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Order must be 'asc' or 'desc'",
      });
    }

    // Build query
    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== null) {
      query.isActive = isActive.toLowerCase() === "true";
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      phoneNumber,
      matriculeNumber,
      isActive = true,
    } = req.body;

    // Get image path if file was uploaded
    const image = req.file ? `/uploads/users/${req.file.filename}` : undefined;

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Validate role
    if (
      !["client", "project manager", "stock manager", "technician"].includes(
        role
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Validate matricule number for non-admin roles
    if (role !== "admin" && !matriculeNumber) {
      return res.status(400).json({
        success: false,
        message: "Matricule number is required for non-admin users",
      });
    }

    // Check if matricule number is unique if provided
    if (matriculeNumber) {
      const existingMatricule = await User.findOne({ matriculeNumber });
      if (existingMatricule) {
        return res.status(400).json({
          success: false,
          message: "Matricule number already exists",
        });
      }
    }

    // Generate a secure random password
    const generatedPassword = generatePassword();

    // Hash the password before saving
    const hashedPassword = await hashPassword(generatedPassword);

    // Create new user with hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phoneNumber,
      matriculeNumber,
      isActive,
      image,
    });

    // Prepare email content
    const emailOptions = {
      email: user.email,
      subject: "Welcome to Our Platform - Your Account Details",
      html: `
        <h1>Welcome ${user.name}!</h1>
        <p>Your account has been created successfully.</p>
        <p>Here are your login credentials:</p>
        <ul>
          <li>Email: ${user.email}</li>
          <li>Password: ${generatedPassword}</li>
        </ul>
        <p>Please change your password after your first login.</p>
        <p>Role: ${user.role}</p>
      `,
    };

    // Send welcome email with credentials
    await sendEmail(emailOptions);

    // Return sanitized user data
    const sanitizedUser = sanitizeUser(user);

    return res.status(201).json({
      success: true,
      data: sanitizedUser,
      message: "User created successfully. Login credentials sent via email.",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating user",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, phoneNumber, matriculeNumber } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate email format if being updated
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check email uniqueness if email is being updated
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Check matricule number uniqueness if being updated
    if (
      matriculeNumber &&
      String(matriculeNumber) !== String(user.matriculeNumber)
    ) {
      const existingMatricule = await User.findOne({
        matriculeNumber,
        _id: { $ne: userId }, // Exclude current user from the check
      });
      if (existingMatricule) {
        return res.status(400).json({
          success: false,
          message: "Matricule number already exists",
        });
      }
    }

    // Validate role if being updated
    if (
      role &&
      !["client", "project manager", "stock manager", "technician"].includes(
        role
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (user.image) {
        const oldImagePath = path.join(process.cwd(), user.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Set new image path
      user.image = `/uploads/users/${req.file.filename}`;
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (matriculeNumber) user.matriculeNumber = matriculeNumber;

    await user.save();

    // Remove sensitive data before sending response
    const sanitizedUser = sanitizeUser(user);

    return res.status(200).json({
      success: true,
      data: sanitizedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating user",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user and delete
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deletion of admin users
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin users cannot be deleted",
      });
    }

    // Delete user's image if it exists
    if (user.image) {
      const imagePath = path.join(process.cwd(), user.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting user",
    });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent toggling admin users
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin users status cannot be modified",
      });
    }

    // Toggle isActive status
    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error toggling user status",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const requestedUserId = req.params.userId || req.user.id;

    const user = await User.findById(requestedUserId).select([
      "name",
      "email",
      "role",
      "matriculeNumber",
      "image",
      "phoneNumber",
      "address",
      "isActive",
      "createdAt",
      "updatedAt",
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: "Profile fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { name, email, phoneNumber } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate email format if being updated
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check email uniqueness if email is being updated
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Handle image update
    if (req.file) {
      if (user.image) {
        const oldImagePath = path.join(process.cwd(), user.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      user.image = `/uploads/users/${req.file.filename}`;
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    const sanitizedUser = sanitizeUser(user);

    return res.status(200).json({
      success: true,
      data: sanitizedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating profile",
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate password inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both current and new password",
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash and update password
    user.password = await hashPassword(newPassword);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating password",
    });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Check if the requesting user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can reset passwords",
      });
    }

    // Validate new password
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash and update password
    user.password = await hashPassword(newPassword);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting user password:", error);
    return res.status(500).json({
      success: false,
      message: "Error resetting user password",
    });
  }
};

export {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getProfile,
  updateProfile,
  updatePassword,
  resetUserPassword, // Add the new function to exports
};
