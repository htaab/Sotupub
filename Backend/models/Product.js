import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String },
    projects: [
      {
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
        allocatedQuantity: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
