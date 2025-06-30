import { useState, useEffect } from "react";
import { Task, UpdateTaskRequest } from "@/types/task";
import { useAuthStore } from "@/store/auth-store";
import { taskService } from "@/services/taskService";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Image,
    MessageSquare,
    Paperclip,
    Trash2,
    User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import DeleteEntityModal from "../Forms/common/DeleteEntityModal";
import { User } from "@/types/auth";
import { Project } from "@/types/project";

interface TaskModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdate?: () => void;
    project: Project;
}

const TaskModal = ({ task, isOpen, onClose, onTaskUpdate, project }: TaskModalProps) => {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editForm, setEditForm] = useState<UpdateTaskRequest>({});
    const [newComment, setNewComment] = useState("");
    const [newPrivateMessage, setNewPrivateMessage] = useState("");
    const [selectedTechnician, setSelectedTechnician] = useState<string>("");
    const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
    const [workEvidenceFiles, setWorkEvidenceFiles] = useState<File[]>([]);

    // Check user permissions
    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project manager';
    const isTechnician = user?.role === 'technician';
    const isAssignedTechnician = isTechnician &&
        (typeof task.assignedTo === 'string' ? task.assignedTo === user._id : task.assignedTo._id === user._id);

    const canEdit = isAdmin || isProjectManager;
    const canDelete = isAdmin || isProjectManager;
    const canAddAttachments = isAdmin || isProjectManager;
    const canAddWorkEvidence = isAdmin || isProjectManager || isAssignedTechnician;
    const canComment = isAdmin || isProjectManager || isAssignedTechnician;
    const canSendPrivateMessage = isAdmin || isProjectManager || isAssignedTechnician;

    // Local state for optimistic updates
    const [localTask, setLocalTask] = useState<Task>(task);

    useEffect(() => {
        setLocalTask(task);
        if (isOpen) {
            setEditForm({
                name: task.name,
                description: task.description,
                beginDate: task.beginDate,
                endDate: task.endDate,
                priority: task.priority,
                status: task.status,
            });
        }
    }, [isOpen, task]);

    const handleUpdateTask = async () => {
        if (!canEdit) return;

        setIsLoading(true);
        try {
            const response = await taskService.updateTask(task._id, editForm);
            const updatedTask = response.data;
            setLocalTask(updatedTask);
            setIsEditing(false);
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Failed to update task');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAttachment = async () => {
        if (!canAddAttachments || attachmentFiles.length === 0) return;

        setIsLoading(true);
        try {
            const response = await taskService.addAttachment(task._id, attachmentFiles);
            const updatedTask = response.data;
            setLocalTask(updatedTask);
            toast.success('Attachments added successfully');
            setAttachmentFiles([]);
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            console.error('Error adding attachments:', error);
            toast.error('Failed to add attachments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddWorkEvidence = async () => {
        if (!canAddWorkEvidence || workEvidenceFiles.length === 0) return;

        setIsLoading(true);
        try {
            const response = await taskService.addWorkEvidence(task._id, workEvidenceFiles);
            const updatedTask = response.data;
            setLocalTask(updatedTask);
            toast.success('Work evidence added successfully');
            setWorkEvidenceFiles([]);
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            console.error('Error adding work evidence:', error);
            toast.error('Failed to add work evidence');
        } finally {
            setIsLoading(false);
        }
    };

    const getAssignedUserName = () => {
        if (typeof localTask.assignedTo === 'string') return localTask.assignedTo;
        return localTask.assignedTo?.name || 'Unassigned';
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        // Optimistic update
        const optimisticComment = {
            _id: `temp-${Date.now()}`,
            content: newComment.trim(),
            user: user!,
            createdAt: new Date().toISOString(),
        };

        const updatedComments = [...(localTask.comments || []), optimisticComment];
        setLocalTask(prev => ({ ...prev, comments: updatedComments }));
        setNewComment('');

        setIsLoading(true);
        try {
            const response = await taskService.addComment(task._id, newComment.trim());
            const updatedTask = response.data;
            setLocalTask(updatedTask);
            toast.success('Comment added successfully');
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            // Rollback optimistic update
            setLocalTask(prev => ({ ...prev, comments: localTask.comments }));
            setNewComment(newComment);
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPrivateMessage = async () => {
        if (!newPrivateMessage.trim()) return;

        let recipientId = '';

        if (isAdmin || isProjectManager) {
            if (!selectedTechnician) {
                toast.error('Please select a technician to send the message to');
                return;
            }
            recipientId = selectedTechnician;
        } else if (isTechnician) {
            // Technician sends to project manager
            recipientId = typeof project.projectManager === 'string' ? project.projectManager : project.projectManager._id;
        }

        if (!recipientId) {
            toast.error('No recipient available for private message');
            return;
        }

        // Optimistic update
        const optimisticMessage = {
            _id: `temp-${Date.now()}`,
            content: newPrivateMessage.trim(),
            sender: user!,
            recipient: recipientId,
            createdAt: new Date().toISOString(),
        };

        const updatedMessages = [...(localTask.privateMessages || []), optimisticMessage];
        setLocalTask(prev => ({ ...prev, privateMessages: updatedMessages }));
        setNewPrivateMessage('');

        try {
            const response = await taskService.addPrivateMessage(task._id, newPrivateMessage.trim(), recipientId);
            const updatedTask = response.data;
            setLocalTask(updatedTask);
            toast.success('Private message sent successfully');
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            // Rollback optimistic update
            setLocalTask(prev => ({ ...prev, privateMessages: localTask.privateMessages }));
            setNewPrivateMessage(newPrivateMessage);
            console.error('Error adding private message:', error);
            toast.error('Failed to send private message');
        }
    };

    // Filter private messages based on user role
    const getFilteredPrivateMessages = () => {
        if (!localTask.privateMessages) return [];

        if (isAdmin) {
            // Admin can see all messages, but filter by selected technician if one is selected
            if (selectedTechnician) {
                return localTask.privateMessages.filter(msg =>
                    (typeof msg.sender === 'string' ? msg.sender === selectedTechnician : msg.sender._id === selectedTechnician) ||
                    (typeof msg.recipient === 'string' ? msg.recipient === selectedTechnician : msg.recipient._id === selectedTechnician)
                );
            }
            return localTask.privateMessages;
        } else if (isProjectManager) {
            // Project manager can see all messages, but filter by selected technician if one is selected
            if (selectedTechnician) {
                return localTask.privateMessages.filter(msg =>
                    (typeof msg.sender === 'string' ? msg.sender === selectedTechnician : msg.sender._id === selectedTechnician) ||
                    (typeof msg.recipient === 'string' ? msg.recipient === selectedTechnician : msg.recipient._id === selectedTechnician)
                );
            }
            return localTask.privateMessages;
        } else if (isTechnician) {
            // Technician can only see messages involving them
            return localTask.privateMessages.filter(msg =>
                (typeof msg.sender === 'string' ? msg.sender === user._id : msg.sender._id === user._id) ||
                (typeof msg.recipient === 'string' ? msg.recipient === user._id : msg.recipient._id === user._id)
            );
        }

        return [];
    };

    const technicinesList = () => {
        const assigned = localTask.assignedTo;
        if (Array.isArray(assigned)) return assigned as User[];
        if (typeof assigned === 'object') return [assigned] as User[];
        return []; // or maybe fetch User by ID if it's a string
    }

    // Get list of technicians for filtering (for admin and project manager)
    // const getTechniciansForFiltering = () => {
    //     if (!localTask.privateMessages) return [];

    //     const technicians = new Set<string>();
    //     localTask.privateMessages.forEach(msg => {
    //         const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
    //         const senderRole = typeof msg.sender === 'string' ? null : msg.sender.role;
    //         const recipientId = typeof msg.recipient === 'string' ? msg.recipient : msg.recipient._id;
    //         const recipientRole = typeof msg.recipient === 'string' ? null : msg.recipient.role;

    //         if (senderRole === 'technician') {
    //             technicians.add(senderId);
    //         }
    //         if (recipientRole === 'technician') {
    //             technicians.add(recipientId);
    //         }
    //     });

    //     return Array.from(technicians).map(techId => {
    //         const tech = localTask.privateMessages?.find(msg =>
    //             (typeof msg.sender === 'string' ? msg.sender === techId : msg.sender._id === techId) ||
    //             (typeof msg.recipient === 'string' ? msg.recipient === techId : msg.recipient._id === techId)
    //         );

    //         if (tech) {
    //             const techUser = typeof tech.sender === 'string' ? null :
    //                 (tech.sender._id === techId ? tech.sender :
    //                     typeof tech.recipient === 'string' ? null : tech.recipient);
    //             return {
    //                 _id: techId,
    //                 name: techUser?.name || 'Unknown Technician'
    //             };
    //         }
    //         return null;
    //     }).filter(Boolean);
    // };

    const handleSelectedTechnician = (value: string) => {
        if (value === "all") setSelectedTechnician("");
        else setSelectedTechnician(value);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">
                            {isEditing ? (
                                <Input
                                    value={editForm.name || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="text-xl font-semibold"
                                />
                            ) : (
                                localTask.name
                            )}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{localTask.status}</Badge>
                            <Badge variant={localTask.priority === 'Urgent' ? 'destructive' : 'secondary'}>
                                {localTask.priority}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                        {/* Task Details Section */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Begin Date</Label>
                                    {isEditing ? (
                                        <Input
                                            type="date"
                                            value={editForm.beginDate ? format(new Date(editForm.beginDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, beginDate: e.target.value }))}
                                        />
                                    ) : (
                                        <p className="text-sm">{format(new Date(localTask.beginDate), 'PPP')}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">End Date</Label>
                                    {isEditing ? (
                                        <Input
                                            type="date"
                                            value={editForm.endDate ? format(new Date(editForm.endDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                                        />
                                    ) : (
                                        <p className="text-sm">{format(new Date(localTask.endDate), 'PPP')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Priority</Label>
                                    {isEditing ? (
                                        <Select
                                            value={editForm.priority}
                                            onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value as Task["priority"] }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-sm">{localTask.priority}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    {isEditing ? (
                                        <Select
                                            value={editForm.status}
                                            onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as Task["status"] }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="To Do">To Do</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="In Review">In Review</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-sm">{localTask.status}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Assigned To</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <UserIcon className="h-4 w-4" />
                                    <span className="text-sm">{getAssignedUserName()}</span>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Description</Label>
                                {isEditing ? (
                                    <Textarea
                                        value={editForm.description || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                    />
                                ) : (
                                    <p className="text-sm mt-1">{localTask.description}</p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {canEdit && (
                                <>
                                    {isEditing ? (
                                        <>
                                            <Button onClick={handleUpdateTask} disabled={isLoading}>
                                                Save Changes
                                            </Button>
                                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setIsEditing(true)}>
                                            Edit Task
                                        </Button>
                                    )}
                                </>
                            )}

                            {canAddAttachments && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        multiple
                                        onChange={(e) => setAttachmentFiles(Array.from(e.target.files || []))}
                                        className="hidden"
                                        id="attachment-upload"
                                    />
                                    <Label htmlFor="attachment-upload" className="cursor-pointer">
                                        <Button variant="outline" asChild>
                                            <span>
                                                <Paperclip className="h-4 w-4 mr-2" />
                                                Add Attachment
                                            </span>
                                        </Button>
                                    </Label>
                                    {attachmentFiles.length > 0 && (
                                        <Button onClick={handleAddAttachment} disabled={isLoading}>
                                            Upload ({attachmentFiles.length})
                                        </Button>
                                    )}
                                </div>
                            )}

                            {canAddWorkEvidence && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => setWorkEvidenceFiles(Array.from(e.target.files || []))}
                                        className="hidden"
                                        id="evidence-upload"
                                    />
                                    <Label htmlFor="evidence-upload" className="cursor-pointer">
                                        <Button variant="outline" asChild>
                                            <span>
                                                <Image className="h-4 w-4 mr-2" />
                                                Add Work Evidence
                                            </span>
                                        </Button>
                                    </Label>
                                    {workEvidenceFiles.length > 0 && (
                                        <Button onClick={handleAddWorkEvidence} disabled={isLoading}>
                                            Upload ({workEvidenceFiles.length})
                                        </Button>
                                    )}
                                </div>
                            )}

                            {canDelete && (
                                <DeleteEntityModal
                                    entity={localTask}
                                    entityName={localTask.name}
                                    entityType="Task"
                                    deleteFunction={async (id) => {
                                        try {
                                            await taskService.deleteTask(id);
                                            if (onTaskUpdate) onTaskUpdate();
                                            onClose();
                                            return { success: true };
                                        } catch (error) {
                                            console.error('Error deleting task:', error);
                                            return { success: false, message: 'Failed to delete task' };
                                        }
                                    }}
                                    queryKeys={[['tasks', localTask.project]]}
                                    triggerButton={
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Task
                                        </Button>
                                    }
                                />
                            )}
                        </div>

                        <Separator />

                        {/* Attachments Section */}
                        <div className="space-y-2">
                            <h4 className="font-medium">Attachments ({localTask.attachments?.length || 0})</h4>
                            {localTask.attachments?.map((attachment) => (
                                <div key={attachment._id} className="flex items-center justify-between p-2 border rounded">
                                    <span className="text-sm">{attachment.name}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                // Fix: Use backend URL for attachments
                                                const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                                const attachmentUrl = `${backendUrl}${attachment.url}`;
                                                window.open(attachmentUrl, '_blank');
                                            }}
                                        >
                                            View
                                        </Button>
                                        {canDelete &&
                                            <DeleteEntityModal
                                                entity={{ _id: attachment._id, name: attachment.name }}
                                                entityName={attachment.name}
                                                entityType="Attachment"
                                                deleteFunction={async (id) => {
                                                    try {
                                                        const response = await taskService.deleteAttachment(task._id, [id]);
                                                        const updatedTask = response.data;
                                                        setLocalTask(updatedTask);
                                                        if (onTaskUpdate) onTaskUpdate();
                                                        return { success: true };
                                                    } catch (error) {
                                                        console.error('Error deleting attachment:', error);
                                                        return { success: false, message: 'Failed to delete attachment' };
                                                    }
                                                }}
                                                queryKeys={[['tasks', localTask.project]]}
                                                triggerButton={
                                                    <Button size="sm" variant="destructive">
                                                        Delete
                                                    </Button>
                                                }
                                            />
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Work Evidence Section */}
                        <div className="space-y-2">
                            <h4 className="font-medium">Work Evidence ({localTask.workEvidence?.length || 0})</h4>
                            {localTask.workEvidence?.map((evidence) => (
                                <div key={evidence._id} className="flex items-center justify-between p-2 border rounded">
                                    <span className="text-sm">{evidence.originalName}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                                const evidenceUrl = `${backendUrl}${evidence.imageUrl}`;
                                                window.open(evidenceUrl, '_blank');
                                            }}
                                        >
                                            View
                                        </Button>
                                        {canDelete &&
                                            <DeleteEntityModal
                                                entity={{ _id: evidence._id, name: evidence.originalName }}
                                                entityName={evidence.originalName}
                                                entityType="Work Evidence"
                                                deleteFunction={async (id) => {
                                                    try {
                                                        const response = await taskService.removeWorkEvidence(task._id, [id]);
                                                        const updatedTask = response.data;
                                                        setLocalTask(updatedTask);
                                                        if (onTaskUpdate) onTaskUpdate();
                                                        return { success: true };
                                                    } catch (error) {
                                                        console.error('Error deleting work evidence:', error);
                                                        return { success: false, message: 'Failed to delete work evidence' };
                                                    }
                                                }}
                                                queryKeys={[['tasks', localTask.project]]}
                                                triggerButton={
                                                    <Button size="sm" variant="destructive">
                                                        Delete
                                                    </Button>
                                                }
                                            />
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comments Section */}
                        <div className="space-y-4">
                            <h4 className="font-medium">
                                Comments ({localTask.comments?.length || 0})
                            </h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {localTask.comments?.map((comment) => (
                                    <div key={comment._id} className="p-3 border rounded">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {typeof comment.user === 'string' ? comment.user : comment.user.name}
                                                </span>
                                                <span className="text-xs">
                                                    {format(new Date(comment.createdAt), 'PPp')}
                                                </span>
                                            </div>
                                            <DeleteEntityModal
                                                entity={{ _id: comment._id, name: 'Comment' }}
                                                entityName="Comment"
                                                entityType="Comment"
                                                deleteFunction={async (id) => {
                                                    try {
                                                        const response = await taskService.deleteComment(task._id, id);
                                                        const updatedTask = response.data;
                                                        setLocalTask(updatedTask);
                                                        if (onTaskUpdate) onTaskUpdate();
                                                        return { success: true };
                                                    } catch (error) {
                                                        console.error('Error deleting comment:', error);
                                                        return { success: false, message: 'Failed to delete comment' };
                                                    }
                                                }}
                                                queryKeys={[['tasks', localTask.project]]}
                                                triggerButton={
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Delete
                                                    </Button>
                                                }
                                            />
                                        </div>
                                        <p className="text-sm">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                            {canComment &&
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="flex-1"
                                        rows={2}
                                    />
                                    <Button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim() || isLoading}
                                        size="sm"
                                    >
                                        Add Comment
                                    </Button>
                                </div>
                            }
                        </div>

                        {/* Private Messages Section */}
                        {(canSendPrivateMessage) && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Private Messages ({getFilteredPrivateMessages().length})
                                    </Label>

                                    {/* Technician filter for admin and project manager */}
                                    {/* {(isAdmin || isProjectManager) && (
                                        <Select
                                            value={selectedTechnician}
                                            onValueChange={handleSelectedTechnician}
                                        >
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Filter by technician" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All technicians</SelectItem>
                                                {technicinesList().map((tech) => (
                                                    <SelectItem key={tech._id} value={tech._id}>
                                                        {tech.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )} */}
                                </div>

                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {getFilteredPrivateMessages().map((message) => (
                                        <div key={message._id} className="p-3 border rounded">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium">
                                                    {typeof message.sender === 'string' ? message.sender : message.sender.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">
                                                        {format(new Date(message.createdAt), 'PPp')}
                                                    </span>
                                                    {isAdmin &&
                                                        <DeleteEntityModal
                                                            entity={{ _id: message._id, name: 'Private Message' }}
                                                            entityName="Private Message"
                                                            entityType="Private Message"
                                                            deleteFunction={async (id) => {
                                                                try {
                                                                    const response = await taskService.deletePrivateMessage(task._id, id);
                                                                    const updatedTask = response.data;
                                                                    setLocalTask(updatedTask);
                                                                    if (onTaskUpdate) onTaskUpdate();
                                                                    return { success: true };
                                                                } catch (error) {
                                                                    console.error('Error deleting private message:', error);
                                                                    return { success: false, message: 'Failed to delete private message' };
                                                                }
                                                            }}
                                                            queryKeys={[['tasks', localTask.project]]}
                                                            triggerButton={
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            }
                                                        />
                                                    }
                                                </div>
                                            </div>
                                            <p className="text-sm">{message.content}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    {/* Recipient selector for admin and project manager */}
                                    {(isAdmin || isProjectManager) && (
                                        <Select
                                            value={selectedTechnician}
                                            onValueChange={handleSelectedTechnician}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select technician to message" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All technicians</SelectItem>
                                                {technicinesList().map((tech) => (
                                                    <SelectItem key={tech._id} value={tech._id}>
                                                        {tech.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder={isTechnician ? "Send a private message to project manager..." : "Send a private message..."}
                                            value={newPrivateMessage}
                                            onChange={(e) => setNewPrivateMessage(e.target.value)}
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleAddPrivateMessage}
                                            disabled={!newPrivateMessage.trim() || isLoading || ((isAdmin || isProjectManager) && !selectedTechnician)}
                                            size="sm"
                                        >
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default TaskModal;