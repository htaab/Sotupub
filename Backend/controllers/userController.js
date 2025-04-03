import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validateEmail } from "../utils/validators.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { sanitizeUser } from "../utils/validators.js";

// Get current user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return successResponse(res, sanitizeUser(user));
  } catch (error) {
    return errorResponse(res, "Error fetching profile", 500);
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber, address } = req.body;

    if (email && !validateEmail(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return errorResponse(res, "Email already in use", 400);
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.address = address || user.address;

    const updatedUser = await user.save();
    return successResponse(res, sanitizeUser(updatedUser));
  } catch (error) {
    return errorResponse(res, "Error updating profile", 500);
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse(res, "Current password is incorrect", 400);
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    
    return successResponse(res, { message: "Password updated successfully" });
  } catch (error) {
    return errorResponse(res, "Error changing password", 500);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const sanitizedUsers = users.map(user => sanitizeUser(user));
    return successResponse(res, sanitizedUsers);
  } catch (error) {
    return errorResponse(res, "Error fetching users", 500);
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    return successResponse(res, sanitizeUser(user));
  } catch (error) {
    return errorResponse(res, "Error fetching user", 500);
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    if (email && !validateEmail(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return errorResponse(res, "Email already in use", 400);
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    const updatedUser = await user.save();
    return successResponse(res, sanitizeUser(updatedUser));
  } catch (error) {
    return errorResponse(res, "Error updating user", 500);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    await user.deleteOne();
    return successResponse(res, { message: "User deleted successfully" });
  } catch (error) {
    return errorResponse(res, "Error deleting user", 500);
  }
};

export {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
