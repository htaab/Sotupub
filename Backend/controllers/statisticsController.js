import Project from "../models/Project.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

// Get project completion statistics
export const getProjectCompletionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { user } = req;

    // Default to 6 months if no date range provided
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 6);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : new Date();

    let matchCondition = {
      createdAt: { $gte: start, $lte: end },
    };

    if (user.role === "technician") {
      const userTasks = await Task.find({ assignedTo: user._id }).distinct(
        "project"
      );
      matchCondition._id = { $in: userTasks };
    } else if (user.role !== "admin") {
      matchCondition.$or = [
        { client: req.user._id },
        { projectManager: req.user._id },
        { stockManager: req.user._id },
      ];
    }

    const stats = await Project.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const completed = stats.find((s) => s._id === "Completed")?.count || 0;
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

    res.json({
      success: true,
      data: {
        total,
        completed,
        completionPercentage,
        statusBreakdown: stats,
        dateRange: { start, end },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching project completion statistics",
      error: error.message,
    });
  }
};

// Get user statistics (admin only)
export const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        roleBreakdown: stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
};

// Get incomplete projects for project manager/technician
export const getIncompleteProjectsCount = async (req, res) => {
  try {
    const { user } = req;
    let matchCondition = {
      status: { $nin: ["Completed", "Cancelled"] },
    };

    if (user.role === "technician") {
      const userTasks = await Task.find({ assignedTo: user._id }).distinct(
        "project"
      );
      matchCondition._id = { $in: userTasks };
    } else if (user.role !== "admin") {
      matchCondition.$or = [
        { client: req.user._id },
        { projectManager: req.user._id },
        { stockManager: req.user._id },
      ];
    }

    const count = await Project.countDocuments(matchCondition);

    res.json({
      success: true,
      data: { incompleteProjects: count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching incomplete projects count",
      error: error.message,
    });
  }
};

// Get product manager specific statistics
export const getProductManagerStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 6);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : new Date();

    // Projects by status over time
    const projectTrends = await Project.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Average project duration
    const avgDuration = await Project.aggregate([
      {
        $match: {
          status: "Completed",
          endDate: { $exists: true },
          beginDate: { $exists: true },
        },
      },
      {
        $project: {
          duration: {
            $divide: [
              { $subtract: ["$endDate", "$beginDate"] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$duration" },
        },
      },
    ]);

    // Resource utilization (technicians)
    const technicianUtilization = await User.aggregate([
      {
        $match: { role: "technician" },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "assignedTo",
          as: "assignedTasks",
        },
      },
      {
        $project: {
          name: 1,
          totalTasks: { $size: "$assignedTasks" },
          completedTasks: {
            $size: {
              $filter: {
                input: "$assignedTasks",
                cond: { $eq: ["$$this.status", "Completed"] },
              },
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        projectTrends,
        averageProjectDuration: avgDuration[0]?.avgDuration || 0,
        technicianUtilization,
        dateRange: { start, end },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product manager statistics",
      error: error.message,
    });
  }
};
