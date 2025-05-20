import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const NotificationBell: React.FC<{ className?: string }> = ({ className }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
    const [open, setOpen] = useState(false);

    // Limit to only show 5 most recent notifications in dropdown
    const recentNotifications = notifications.slice(0, 5);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
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

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild className={cn(``, className)}>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center"
                            variant="destructive"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-medium">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={loading}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <>
                            <div className="divide-y">
                                {recentNotifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 hover:bg-muted/50 cursor-pointer ${!notification.read ? 'bg-muted/20' : ''}`}
                                        onClick={() => handleMarkAsRead(notification._id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                                {getNotificationContent(notification)}
                                            </p>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-primary mt-1"></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {notifications.length > 5 && (
                                <div className="p-3 text-center border-t">
                                    <Link
                                        to="/notifications"
                                        onClick={() => setOpen(false)}

                                    >
                                        <Button>View all notifications ({notifications.length})</Button>
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;