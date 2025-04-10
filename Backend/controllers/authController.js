import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sanitizeUser } from "../utils/validators.js";

// Handle user login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password"); // Explicitly include password field

    // Check user existence and verify password
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Return sanitized user data and tokens
    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: "loged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Error logging in",
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    // Use the pre-verified user data from middleware
    const { id: userId, role, isActive } = req.refreshUser;

    if (!isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Generate new tokens
    const tokens = generateTokens(userId);

    // Return new tokens with minimal user info
    // Return in the expected format
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      user: {
        _id: userId,
        role,
        isActive,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return errorResponse(res, "Error refreshing token", 500);
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Error logging out",
    });
  }
};

// Helper functions remain the same
const generateTokens = (userId) => {
  try {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "15m",
    });
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
      }
    );
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Error generating tokens");
  }
};

export { login, refreshToken, logout };
