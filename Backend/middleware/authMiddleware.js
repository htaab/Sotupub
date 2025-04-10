import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware to protect routes by verifying JWT token and user authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.id || !decoded.exp) {
        return res.status(401).json({
          success: false,
          message: "Invalid token format",
        });
      }

      // Check if token has expired
      if (Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }

      // Fetch user from database (excluding sensitive fields)
      const user = await User.findById(decoded.id).select(
        "-password -resetPasswordToken -resetPasswordExpiry"
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (tokenError) {
      // Handle specific JWT errors
      if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }
      throw tokenError;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * Middleware to verify refresh token for token renewal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Enhanced validation
      if (!decoded || typeof decoded !== "object") {
        return res.status(401).json({
          success: false,
          message: "Invalid token structure",
        });
      }

      if (!decoded.id || !decoded.exp || decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({
          success: false,
          message: "Token is invalid or expired",
        });
      }

      // Get user with minimal required fields
      const user = await User.findById(decoded.id)
        .select("isActive role")
        .lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Attach user data to request for the controller
      req.refreshUser = {
        id: user._id,
        role: user.role,
        isActive: user.isActive,
      };

      next();
    } catch (tokenError) {
      if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Refresh token expired",
        });
      }
      throw tokenError;
    }
  } catch (error) {
    console.error("Refresh token verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Token verification failed",
    });
  }
};

/**
 * Middleware factory for role-based authorization
 * @param {...String} roles - Allowed roles for the route
 * @returns {Function} Middleware function to check user role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: "User not found in request",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

export { protect, authorize, verifyRefreshToken };
