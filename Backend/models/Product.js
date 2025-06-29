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

// Middleware to clean up project references when a product is deleted
productSchema.pre("findOneAndDelete", async function() {
  const product = await this.model.findOne(this.getQuery());
  if (!product) return;
  
  // Remove this product from all projects that use it
  const Project = mongoose.model("Project");
  await Project.updateMany(
    { "products.product": product._id },
    { $pull: { products: { product: product._id } } }
  );
});

export default mongoose.model("Product", productSchema);
