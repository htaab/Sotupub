import User from "../models/User.js";

const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      isActive,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Validate role if provided
    if (
      role &&
      ![
        "admin",
        "client",
        "project manager",
        "stock manager",
        "technician",
      ].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Validate isActive if provided
    if (isActive !== undefined && isActive !== null) {
      const boolValue = isActive.toLowerCase();
      if (boolValue !== "true" && boolValue !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean value",
        });
      }
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

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== null) {
      query.isActive = isActive.toLowerCase() === "true";
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

export { getUsers };
