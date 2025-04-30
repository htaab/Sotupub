import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    entreprise: { type: String, required: true },
    description: { type: String },
    beginDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Completed", "Cancelled"],
      default: "To Do",
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stockManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Not required by default, will be validated in controller
      required: function () {
        // Required only if products array has items
        return this.products && this.products.length > 0;
      },
    },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
