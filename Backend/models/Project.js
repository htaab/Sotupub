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
      enum: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
      default: 'Planning'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    stockManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    budget: {
      estimated: { type: Number },
      actual: { type: Number }
    },
    documents: [{
      name: String,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
