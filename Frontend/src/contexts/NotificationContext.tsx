import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/axios';

export interface Notification {
    _id: string;
    type: string;
    data: any;
    read: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { accessToken, user } = useAuthStore();

    // Initialize socket connection
    useEffect(() => {
        let socketInstance: Socket | null = null;
        
        const connectSocket = () => {
            if (!accessToken || !user) return;
            
            // Clear any previous error
            setError(null);
            
            const socketUrl = import.meta.env.VITE_API_URL;
            console.log('Attempting to connect to Socket.IO server at:', socketUrl);
            
            // Create socket instance with improved options
            socketInstance = io(socketUrl, {
                auth: {
                    token: accessToken,
                },
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000, // Increase timeout to 10 seconds
                forceNew: true, // Force a new connection
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected successfully');
                setError(null);
            });

            socketInstance.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setError('Failed to connect to notification service');
            });

            socketInstance.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                // Automatically attempt to reconnect if disconnected unexpectedly
                if (reason === 'io server disconnect') {
                    // The server has forcefully disconnected the socket
                    socketInstance?.connect();
                }
            });

            socketInstance.on('notification', (notification: Notification) => {
                // Add new notification to the list
                setNotifications(prev => [notification, ...prev]);
                // Increment unread count
                setUnreadCount(prev => prev + 1);
            });

            setSocket(socketInstance);
        };

        connectSocket();

        // Cleanup on unmount
        return () => {
            if (socketInstance) {
                console.log('Cleaning up socket connection');
                socketInstance.off('connect');
                socketInstance.off('connect_error');
                socketInstance.off('disconnect');
                socketInstance.off('notification');
                socketInstance.disconnect();
            }
        };
    }, [accessToken, user]);

    // Fetch initial notifications with pagination
    const fetchNotifications = async () => {
        if (!accessToken) return;

        try {
            setLoading(true);
            const response = await api.get('/notifications', {
                params: {
                    limit: 20, // Limit to 20 notifications
                    page: 1,   // First page
                }
            });

            if (response.data.success) {
                setNotifications(response.data.data.notifications);
                fetchUnreadCount();
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        if (!accessToken) return;

        try {
            const response = await api.get('/notifications/unread-count');

            if (response.data.success) {
                setUnreadCount(response.data.data.count);
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    // Mark notification as read
    const markAsRead = async (id: string) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`);

            if (response.data.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif =>
                        notif._id === id ? { ...notif, read: true } : notif
                    )
                );
                fetchUnreadCount();
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError('Failed to mark notification as read');
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const response = await api.patch('/notifications/mark-all-read');

            if (response.data.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, read: true }))
                );
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            setError('Failed to mark all notifications as read');
        }
    };

    // Load initial data
    useEffect(() => {
        if (accessToken) {
            fetchNotifications();
        }
    }, [accessToken]);

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};