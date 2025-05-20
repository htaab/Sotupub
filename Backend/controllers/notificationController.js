import notificationService from "../services/notificationService.js";

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, read } = req.query;
    
    // Enforce maximum limit to prevent excessive queries
    const parsedLimit = Math.min(parseInt(limit), 50);
    
    const readFilter =
      read === "true" ? true : read === "false" ? false : undefined;

    const result = await notificationService.getUserNotifications(
      req.user._id,
      {
        page: parseInt(page),
        limit: parsedLimit,
        read: readFilter,
      }
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Notifications fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching notifications",
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(
      notificationId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error marking notification as read",
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);

    return res.status(200).json({
      success: true,
      data: result,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error marking all notifications as read",
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);

    return res.status(200).json({
      success: true,
      data: { count },
      message: "Unread count fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching unread count",
    });
  }
};
