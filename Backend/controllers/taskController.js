import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

/**
 * Get all tasks for a project (for Trello-like board view)
 */
const getProjectTasks = async (req, res) => {
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

    // Check if user has permission to access this project's tasks
    if (req.user.role !== "admin") {
      // Project managers can only access their assigned projects
      if (
        req.user.role === "project manager" &&
        !project.projectManager.equals(req.user._id)
      ) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to access tasks for this project",
        });
      }

      // Other roles (technicians, clients, stock managers) can only see tasks for projects they're involved with
      let isUserInvolved =
        project.client.equals(req.user._id) ||
        project.projectManager.equals(req.user._id) ||
        (project.stockManager && project.stockManager.equals(req.user._id));

      // For technicians, check if they're assigned to any task in this project
      if (!isUserInvolved && req.user.role === "technician") {
        // Check if the user is in the project's technicians array (if you added this field)
        if (
          project.technicians &&
          project.technicians.some((techId) => techId.equals(req.user._id))
        ) {
          isUserInvolved = true;
        } else {
          // Check if the technician is assigned to any task in this project
          const assignedTask = await Task.findOne({
            project: projectId,
            assignedTo: req.user._id,
          });

          if (assignedTask) {
            isUserInvolved = true;
          }
        }
      }

      if (!isUserInvolved) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to access tasks for this project",
        });
      }
    }

    // Get all tasks for the project without filtering
    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email image")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "comments.user",
        select: "name email image",
      })
      .populate({
        path: "privateMessages.sender",
        select: "name email image role",
      })
      .populate({
        path: "privateMessages.recipient",
        select: "name email image role",
      })
      .populate({
        path: "attachments.uploadedBy",
        select: "name email",
      })
      .populate({
        path: "workEvidence.uploadedBy",
        select: "name email image",
      })
      .populate({
        path: "changeLog.updatedBy",
        select: "name email role",
      })
      .sort({ endDate: 1 });

    // Custom priority order
    const priorityOrder = {
      Urgent: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };

    // Sort tasks by priority using the custom order
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Group tasks by status for Trello-like board view
    const groupedTasks = {
      "To Do": tasks.filter((task) => task.status === "To Do"),
      "In Progress": tasks.filter((task) => task.status === "In Progress"),
      "In Review": tasks.filter((task) => task.status === "In Review"),
      Completed: tasks.filter((task) => task.status === "Completed"),
    };

    return res.status(200).json({
      success: true,
      data: {
        tasks: groupedTasks,
        totalCount: tasks.length,
      },
      message: "Tasks fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching tasks",
    });
  }
};

/**
 * Create a new task
 */
const createTask = async (req, res) => {
  try {
    const {
      name,
      description,
      beginDate,
      endDate,
      priority,
      status,
      assignedTo,
      projectId,
    } = req.body;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user has permission to create tasks for this project
    if (req.user.role !== "admin" && req.user.role !== "project manager") {
      return res.status(403).json({
        success: false,
        message: "Only admins and project managers can create tasks",
      });
    }

    // Project managers can only create tasks for their assigned projects
    if (
      req.user.role === "project manager" &&
      !project.projectManager.equals(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create tasks for projects you manage",
      });
    }

    // Validate required fields
    const requiredFields = {
      name: "Task name",
      description: "Description",
      beginDate: "Start date",
      endDate: "End date",
      assignedTo: "Technicien",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${label} is required`,
          field: field,
        });
      }
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

    // Validate task dates are within project dates
    const projectStartDate = new Date(project.beginDate);
    const projectEndDate = new Date(project.endDate);

    if (isNaN(projectStartDate.getTime()) || isNaN(projectEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Project has invalid date format",
      });
    }

    if (startDate < projectStartDate || finishDate > projectEndDate) {
      return res.status(400).json({
        success: false,
        message: "Task dates must be within project date range",
      });
    }

    // Validate priority if provided
    if (priority && !["Low", "Medium", "High", "Urgent"].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority specified",
      });
    }

    // Validate status if provided
    if (
      status &&
      !["To Do", "In Progress", "In Review", "Completed"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status specified",
      });
    }

    // Validate assigned technician if provided
    let validatedAssignedTo = null;
    if (assignedTo) {
      // Check if assignedTo is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: `Invalid user ID format: ${assignedTo}. Must be a valid MongoDB ObjectId.`,
        });
      }

      const user = await User.findById(assignedTo);
      if (!user || user.role !== "technician") {
        return res.status(400).json({
          success: false,
          message: `User with ID ${assignedTo} is not a valid technician`,
        });
      }
      validatedAssignedTo = assignedTo;
    }

    // Create the task with lastUpdatedBy field
    const task = await Task.create({
      name,
      description,
      beginDate: startDate,
      endDate: finishDate,
      priority: priority || "Medium",
      status: status || "To Do",
      assignedTo: validatedAssignedTo,
      project: projectId,
      lastUpdatedBy: req.user._id, // Track who created the task
      changeLog: [
        {
          updatedBy: req.user._id,
          updatedAt: new Date(),
          changes: { action: "created" },
          message: "Task created",
        },
      ],
    });

    // Update assigned user's assignedTasks array if a technician was assigned
    if (validatedAssignedTo) {
      await User.findByIdAndUpdate(validatedAssignedTo, {
        $addToSet: { assignedTasks: task._id },
      });
    }

    // Populate the task with related data for the response
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email image")
      .populate("project", "name")
      .populate("lastUpdatedBy", "name email role");

    return res.status(201).json({
      success: true,
      data: populatedTask,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating task",
    });
  }
};

/**
 * Update an existing task
 */
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      name,
      description,
      beginDate,
      endDate,
      priority,
      status,
      assignedTo,
    } = req.body;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Find the project to check permissions
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Associated project not found",
      });
    }

    // Check if user has permission to update this task
    // Only admins and project managers can update task information
    if (
      req.user.role !== "admin" &&
      !(
        req.user.role === "project manager" &&
        project.projectManager.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admins and project managers can update task information",
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

    // Validate task dates are within project dates
    const projectStartDate = new Date(project.beginDate);
    const projectEndDate = new Date(project.endDate);

    if (isNaN(projectStartDate.getTime()) || isNaN(projectEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Project has invalid date format",
      });
    }

    const taskStartDate = startDate || task.beginDate;
    const taskEndDate = finishDate || task.endDate;

    if (taskStartDate < projectStartDate || taskEndDate > projectEndDate) {
      return res.status(400).json({
        success: false,
        message: "Task dates must be within project date range",
      });
    }

    // Validate priority if provided
    if (priority && !["Low", "Medium", "High", "Urgent"].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority specified",
      });
    }

    // Validate status if provided
    if (
      status &&
      !["To Do", "In Progress", "In Review", "Completed"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status specified",
      });
    }

    // Handle assigned user if provided
    let validatedAssignedTo = undefined;
    if (assignedTo !== undefined) {
      // Handle null assignment (removing assignment)
      if (assignedTo === null) {
        validatedAssignedTo = null;

        // If there was a previously assigned user, remove task from their assignedTasks
        if (task.assignedTo) {
          await User.findByIdAndUpdate(task.assignedTo, {
            $pull: { assignedTasks: task._id },
          });
        }
      } else {
        // Check if assignedTo is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
          return res.status(400).json({
            success: false,
            message: `Invalid user ID format: ${assignedTo}. Must be a valid MongoDB ObjectId.`,
          });
        }

        const user = await User.findById(assignedTo);
        if (!user || user.role !== "technician") {
          return res.status(400).json({
            success: false,
            message: `User with ID ${assignedTo} is not a valid technician`,
          });
        }

        validatedAssignedTo = assignedTo;

        // If this is a new assignment
        if (!task.assignedTo || !task.assignedTo.equals(assignedTo)) {
          // Remove task from previous assignee if there was one
          if (task.assignedTo) {
            await User.findByIdAndUpdate(task.assignedTo, {
              $pull: { assignedTasks: task._id },
            });
          }

          // Add task to new assignee
          await User.findByIdAndUpdate(assignedTo, {
            $addToSet: { assignedTasks: task._id },
          });
        }
      }
    }

    // Create a change log entry
    const changes = {};

    // Track changes
    if (name && name !== task.name)
      changes.name = { from: task.name, to: name };
    if (description !== undefined && description !== task.description)
      changes.description = { from: task.description, to: description };
    if (startDate) changes.beginDate = { from: task.beginDate, to: startDate };
    if (finishDate) changes.endDate = { from: task.endDate, to: finishDate };
    if (priority && priority !== task.priority)
      changes.priority = { from: task.priority, to: priority };
    if (status && status !== task.status)
      changes.status = { from: task.status, to: status };
    if (validatedAssignedTo !== undefined) {
      const oldAssignee = task.assignedTo ? task.assignedTo.toString() : null;
      const newAssignee = validatedAssignedTo
        ? validatedAssignedTo.toString()
        : null;
      if (oldAssignee !== newAssignee) {
        changes.assignedTo = { from: oldAssignee, to: newAssignee };
      }
    }

    // Add to change log
    addToChangeLog(task, changes, req.user);

    // Update task fields
    if (name) task.name = name;
    if (description !== undefined) task.description = description;
    if (startDate) task.beginDate = startDate;
    if (finishDate) task.endDate = finishDate;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (validatedAssignedTo !== undefined)
      task.assignedTo = validatedAssignedTo;

    await task.save();

    // Populate the task with related data for the response
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email image")
      .populate("project", "name")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "comments.user",
        select: "name email image",
      })
      .populate({
        path: "attachments.uploadedBy",
        select: "name email",
      })
      .populate({
        path: "workEvidence.uploadedBy",
        select: "name email image",
      })
      .populate({
        path: "privateMessages.sender",
        select: "name email image role",
      })
      .populate({
        path: "privateMessages.recipient",
        select: "name email image role",
      })
      .populate({
        path: "changeLog.updatedBy",
        select: "name email role",
      });

    return res.status(200).json({
      success: true,
      data: populatedTask,
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating task",
    });
  }
};

/**
 * Add attachments to a task
 */
const addTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Find the project to check permissions
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Associated project not found",
      });
    }

    // Check if user has permission to update this task
    if (
      req.user.role !== "admin" &&
      !(
        req.user.role === "project manager" &&
        project.projectManager.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admins and project managers can add attachments",
      });
    }

    // Process uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    // Validate file types and sizes if needed
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = req.files.filter((file) => file.size > maxFileSize);

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some files exceed the maximum size of 10MB: ${invalidFiles
          .map((f) => f.originalname)
          .join(", ")}`,
      });
    }

    // Create attachments
    const attachments = req.files.map((file) => {
      // Determine file type
      let fileType = "other";
      if (file.mimetype.startsWith("image/")) {
        fileType = "image";
      } else if (
        file.mimetype === "application/pdf" ||
        file.mimetype.includes("word") ||
        file.mimetype.includes("excel") ||
        file.mimetype.includes("text")
      ) {
        fileType = "document";
      }

      return {
        name: file.originalname,
        url: `/uploads/tasks/${file.filename}`,
        fileType,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      };
    });

    // Add attachments to task
    task.attachments.push(...attachments);

    // Add to change log
    const changes = {
      attachments: {
        action: "added",
        count: attachments.length,
        names: attachments.map((a) => a.name),
      },
    };

    addToChangeLog(task, changes, req.user);
    await task.save();

    // Return the populated task for a more complete response
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email image")
      .populate("project", "name")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "attachments.uploadedBy",
        select: "name email",
      });

    return res.status(200).json({
      success: true,
      data: populatedTask,
      message: "Attachments added successfully",
    });
  } catch (error) {
    console.error("Error adding attachments:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error adding attachments",
    });
  }
};

/**
 * Remove attachments from a task
 */
const removeTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { attachmentIds } = req.body;

    if (
      !attachmentIds ||
      !Array.isArray(attachmentIds) ||
      attachmentIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No attachment IDs provided",
      });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Find the project to check permissions
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Associated project not found",
      });
    }

    // Check if user has permission to update this task
    if (
      req.user.role !== "admin" &&
      !(
        req.user.role === "project manager" &&
        project.projectManager.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admins and project managers can remove attachments",
      });
    }

    // Find attachments to delete
    const attachmentsToDelete = task.attachments.filter((attachment) =>
      attachmentIds.includes(attachment._id.toString())
    );

    // Check if all requested attachments exist
    if (attachmentsToDelete.length !== attachmentIds.length) {
      const foundIds = attachmentsToDelete.map((a) => a._id.toString());
      const notFoundIds = attachmentIds.filter((id) => !foundIds.includes(id));

      return res.status(400).json({
        success: false,
        message: `Some attachment IDs were not found: ${notFoundIds.join(
          ", "
        )}`,
      });
    }

    // Delete files from filesystem
    for (const attachment of attachmentsToDelete) {
      try {
        const filePath = path.join(process.cwd(), attachment.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        } else {
          console.warn(
            `File not found for attachment: ${attachment.name} (${attachment._id}), removing from DB only`
          );
        }
      } catch (error) {
        console.error(
          `Error deleting file for attachment ${attachment.name} (${attachment._id}):`,
          error
        );
        // Continue even if file deletion fails
      }
    }

    // Remove attachments from task
    task.attachments = task.attachments.filter(
      (attachment) => !attachmentIds.includes(attachment._id.toString())
    );

    // Add to change log
    const changes = {
      attachments: {
        action: "removed",
        count: attachmentsToDelete.length,
        names: attachmentsToDelete.map((a) => a.name),
      },
    };

    addToChangeLog(task, changes, req.user);
    await task.save();

    // Return the populated task for a more complete response
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email image")
      .populate("project", "name")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "attachments.uploadedBy",
        select: "name email",
      });

    return res.status(200).json({
      success: true,
      data: populatedTask,
      message: "Attachments removed successfully",
    });
  } catch (error) {
    console.error("Error removing attachments:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error removing attachments",
    });
  }
};

/**
 * Add work evidence to a task
 */
const addWorkEvidence = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check permissions based on role
    const isAdmin = req.user.role === "admin";
    const isProjectManager =
      req.user.role === "project manager" &&
      task.project &&
      (await Project.findById(task.project))?.projectManager.equals(
        req.user._id
      );
    const isAssignedTechnician =
      req.user.role === "technician" &&
      task.assignedTo &&
      task.assignedTo.equals(req.user._id);

    if (!isAdmin && !isProjectManager && !isAssignedTechnician) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add work evidence to this task",
      });
    }

    // Process uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    // Validate file types
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const invalidTypeFiles = req.files.filter(
      (file) => !allowedMimeTypes.includes(file.mimetype)
    );

    if (invalidTypeFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some files have invalid types: ${invalidTypeFiles
          .map((f) => f.originalname)
          .join(", ")}. Only JPEG, PNG, GIF, and WebP images are allowed.`,
      });
    }

    // Validate file sizes
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = req.files.filter((file) => file.size > maxFileSize);

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some files exceed the maximum size of 10MB: ${invalidFiles
          .map((f) => f.originalname)
          .join(", ")}`,
      });
    }

    // Create work evidence items
    const workEvidenceItems = req.files.map((file) => {
      return {
        imageUrl: `/uploads/tasks/${file.filename}`,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        originalName: file.originalname, // Add original filename
      };
    });

    // Add work evidence to task
    task.workEvidence.push(...workEvidenceItems);

    // Add to change log
    const changes = {
      workEvidence: {
        action: "added",
        count: workEvidenceItems.length,
        names: workEvidenceItems.map((item) => item.originalName),
      },
    };

    addToChangeLog(task, changes, req.user);
    await task.save();

    // Return the populated task for a more complete response
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email image")
      .populate("project", "name")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "workEvidence.uploadedBy",
        select: "name email image",
      });

    return res.status(200).json({
      success: true,
      data: populatedTask,
      message: "Work evidence added successfully",
    });
  } catch (error) {
    console.error("Error adding work evidence:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error adding work evidence",
    });
  }
};

/**
 * Remove work evidence from a task
 */
const removeWorkEvidence = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { evidenceIds } = req.body;

    if (
      !evidenceIds ||
      !Array.isArray(evidenceIds) ||
      evidenceIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No evidence IDs provided",
      });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Find the project to check permissions
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Associated project not found",
      });
    }

    // Check permissions
    const isAdmin = req.user.role === "admin";
    const isProjectManager =
      req.user.role === "project manager" &&
      project.projectManager.equals(req.user._id);
    const isAssignedTechnician =
      req.user.role === "technician" &&
      task.assignedTo &&
      task.assignedTo.equals(req.user._id);

    if (!isAdmin && !isProjectManager && !isAssignedTechnician) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to remove work evidence from this task",
      });
    }

    // Prevent technicians from removing evidence if task is in review or completed
    if (
      isAssignedTechnician &&
      (task.status === "In Review" || task.status === "Completed")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Cannot remove work evidence when task is in review or completed",
      });
    }

    // Find evidence to delete
    const evidenceToDelete = task.workEvidence.filter((evidence) =>
      evidenceIds.includes(evidence._id.toString())
    );

    // Check if all requested evidence exists
    if (evidenceToDelete.length !== evidenceIds.length) {
      const foundIds = evidenceToDelete.map((e) => e._id.toString());
      const notFoundIds = evidenceIds.filter((id) => !foundIds.includes(id));

      return res.status(400).json({
        success: false,
        message: `Some evidence IDs were not found: ${notFoundIds.join(", ")}`,
      });
    }

    // Delete files from filesystem
    for (const evidence of evidenceToDelete) {
      try {
        const filePath = path.join(process.cwd(), evidence.imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        } else {
          console.warn(
            `File not found for evidence: ${
              evidence.originalName || "unnamed"
            } (${evidence._id}), removing from DB only`
          );
        }
      } catch (error) {
        console.error(
          `Error deleting file for evidence ${
            evidence.originalName || "unnamed"
          } (${evidence._id}):`,
          error
        );
        // Continue even if file deletion fails
      }
    }

    // Remove evidence from task
    task.workEvidence = task.workEvidence.filter(
      (evidence) => !evidenceIds.includes(evidence._id.toString())
    );

    // Add to change log
    const changes = {
      workEvidence: {
        action: "removed",
        count: evidenceToDelete.length,
        names: evidenceToDelete.map((e) => e.originalName || "unnamed file"),
      },
    };

    addToChangeLog(task, changes, req.user);
    await task.save();

    // Return the populated task for a more complete response
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email image")
      .populate("project", "name")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "workEvidence.uploadedBy",
        select: "name email image",
      });

    return res.status(200).json({
      success: true,
      data: populatedTask,
      message: "Work evidence removed successfully",
    });
  } catch (error) {
    console.error("Error removing work evidence:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error removing work evidence",
    });
  }
};

/**
 * Add changes to a task's change log
 * @param {Object} task - The task document to update
 * @param {Object} changes - Object containing the changes made
 * @param {Object} user - The user making the changes
 * @param {String} message - Optional custom message
 */
const addToChangeLog = (task, changes, user, message = null) => {
  if (Object.keys(changes).length > 0) {
    task.changeLog.push({
      updatedBy: user._id,
      updatedAt: new Date(),
      changes,
      message: message || `Task updated by ${user.name || user.email}`,
    });

    // Update lastUpdatedBy field
    task.lastUpdatedBy = user._id;
  }
  return task;
};

/**
 * Delete a task
 */
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Find the project to check permissions
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Associated project not found",
      });
    }

    // Check if user has permission to delete this task
    if (req.user.role !== "admin") {
      if (req.user.role !== "project manager") {
        return res.status(403).json({
          success: false,
          message: "Only admins and project managers can delete tasks",
        });
      }

      // Project managers can only delete tasks for their assigned projects
      if (!project.projectManager.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "You can only delete tasks for projects you manage",
        });
      }
    }

    // Delete attachment files from the filesystem
    if (task.attachments && task.attachments.length > 0) {
      for (const attachment of task.attachments) {
        try {
          const filePath = path.join(process.cwd(), attachment.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          } else {
            console.warn(
              `File not found for attachment: ${attachment.name} (${attachment._id}), skipping deletion`
            );
          }
        } catch (error) {
          console.error(
            `Error deleting attachment file: ${attachment.name}`,
            error
          );
          // Continue even if file deletion fails
        }
      }
    }

    // Delete work evidence files from the filesystem
    if (task.workEvidence && task.workEvidence.length > 0) {
      for (const evidence of task.workEvidence) {
        try {
          const filePath = path.join(process.cwd(), evidence.imageUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          } else {
            console.warn(
              `File not found for work evidence: ${
                evidence.originalName || "unnamed"
              } (${evidence._id}), skipping deletion`
            );
          }
        } catch (error) {
          console.error(
            `Error deleting work evidence file: ${
              evidence.originalName || "unnamed"
            }`,
            error
          );
          // Continue even if file deletion fails
        }
      }
    }

    // Delete the task using findOneAndDelete to trigger the pre-hook
    await Task.findOneAndDelete({ _id: taskId });

    return res.status(200).json({
      success: true,
      data: { taskId },
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting task",
    });
  }
};

const updateTaskPosition = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Validate status
    if (!["To Do", "In Progress", "In Review", "Completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status specified",
      });
    }

    // Update task status
    task.status = status;
    task.lastUpdatedBy = req.user._id;

    // Add to change log
    task.changeLog.push({
      updatedBy: req.user._id,
      updatedAt: new Date(),
      changes: { status: { from: task.status, to: status } },
      message: `Task status updated to ${status}`,
    });

    await task.save();

    return res.status(200).json({
      success: true,
      data: task,
      message: "Task status updated successfully",
    });
  } catch (error) {
    console.error("Error updating task position:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating task position",
    });
  }
};

/**
 * Add comment to a task
 */
const addTaskComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Add comment
    task.comments.push({
      user: userId,
      content: content.trim(),
      createdAt: new Date(),
    });

    await task.save();

    // Populate and return updated task
    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email image")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "comments.user",
        select: "name email image",
      })
      .populate({
        path: "privateMessages.sender",
        select: "name email image role",
      })
      .populate({
        path: "privateMessages.recipient",
        select: "name email image role",
      });

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding comment",
    });
  }
};

/**
 * Delete comment from a task
 */
const deleteTaskComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can delete comment (comment author or admin)
    if (!comment.user.equals(userId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this comment",
      });
    }

    task.comments.pull(commentId);
    await task.save();

    // Populate and return updated task
    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email image")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "comments.user",
        select: "name email image",
      })
      .populate({
        path: "privateMessages.sender",
        select: "name email image role",
      })
      .populate({
        path: "privateMessages.recipient",
        select: "name email image role",
      });

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting comment",
    });
  }
};

/**
 * Add private message to a task
 */
const addTaskPrivateMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, recipientId } = req.body;
    const senderId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    // Add private message
    task.privateMessages.push({
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      createdAt: new Date(),
    });

    await task.save();

    // Populate and return updated task
    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email image")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "comments.user",
        select: "name email image",
      })
      .populate({
        path: "privateMessages.sender",
        select: "name email image role",
      })
      .populate({
        path: "privateMessages.recipient",
        select: "name email image role",
      });

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: "Private message sent successfully",
    });
  } catch (error) {
    console.error("Error adding private message:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding private message",
    });
  }
};

/**
 * Delete private message from a task
 */
const deleteTaskPrivateMessage = async (req, res) => {
  try {
    const { taskId, messageId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const message = task.privateMessages.id(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Private message not found",
      });
    }

    // Check if user can delete message (sender, recipient, or admin)
    if (
      !message.sender.equals(userId) &&
      !message.recipient.equals(userId) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this message",
      });
    }

    task.privateMessages.pull(messageId);
    await task.save();

    // Populate and return updated task
    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email image")
      .populate("lastUpdatedBy", "name email role")
      .populate({
        path: "comments.user",
        select: "name email image",
      })
      .populate({
        path: "privateMessages.sender",
        select: "name email image role",
      })
      .populate({
        path: "privateMessages.recipient",
        select: "name email image role",
      });

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: "Private message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting private message:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting private message",
    });
  }
};

export {
  getProjectTasks,
  createTask,
  updateTask,
  addTaskAttachments,
  removeTaskAttachments,
  addWorkEvidence,
  removeWorkEvidence,
  deleteTask,
  updateTaskPosition,
  addTaskComment,
  deleteTaskComment,
  addTaskPrivateMessage,
  deleteTaskPrivateMessage,
};
