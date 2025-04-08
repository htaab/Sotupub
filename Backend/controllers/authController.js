import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  validateEmail,
  validatePassword,
  sanitizeUser,
} from "../utils/validators.js";
import { sendEmail } from "../utils/sendEmail.js";
import { hashPassword } from "../utils/passwordUtils.js";

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    if (!validateEmail(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }

    if (!validatePassword(password)) {
      return errorResponse(
        res,
        "Password must be at least 8 characters with uppercase, lowercase and number",
        400
      );
    }

    if (
      role &&
      !["admin", "user", "project manager", "stock manager"].includes(role)
    ) {
      return errorResponse(res, "Invalid role specified", 400);
    }

    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { name: name.trim() }],
    });

    if (userExists) {
      return errorResponse(
        res,
        userExists.email === email.toLowerCase()
          ? "Email already registered"
          : "Username already taken",
        400
      );
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Update user creation in register function
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "user",
      isActive: true,
      isVerified: false, // Add this
      verificationToken,
      verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    await sendEmail({
      email: user.email,
      subject: "Welcome to ProjectFlow - Verify Your Email",
      text: `Welcome to ProjectFlow!\n\nPlease verify your email by clicking: ${verificationUrl}\n\nThis link will expire in 24 hours.`,
      html: `
        <h1>Welcome to ProjectFlow!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    const tokens = generateTokens(user._id);
    return successResponse(
      res,
      {
        ...sanitizeUser(user),
        ...tokens,
        message:
          "Registration successful. Please check your email to verify your account.",
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse(res, "Error registering user", 500);
  }
};

// Handle user login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
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
      ...sanitizeUser(user),
      ...tokens,
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
      return errorResponse(res, "Account is deactivated", 401);
    }

    // Generate new tokens
    const tokens = generateTokens(userId);

    // Return new tokens with minimal user info
    return successResponse(res, {
      ...tokens,
      user: {
        id: userId,
        role,
      },
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
    if (token) {
      // Add token to blacklist in Redis or DB
      await BlacklistedToken.create({ token });
    }
    return successResponse(res, { message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse(res, "Error logging out", 500);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, "Invalid or expired verification token", 400);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return successResponse(res, { message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return errorResponse(res, "Error verifying email", 500);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return errorResponse(res, "Please provide a valid email", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Please go to: ${resetUrl}\nIf you didn't request this, please ignore this email.`,
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return successResponse(res, { message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse(res, "Error processing password reset", 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || !validatePassword(password)) {
      return errorResponse(res, "Please provide a valid password", 400);
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, "Invalid or expired reset token", 400);
    }

    user.password = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return successResponse(res, { message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse(res, "Error resetting password", 500);
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

export {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  resetPassword,
  forgotPassword,
};
