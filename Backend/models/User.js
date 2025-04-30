import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "admin",
        "project manager",
        "stock manager",
        "client",
        "technician",
      ],
      required: true,
    },
    matriculeNumber: {
      type: Number,
      unique: true,
      sparse: true, // Allows null/undefined values while maintaining uniqueness
      validate: {
        validator: function (v) {
          // Skip validation for admin role
          if (this.role === "admin") return true;
          // Required for non-admin roles
          return v != null && Number.isInteger(v) && v > 0;
        },
        message:
          "Matricule number is required for non-admin users and must be a positive integer",
      },
    },
    image: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    projects: {
      // Projects where user is the client
      asClient: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
      ],
      // Projects where user is the project manager
      asProjectManager: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
      ],
      // Projects where user is the stock manager
      asStockManager: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
      ],
      // Projects where user is assigned as a technician
      asTechnician: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
      ],
    },
  },
  { timestamps: true }
);

// Keep this method for password verification during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    if (!enteredPassword) {
      return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

userSchema.virtual("allProjects").get(function () {
  const allProjects = [
    ...(this.projects.asClient || []),
    ...(this.projects.asProjectManager || []),
    ...(this.projects.asStockManager || []),
    ...(this.projects.asTechnician || []),
  ];

  // Remove duplicates (in case a user has multiple roles in the same project)
  return [...new Set(allProjects)];
});

export default mongoose.model("User", userSchema);
