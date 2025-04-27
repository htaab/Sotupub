import Product from "../models/Product.js";
import fs from "fs";
import path from "path";

const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Validate order parameter
    if (order && !["asc", "desc"].includes(order.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Order must be 'asc' or 'desc'",
      });
    }

    // Build query
    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { reference: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, reference, description, category, quantity, price } =
      req.body;

    // Get image path if file was uploaded
    const image = req.file
      ? `/uploads/products/${req.file.filename}`
      : undefined;

    // Check if reference already exists (if provided)
    if (reference) {
      const existingProduct = await Product.findOne({ reference });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product with this reference already exists",
        });
      }
    }

    // Create new product
    const product = await Product.create({
      name,
      reference,
      description,
      category,
      quantity,
      price,
      image,
    });

    return res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating product",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, reference, description, category, quantity, price } =
      req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check reference uniqueness if reference is being updated
    if (reference && reference !== product.reference) {
      const existingProduct = await Product.findOne({
        reference,
        _id: { $ne: productId }, // Exclude current product from the check
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product with this reference already exists",
        });
      }
    }

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (product.image) {
        const oldImagePath = path.join(process.cwd(), product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Set new image path
      product.image = `/uploads/products/${req.file.filename}`;
    }

    // Update product fields
    if (name) product.name = name;
    if (reference) product.reference = reference;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (price !== undefined) product.price = Number(price);

    await product.save();

    return res.status(200).json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating product",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find product and delete
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete product's image if it exists
    if (product.image) {
      const imagePath = path.join(process.cwd(), product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting product",
    });
  }
};

export { getProducts, createProduct, updateProduct, deleteProduct };
