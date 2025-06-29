import { useCallback, useEffect, useState } from 'react';
import { taskService } from '@/services/taskService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '@/types/task';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { DropResult } from '@hello-pangea/dnd';

interface ApiError {
    response?: {
        data?: {
            message?: string;
            error?: string;
        };
    };
    message: string;
}

export const useTasks = (projectId?: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [groupedTasks, setGroupedTasks] = useState<Record<string, Task[]>>({
        'To Do': [],
        'In Progress': [],
        'In Review': [],
        'Completed': []
    });

    // Fetch tasks for the project
    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: async () => {
            if (!projectId) {
                throw new Error('Project ID is required');
            }
            const response = await taskService.getProjectTasks(projectId);

            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch tasks');
            }

            return response;
        },
        enabled: !!projectId,
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Group tasks by status
    useEffect(() => {
        if (data?.data?.tasks) {
            setGroupedTasks(data.data.tasks);
        }
    }, [data]);

    // Update task status mutation (for drag and drop)
    const updateTaskStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string, status: string }) => {
            const formData = new FormData();
            formData.append('status', status);
            return taskService.updateTask(taskId, formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success('Task status updated successfully');
        },
        onError: (error: unknown) => {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update task status';
            toast.error(errorMessage);
            // Refetch to reset the UI state
            refetch();
        }
    });

    // Create task mutation
    const createTaskMutation = useMutation({
        mutationFn: (formData: FormData) => taskService.createTask(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success('Task created successfully');
        },
        onError: (error: unknown) => {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create task';
            toast.error(errorMessage);
        }
    });

    // Update task mutation
    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, formData }: { taskId: string, formData: FormData }) =>
            taskService.updateTask(taskId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success('Task updated successfully');
        },
        onError: (error: unknown) => {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update task';
            toast.error(errorMessage);
        }
    });

    // Delete task mutation
    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: string) => taskService.deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success('Task deleted successfully');
        },
        onError: (error: unknown) => {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete task';
            toast.error(errorMessage);
        }
    });

    // Add comment mutation
    const addCommentMutation = useMutation({
        mutationFn: ({ taskId, text }: { taskId: string, text: string }) =>
            taskService.addComment(taskId, text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success('Comment added successfully');
        },
        onError: (error: unknown) => {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to add comment';
            toast.error(errorMessage);
        }
    });

    // Add attachment mutation
    const addAttachmentMutation = useMutation({
        mutationFn: ({ taskId, files }: { taskId: string, files: File[] }) =>
            taskService.addAttachment(taskId, files),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success('Attachments added successfully');
        },
        onError: (error: unknown) => {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to add attachments';
            toast.error(errorMessage);
        }
    });

    // Delete attachment mutation
    const deleteAttachmentMutation = useMutation({
        mutationFn: ({ taskId, attachmentId }: { taskId: string, attachmentId: string }) =>
            taskService.deleteAttachment(taskId, attachmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success('Attachment deleted successfully');
        },
        onError: (error: unknown) => {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete attachment';
            toast.error(errorMessage);
        }
    });

    // Create a task
    const createTask = async (formData: FormData) => {
        setIsCreating(true);
        try {
            const response = await createTaskMutation.mutateAsync(formData);
            await refetch();
            return response;
        } finally {
            setIsCreating(false);
        }
    };

    // Update a task
    const updateTask = async (taskId: string, formData: FormData) => {
        setIsUpdating(true);
        try {
            const response = await updateTaskMutation.mutateAsync({ taskId, formData });
            await refetch();
            return response;
        } finally {
            setIsUpdating(false);
        }
    };

    // Delete a task
    const deleteTask = async (taskId: string) => {
        setIsDeleting(true);
        try {
            const response = await deleteTaskMutation.mutateAsync(taskId);
            await refetch();
            return response;
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle drag end (when a task is dropped in a new column)
    const handleDragEnd = useCallback((result: DropResult) => {
        const { destination, source, draggableId } = result;

        // If there's no destination or the task was dropped back in its original position
        if (!destination ||
            (destination.droppableId === source.droppableId &&
                destination.index === source.index)) {
            return;
        }

        // Get the new status from the destination droppableId
        const newStatus = destination.droppableId;

        // Check if user is technician and trying to move to Completed
        if (user?.role === 'technician' && newStatus === 'Completed') {
            toast.error('Only admins and project managers can mark tasks as completed');
            return;
        }

        // Optimistically update the UI
        const sourceStatus = source.droppableId;
        const taskToMove = groupedTasks[sourceStatus].find(task => task._id === draggableId);

        if (taskToMove) {
            // Create a new grouped tasks object with the task moved to the new status
            const newGroupedTasks = { ...groupedTasks };

            // Remove from source
            newGroupedTasks[sourceStatus] = newGroupedTasks[sourceStatus].filter(
                task => task._id !== draggableId
            );

            // Add to destination with proper type casting for the status
            const updatedTask = {
                ...taskToMove,
                status: newStatus as 'To Do' | 'In Progress' | 'In Review' | 'Completed'
            };
            newGroupedTasks[newStatus] = [
                ...newGroupedTasks[newStatus],
                updatedTask
            ];

            setGroupedTasks(newGroupedTasks);

            // Call the API to update the task status
            updateTaskStatusMutation.mutate({
                taskId: draggableId,
                status: newStatus
            });
        }
    }, [groupedTasks, updateTaskStatusMutation, user?.role]);

    // Check if user can edit task
    const canEditTask = useCallback((task: Task) => {
        if (!user) return false;

        if (user.role === 'admin') return true;

        if (user.role === 'project manager') {
            // Check if user is the project manager of this task's project
            return typeof task.project === 'object'
                ? task.project.projectManager === user._id
                : true; // We don't have project details, so we'll assume true and let the backend handle it
        }

        return false;
    }, [user]);

    // Check if user can change task status
    const canChangeTaskStatus = useCallback((task: Task) => {
        if (!user) return false;

        if (user.role === 'admin' || user.role === 'project manager') return true;

        if (user.role === 'technician') {
            // Technicians can change status if they're assigned to the task
            return task.assignedTo.some(assignee =>
                typeof assignee === 'string'
                    ? assignee === user._id
                    : assignee._id === user._id
            );
        }

        return false;
    }, [user]);

    return {
        tasks: data?.data?.tasks || [],
        groupedTasks,
        totalCount: data?.data?.totalCount || 0,
        isLoading,
        isFetching,
        error,
        refetch,
        isCreating,
        isUpdating,
        isDeleting,
        createTask,
        updateTask,
        deleteTask,
        addComment: (taskId: string, text: string) => addCommentMutation.mutate({ taskId, text }),
        addAttachment: (taskId: string, files: File[]) => addAttachmentMutation.mutate({ taskId, files }),
        deleteAttachment: (taskId: string, attachmentId: string) =>
            deleteAttachmentMutation.mutate({ taskId, attachmentId }),
        handleDragEnd,
        canEditTask,
        canChangeTaskStatus
    };
};