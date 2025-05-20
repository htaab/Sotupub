import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "project_assigned",
        "task_assigned",
        "task_updated",
        "comment_added",
        "product_low_stock",
      ],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000, // 30 days in seconds (TTL index)
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
