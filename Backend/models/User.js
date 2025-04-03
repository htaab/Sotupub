import mongoose from "mongoose";

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
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    assignedProjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project"
    }],
    assignedTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
