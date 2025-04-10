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
    image: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
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

export default mongoose.model("User", userSchema);
