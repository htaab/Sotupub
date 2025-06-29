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
    // Removing technicians array since technicians are assigned to tasks
  },
  { timestamps: true }
);

// Middleware to update user references when a project is created
projectSchema.post("save", async function (doc) {
  const User = mongoose.model("User");

  // Update client reference
  if (doc.client) {
    await User.findByIdAndUpdate(doc.client, {
      $addToSet: { "projects.asClient": doc._id },
    });
  }

  // Update project manager reference
  if (doc.projectManager) {
    await User.findByIdAndUpdate(doc.projectManager, {
      $addToSet: { "projects.asProjectManager": doc._id },
    });
  }

  // Update stock manager reference
  if (doc.stockManager) {
    await User.findByIdAndUpdate(doc.stockManager, {
      $addToSet: { "projects.asStockManager": doc._id },
    });
  }

  // Removing technician references update since technicians are assigned to tasks
});

// Middleware to handle updates to project user assignments
projectSchema.pre("findOneAndUpdate", async function () {
  const User = mongoose.model("User");
  const update = this.getUpdate();
  const project = await this.model.findOne(this.getQuery());

  if (!project) return;

  // Handle client changes
  if (update.client && !project.client.equals(update.client)) {
    // Remove from old client
    await User.findByIdAndUpdate(project.client, {
      $pull: { "projects.asClient": project._id },
    });

    // Add to new client
    await User.findByIdAndUpdate(update.client, {
      $addToSet: { "projects.asClient": project._id },
    });
  }

  // Handle project manager changes
  if (
    update.projectManager &&
    !project.projectManager.equals(update.projectManager)
  ) {
    // Remove from old project manager
    await User.findByIdAndUpdate(project.projectManager, {
      $pull: { "projects.asProjectManager": project._id },
    });

    // Add to new project manager
    await User.findByIdAndUpdate(update.projectManager, {
      $addToSet: { "projects.asProjectManager": project._id },
    });
  }

  // Handle stock manager changes
  if (
    update.stockManager &&
    project.stockManager &&
    !project.stockManager.equals(update.stockManager)
  ) {
    // Remove from old stock manager
    await User.findByIdAndUpdate(project.stockManager, {
      $pull: { "projects.asStockManager": project._id },
    });

    // Add to new stock manager
    await User.findByIdAndUpdate(update.stockManager, {
      $addToSet: { "projects.asStockManager": project._id },
    });
  } else if (update.stockManager && !project.stockManager) {
    // Add to new stock manager when there was no previous one
    await User.findByIdAndUpdate(update.stockManager, {
      $addToSet: { "projects.asStockManager": project._id },
    });
  }
});

// Middleware to clean up references when a project is deleted
projectSchema.pre("findOneAndDelete", async function () {
  const User = mongoose.model("User");
  const project = await this.model.findOne(this.getQuery());

  if (!project) return;

  // Remove project from all user references
  await User.updateMany(
    { "projects.asClient": project._id },
    { $pull: { "projects.asClient": project._id } }
  );

  await User.updateMany(
    { "projects.asProjectManager": project._id },
    { $pull: { "projects.asProjectManager": project._id } }
  );

  await User.updateMany(
    { "projects.asStockManager": project._id },
    { $pull: { "projects.asStockManager": project._id } }
  );

  // Update product references
  const Product = mongoose.model("Product");
  if (project.products && project.products.length > 0) {
    for (const item of project.products) {
      await Product.findByIdAndUpdate(item.product, {
        $pull: { projects: { project: project._id } },
      });
    }
  }
});

export default mongoose.model("Project", projectSchema);
