import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    beginDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "In Review", "Completed"],
      default: "To Do",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: async function (userId) {
          // Validate that the assigned user is a technician
          const User = mongoose.model("User");
          const user = await User.findById(userId);
          return user && user.role === "technician";
        },
        message: "Tasks can only be assigned to users with the technician role",
      },
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    // Global comments visible to everyone assigned to the project
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Private messages between technician and project manager/admin
    privateMessages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        recipient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Regular attachments (added by admin or project manager)
    attachments: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return v && v.trim().length > 0;
            },
            message: "URL cannot be empty",
          },
        },
        fileType: {
          type: String,
          enum: ["image", "document", "other"],
          default: "other",
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Work evidence images (added by technician)
    workEvidence: [
      {
        imageUrl: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return v && v.trim().length > 0;
            },
            message: "Image URL cannot be empty",
          },
        },
        originalName: {
          type: String,
          default: "unnamed file",
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Change log to track updates
    changeLog: [
      {
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        changes: {
          type: Object,
          required: true,
        },
        message: String,
      },
    ],
    // Track who last updated the task
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Add a pre-save hook to update the project's tasks array
taskSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const Project = mongoose.model("Project");
      await Project.findByIdAndUpdate(this.project, {
        $addToSet: { tasks: this._id },
      });
    } catch (error) {
      console.error("Error updating project tasks:", error);
    }
  }
  next();
});

// Add middleware to prevent technicians from changing status to "In Review" without work evidence
taskSchema.pre("save", async function (next) {
  // If status is being changed to "In Review"
  if (this.isModified("status") && this.status === "In Review") {
    try {
      // Get the user who is making the change
      const updatedBy = this.lastUpdatedBy;

      if (!updatedBy) {
        // If lastUpdatedBy is not set, we can't determine who's making the change
        // This is a safeguard to prevent bypassing the validation
        const err = new Error(
          "Missing lastUpdatedBy field: User information required to update task status"
        );
        return next(err);
      }

      const User = mongoose.model("User");
      const user = await User.findById(updatedBy);

      // If the user is a technician, check for work evidence
      if (user && user.role === "technician") {
        if (this.workEvidence.length === 0) {
          const err = new Error(
            "Technicians must add work evidence images before changing status to 'In Review'"
          );
          return next(err);
        }
      }
      // Admin and project managers can change status without evidence
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Add a pre-findOneAndDelete hook to clean up references when a task is deleted
taskSchema.pre("findOneAndDelete", async function (next) {
  try {
    // Get the task that's about to be deleted
    const taskToDelete = await this.model.findOne(this.getFilter());
    if (!taskToDelete) return next();

    // Remove task from project's tasks array
    const Project = mongoose.model("Project");
    await Project.findByIdAndUpdate(taskToDelete.project, {
      $pull: { tasks: taskToDelete._id },
    });

    // Remove task from assigned user's assignedTasks array
    if (taskToDelete.assignedTo) {
      const User = mongoose.model("User");
      await User.findByIdAndUpdate(taskToDelete.assignedTo, {
        $pull: { assignedTasks: taskToDelete._id },
      });
    }
  } catch (error) {
    console.error("Error cleaning up task references:", error);
    // Continue with deletion even if reference cleanup fails
  }
  next();
});

// Add a pre-findByIdAndDelete hook (similar to findOneAndDelete)
taskSchema.pre("findByIdAndDelete", async function (next) {
  try {
    // Get the task that's about to be deleted
    const taskToDelete = await this.model.findOne(this.getFilter());
    if (!taskToDelete) return next();

    // Remove task from project's tasks array
    const Project = mongoose.model("Project");
    await Project.findByIdAndUpdate(taskToDelete.project, {
      $pull: { tasks: taskToDelete._id },
    });

    // Remove task from assigned user's assignedTasks array
    if (taskToDelete.assignedTo) {
      const User = mongoose.model("User");
      await User.findByIdAndUpdate(taskToDelete.assignedTo, {
        $pull: { assignedTasks: taskToDelete._id },
      });
    }
  } catch (error) {
    console.error("Error cleaning up task references:", error);
    // Continue with deletion even if reference cleanup fails
  }
  next();
});

// Add this middleware after your existing Task schema definition

// Middleware to update user references when a task is created or updated
taskSchema.post('save', async function(doc) {
  const User = mongoose.model('User');
  
  // Update technician reference if assigned
  if (doc.assignedTo) {
    await User.findByIdAndUpdate(doc.assignedTo, {
      $addToSet: { "assignedTasks": doc._id }
    });
  }
});

// Middleware to handle updates to task assignments
taskSchema.pre('findOneAndUpdate', async function() {
  const User = mongoose.model('User');
  const update = this.getUpdate();
  const task = await this.model.findOne(this.getQuery());
  
  if (!task) return;
  
  // Handle assignedTo changes
  if (update.assignedTo && task.assignedTo && !task.assignedTo.equals(update.assignedTo)) {
    // Remove from old technician
    await User.findByIdAndUpdate(task.assignedTo, {
      $pull: { "assignedTasks": task._id }
    });
    
    // Add to new technician
    await User.findByIdAndUpdate(update.assignedTo, {
      $addToSet: { "assignedTasks": task._id }
    });
  } else if (update.assignedTo && !task.assignedTo) {
    // Add to new technician when there was no previous one
    await User.findByIdAndUpdate(update.assignedTo, {
      $addToSet: { "assignedTasks": task._id }
    });
  }
});

// Middleware to clean up user references when a task is deleted
taskSchema.pre('findOneAndDelete', async function() {
  const User = mongoose.model('User');
  const task = await this.model.findOne(this.getQuery());
  
  if (!task) return;
  
  // Remove task from technician's assigned tasks
  if (task.assignedTo) {
    await User.findByIdAndUpdate(task.assignedTo, {
      $pull: { "assignedTasks": task._id }
    });
  }
});

// At the end of the schema definition, before exporting
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({
  "privateMessages.sender": 1,
  "privateMessages.recipient": 1,
});
export default mongoose.model("Task", taskSchema);
