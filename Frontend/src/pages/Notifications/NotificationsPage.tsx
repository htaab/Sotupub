import React, { useState, useEffect } from 'react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import api from '@/lib/axios';
import { Loader2 } from 'lucide-react';

interface NotificationGroup {
    title: string;
    notifications: Notification[];
}

const NotificationsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const { markAsRead, markAllAsRead } = useNotifications();

    const fetchNotifications = async (reset = false) => {
        try {
            setLoading(true);
            const newPage = reset ? 1 : page;
            const readParam = activeTab === 'unread' ? 'false' : undefined;

            const response = await api.get('/notifications', {
                params: {
                    page: newPage,
                    limit,
                    read: readParam
                }
            });

            if (response.data.success) {
                const { notifications: newNotifications, pagination } = response.data.data;

                if (reset) {
                    setNotifications(newNotifications);
                    setPage(1);
                } else {
                    setNotifications(prev => [...prev, ...newNotifications]);
                }

                setTotalCount(pagination.total);
                setHasMore(newPage < pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(true);
    }, [activeTab]);

    const loadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
            fetchNotifications();
        }
    };

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        // Update local state to mark as read
        setNotifications(prev =>
            prev.map(notif =>
                notif._id === id ? { ...notif, read: true } : notif
            )
        );
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        // Update local state
        setNotifications(prev =>
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    const getNotificationContent = (notification: Notification) => {
        const { type, data } = notification;

        switch (type) {
            case 'project_assigned':
                return `You've been assigned to project: ${data.projectName}`;
            case 'task_assigned':
                return `New task assigned: ${data.taskName}`;
            case 'task_updated':
                return `Task updated: ${data.taskName}`;
            case 'comment_added':
                return `New comment on task: ${data.taskName}`;
            case 'product_low_stock':
                return `Low stock alert: ${data.productName}`;
            default:
                return 'New notification';
        }
    };

    // Group notifications by date
    const groupNotifications = (notifications: Notification[]): NotificationGroup[] => {
        const groups: NotificationGroup[] = [];
        const today: Notification[] = [];
        const yesterday: Notification[] = [];
        const thisWeek: Notification[] = [];
        const older: Notification[] = [];

        notifications.forEach(notification => {
            const date = new Date(notification.createdAt);
            if (isToday(date)) {
                today.push(notification);
            } else if (isYesterday(date)) {
                yesterday.push(notification);
            } else if (isThisWeek(date)) {
                thisWeek.push(notification);
            } else {
                older.push(notification);
            }
        });

        if (today.length) groups.push({ title: 'Today', notifications: today });
        if (yesterday.length) groups.push({ title: 'Yesterday', notifications: yesterday });
        if (thisWeek.length) groups.push({ title: 'This Week', notifications: thisWeek });
        if (older.length) groups.push({ title: 'Older', notifications: older });

        return groups;
    };

    const notificationGroups = groupNotifications(notifications);

    return (
        <div className="container py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Notifications</h1>
                {activeTab === 'unread' && notifications.some(n => !n.read) && (
                    <Button onClick={handleMarkAllAsRead} variant="outline">
                        Mark all as read
                    </Button>
                )}
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
                <TabsList className="mb-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6">
                    {notificationGroups.map((group, index) => (
                        <div key={index}>
                            <h2 className="text-lg font-medium mb-3">{group.title}</h2>
                            <div className="space-y-2">
                                {group.notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 rounded-lg border ${!notification.read ? 'bg-muted/20' : ''}`}
                                    >
                                        <div className="flex justify-between">
                                            <div>
                                                <p className={`${!notification.read ? 'font-medium' : ''}`}>
                                                    {getNotificationContent(notification)}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                >
                                                    Mark as read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </TabsContent>

                <TabsContent value="unread" className="space-y-6">
                    {notificationGroups.map((group, index) => (
                        <div key={index}>
                            <h2 className="text-lg font-medium mb-3">{group.title}</h2>
                            <div className="space-y-2">
                                {group.notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className="p-4 rounded-lg border bg-muted/20"
                                    >
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {getNotificationContent(notification)}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkAsRead(notification._id)}
                                            >
                                                Mark as read
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>

            {hasMore && (
                <div className="mt-6 text-center">
                    <Button
                        onClick={loadMore}
                        disabled={loading}
                        variant="outline"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}

            {!loading && notifications.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No notifications found</p>
                </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground text-center">
                Showing {notifications.length} of {totalCount} notifications
            </div>
        </div>
    );
};

export default NotificationsPage;