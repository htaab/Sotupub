import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
