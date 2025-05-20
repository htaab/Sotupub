import { EventEmitter } from "events";
import Notification from "../models/Notification.js";

class NotificationService {
  constructor() {
    this.emitter = new EventEmitter();
  }

  async notifyUser({ to, type, data }) {
    try {
      // Create and save notification to database
      const notification = await Notification.create({
        to,
        type,
        data,
      });

      // Emit event for real-time delivery
      this.emitter.emit("push", {
        userId: to.toString(),
        notification: {
          _id: notification._id,
          type: notification.type,
          data: notification.data,
          read: notification.read,
          createdAt: notification.createdAt,
        },
      });

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getUserNotifications(userId, { limit = 20, page = 1, read } = {}) {
    try {
      const query = { to: userId };

      // Filter by read status if specified
      if (read !== undefined) {
        query.read = read;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Notification.countDocuments(query);

      return {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, to: userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        throw new Error("Notification not found or not authorized");
      }

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { to: userId, read: false },
        { read: true }
      );

      return { success: true, count: result.modifiedCount };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ to: userId, read: false });
    } catch (error) {
      console.error("Error counting unread notifications:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService;
