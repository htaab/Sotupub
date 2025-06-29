import Project from "../models/Project.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import notificationService from "../services/notificationService.js";
import Task from "../models/Task.js";

/**
 * Get all projects with filtering, pagination and sorting
 */
const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      client,
      projectManager,
      stockManager,
      startDate,
      endDate,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Validate status if provided
    if (
      status &&
      !["To Do", "In Progress", "Completed", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status specified",
      });
    }

    // Validate order parameter
    if (order && !["asc", "desc"].includes(order.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Order must be 'asc' or 'desc'",
      });
    }

    // Build query
    const query = {};
    // If user is a technicien, restrict to projects they are assigned to
    if (req.user.role === "technician") {
      // Step 1: Find tasks assigned to this technicien
      const tasks = await Task.find({ assignedTo: req.user._id }).select(
        "project"
      );

      // Step 2: Extract project IDs
      const projectIds = [
        ...new Set(tasks.map((task) => task.project.toString())),
      ];

      // Step 3: Filter projects by those IDs
      query._id = { $in: projectIds };
    }
    // If not admin, restrict to projects the user is involved with
    else if (req.user.role !== "admin") {
      query.$or = [
        { client: req.user._id },
        { projectManager: req.user._id },
        { stockManager: req.user._id },
      ];
    }

    // Search by name or entreprise
    if (search) {
      // If query already has $or, we need to use $and to combine with search
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { entreprise: { $regex: search, $options: "i" } },
            ],
          },
        ];
        delete query.$or;
      } else {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { entreprise: { $regex: search, $options: "i" } },
        ];
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by client
    if (client) {
      query.client = client;
    }

    // Filter by project manager
    if (projectManager) {
      query.projectManager = projectManager;
    }

    // Filter by stock manager
    if (stockManager) {
      query.stockManager = stockManager;
    }

    // Filter by date range
    if (startDate) {
      query.beginDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const projects = await Project.find(query)
      .populate("client", "name email")
      .populate("projectManager", "name email")
      .populate("stockManager", "name email")
      .populate({
        path: "products.product",
        select: "name reference category price",
      })
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Project.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
      message: "Projects fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching projects",
    });
  }
};

/**
 * Create a new project
 */
const createProject = async (req, res) => {
  try {
    const {
      name,
      entreprise,
      description,
      beginDate,
      endDate,
      status,
      client,
      projectManager,
      stockManager,
      products,
    } = req.body;

    const requiredFields = {
      name: "Project name",
      entreprise: "Company name",
      beginDate: "Start date",
      endDate: "End date",
      client: "Client",
      projectManager: "Project manager",
    };

    // Check each required field and return specific error message
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${label} is required`,
          field: field,
        });
      }
    }

    // Special validation for stockManager when products exist
    if (
      req.body.products &&
      req.body.products.length > 0 &&
      !req.body.stockManager
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock manager is required when products are added",
        field: "stockManager",
      });
    }

    // Validate dates
    const startDate = new Date(beginDate);
    const finishDate = new Date(endDate);

    if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (startDate > finishDate) {
      return res.status(400).json({
        success: false,
        message: "Begin date cannot be after end date",
      });
    }

    // Validate status if provided
    if (
      status &&
      !["To Do", "In Progress", "Completed", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status specified",
      });
    }

    // Validate users exist
    const clientUser = await User.findById(client);
    const projectManagerUser = await User.findById(projectManager);

    if (!clientUser || clientUser.role !== "client") {
      return res.status(400).json({
        success: false,
        message: "Invalid client specified",
      });
    }

    if (!projectManagerUser || projectManagerUser.role !== "project manager") {
      return res.status(400).json({
        success: false,
        message: "Invalid project manager specified",
      });
    }

    // Only validate stockManager if it's provided or if products exist
    if (stockManager) {
      const stockManagerUser = await User.findById(stockManager);
      if (!stockManagerUser || stockManagerUser.role !== "stock manager") {
        return res.status(400).json({
          success: false,
          message: "Invalid stock manager specified",
        });
      }
    }

    // Validate products if provided
    let validatedProducts = [];
    if (products && products.length > 0) {
      // Check if all products exist and have valid quantities
      for (const item of products) {
        if (!item.product || !item.quantity || item.quantity < 1) {
          return res.status(400).json({
            success: false,
            message: "Invalid product or quantity specified",
          });
        }

        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${item.product} not found`,
          });
        }

        // Check if there's enough quantity in stock
        if (product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for product ${product.name}. Available: ${product.quantity}`,
          });
        }

        validatedProducts.push({
          product: item.product,
          quantity: item.quantity,
        });
      }
    }

    // Create new project
    const project = await Project.create({
      name,
      entreprise,
      description,
      beginDate: startDate,
      endDate: finishDate,
      status: status || "To Do",
      client,
      projectManager,
      stockManager,
      products: validatedProducts,
    });

    // Update product quantities if needed
    if (validatedProducts.length > 0) {
      for (const item of validatedProducts) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
          // Add this project to the product's projects array
          $push: {
            projects: {
              project: project._id,
              allocatedQuantity: item.quantity,
            },
          },
        });
      }
    }

    // Send notifications to all users involved in the project
    // Notify client
    await notificationService.notifyUser({
      to: client,
      type: "project_assigned",
      data: {
        projectId: project._id,
        projectName: name,
        entreprise,
      },
    });

    // Notify project manager
    await notificationService.notifyUser({
      to: projectManager,
      type: "project_assigned",
      data: {
        projectId: project._id,
        projectName: name,
        entreprise,
      },
    });

    // Notify stock manager if assigned
    if (stockManager) {
      await notificationService.notifyUser({
        to: stockManager,
        type: "project_assigned",
        data: {
          projectId: project._id,
          projectName: name,
          entreprise,
        },
      });
    }

    // Populate the project with related data for the response
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email")
      .populate("projectManager", "name email")
      .populate("stockManager", "name email")
      .populate({
        path: "products.product",
        select: "name reference category price",
      });

    return res.status(201).json({
      success: true,
      data: populatedProject,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating project",
    });
  }
};

/**
 * Update an existing project
 */
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      name,
      entreprise,
      description,
      beginDate,
      endDate,
      status,
      client,
      projectManager,
      stockManager,
      products,
    } = req.body;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user has permission to update this project (if not admin)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this project",
      });
    }

    // Validate dates if provided
    let startDate, finishDate;
    if (beginDate) {
      startDate = new Date(beginDate);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid begin date format",
        });
      }
    }

    if (endDate) {
      finishDate = new Date(endDate);
      if (isNaN(finishDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date format",
        });
      }
    }

    // If both dates are provided, validate their relationship
    if (startDate && finishDate && startDate > finishDate) {
      return res.status(400).json({
        success: false,
        message: "Begin date cannot be after end date",
      });
    }

    // Validate status if provided
    if (
      status &&
      !["To Do", "In Progress", "Completed", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status specified",
      });
    }

    // Validate users if provided
    if (client) {
      const clientUser = await User.findById(client);
      if (!clientUser || clientUser.role !== "client") {
        return res.status(400).json({
          success: false,
          message: "Invalid client specified",
        });
      }
    }

    if (projectManager) {
      const projectManagerUser = await User.findById(projectManager);
      if (
        !projectManagerUser ||
        projectManagerUser.role !== "project manager"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid project manager specified",
        });
      }
    }

    if (stockManager) {
      const stockManagerUser = await User.findById(stockManager);
      if (!stockManagerUser || stockManagerUser.role !== "stock manager") {
        return res.status(400).json({
          success: false,
          message: "Invalid stock manager specified",
        });
      }
    }

    // Handle product updates if provided
    let validatedProducts;
    if (products) {
      // Store original products for inventory adjustment
      const originalProducts = [...project.products];

      // Validate new products
      validatedProducts = [];
      for (const item of products) {
        if (!item.product || !item.quantity || item.quantity < 1) {
          return res.status(400).json({
            success: false,
            message: "Invalid product or quantity specified",
          });
        }

        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${item.product} not found`,
          });
        }

        // Find if this product was already in the project
        const existingProductItem = originalProducts.find(
          (p) => p.product.toString() === item.product.toString()
        );

        // Calculate the quantity difference
        const quantityDifference = existingProductItem
          ? item.quantity - existingProductItem.quantity
          : item.quantity;

        // Check if there's enough quantity in stock for the additional amount
        if (quantityDifference > 0 && product.quantity < quantityDifference) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for product ${product.name}. Available: ${product.quantity}, Additional needed: ${quantityDifference}`,
          });
        }

        validatedProducts.push({
          product: item.product,
          quantity: item.quantity,
        });

        // Update product quantity in inventory
        if (quantityDifference !== 0) {
          if (existingProductItem) {
            // Update existing product allocation
            await Product.findByIdAndUpdate(
              {
                _id: item.product,
                "projects.project": projectId,
              },
              {
                $inc: { quantity: -quantityDifference },
                $set: { "projects.$.allocatedQuantity": item.quantity },
              }
            );
          } else {
            // Add new product allocation
            await Product.findByIdAndUpdate(item.product, {
              $inc: { quantity: -quantityDifference },
              $push: {
                projects: {
                  project: projectId,
                  allocatedQuantity: item.quantity,
                },
              },
            });
          }
        }
      }

      // For products that were removed, return them to inventory
      for (const originalItem of originalProducts) {
        const stillExists = products.some(
          (item) => item.product.toString() === originalItem.product.toString()
        );

        if (!stillExists) {
          await Product.findByIdAndUpdate(originalItem.product, {
            $inc: { quantity: originalItem.quantity },
            // Remove this project from the product's projects array
            $pull: { projects: { project: projectId } },
          });
        }
      }
    }

    // Create update object
    const updateData = {};
    if (name) updateData.name = name;
    if (entreprise) updateData.entreprise = entreprise;
    if (description !== undefined) updateData.description = description;
    if (beginDate) updateData.beginDate = new Date(beginDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) updateData.status = status;
    if (client) updateData.client = client;
    if (projectManager) updateData.projectManager = projectManager;
    if (stockManager) updateData.stockManager = stockManager;
    if (validatedProducts) updateData.products = validatedProducts;

    // Use findOneAndUpdate to trigger the pre middleware
    const updatedProject = await Project.findOneAndUpdate(
      { _id: projectId },
      updateData,
      { new: true }
    )
      .populate("client", "name email")
      .populate("projectManager", "name email")
      .populate("stockManager", "name email")
      .populate({
        path: "products.product",
        select: "name reference category price",
      });

    return res.status(200).json({
      success: true,
      data: updatedProject,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating project",
    });
  }
};

/**
 * Get a single project by ID
 */
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("client", "name email")
      .populate("projectManager", "name email")
      .populate("stockManager", "name email")
      .populate({
        path: "products.product",
        select: "name reference category price image",
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user has permission to access this project
    if (req.user.role !== "admin") {
      const isUserInvolved =
        project.client.equals(req.user._id) ||
        project.projectManager.equals(req.user._id) ||
        project.stockManager.equals(req.user._id);

      if (!isUserInvolved) {
        if (req.user.role === "technician") {
          const hasTask = await Task.exists({
            project: project._id,
            assignedTo: req.user._id,
          });

          if (!hasTask) {
            return res.status(403).json({
              success: false,
              message: "You don't have permission to access this projecto",
            });
          }
        } else {
          // Other non-admin roles not directly involved
          return res.status(403).json({
            success: false,
            message: "You don't have permission to access this project bliat",
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: project,
      message: "Project fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching project",
    });
  }
};

/**
 * Delete a project
 */
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only admin can delete projects
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete projects",
      });
    }

    // Return products to inventory
    if (project.products && project.products.length > 0) {
      for (const item of project.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
          // Remove this project from the product's projects array
          $pull: { projects: { project: projectId } },
        });
      }
    }

    // Delete the project
    await Project.findOneAndDelete({ _id: projectId });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting project",
    });
  }
};

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
