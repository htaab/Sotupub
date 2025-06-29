import api from '@/lib/axios';
import { CreateTaskRequest, Task, UpdateTaskRequest } from '@/types/task';

interface TasksResponse {
    success: boolean;
    data: {
        tasks: Record<string, Task[]>;
        totalCount: number;
    };
    message?: string;
}

interface TaskResponse {
    success: boolean;
    data: Task;
    message?: string;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
            error?: string;
        };
    };
    message: string;
}

export const taskService = {
    // Get all tasks for a project (grouped by status for Trello-like board)
    getProjectTasks: async (projectId: string): Promise<TasksResponse> => {
        try {
            const response = await api.get<TasksResponse>(`/tasks/project/${projectId}`);
            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'Failed to fetch tasks';
            throw new Error(errorMessage);
        }
    },

    // Create a new task
    createTask: async (taskData: CreateTaskRequest): Promise<TaskResponse> => {
        try {
            const response = await api.post<TaskResponse>('/tasks', taskData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create task');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error creating task:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while creating task';
            throw new Error(errorMessage);
        }
    },

    // Update an existing task
    updateTask: async (taskId: string, taskData: UpdateTaskRequest): Promise<TaskResponse> => {
        try {
            const response = await api.put<TaskResponse>(`/tasks/${taskId}`, taskData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update task');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error updating task:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while updating task';
            throw new Error(errorMessage);
        }
    },

    // Delete a task
    deleteTask: async (taskId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await api.delete(`/tasks/${taskId}`);
            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'Failed to delete task';
            throw new Error(errorMessage);
        }
    },

    // Add attachments to a task
    addAttachment: async (taskId: string, files: File[]): Promise<TaskResponse> => {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await api.post<TaskResponse>(
                `/tasks/${taskId}/attachments`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to add attachments');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error adding attachments:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while adding attachments';
            throw new Error(errorMessage);
        }
    },

    // Delete an attachment from a task
    deleteAttachment: async (taskId: string, attachmentIds: string[]): Promise<TaskResponse> => {
        try {
            const response = await api.delete<TaskResponse>(
                `/tasks/${taskId}/attachments`,
                {
                    data: { attachmentIds }
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete attachment');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error deleting attachment:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while deleting attachment';
            throw new Error(errorMessage);
        }
    },

    addWorkEvidence: async (taskId: string, files: File[]): Promise<TaskResponse> => {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await api.post<TaskResponse>(
                `/tasks/${taskId}/evidence`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to add work evidence');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error adding work evidence:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while adding work evidence';
            throw new Error(errorMessage);
        }
    },

    // Remove work evidence from a task
    removeWorkEvidence: async (taskId: string, evidenceIds: string[]): Promise<TaskResponse> => {
        try {
            const response = await api.delete<TaskResponse>(
                `/tasks/${taskId}/evidence`,
                {
                    data: { evidenceIds }
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to remove work evidence');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error removing work evidence:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while removing work evidence';
            throw new Error(errorMessage);
        }
    },

    // function to update task position
    updateTaskPosition: async (taskId: string, status: string): Promise<TaskResponse> => {
        try {
            const response = await api.patch<TaskResponse>(`/tasks/${taskId}/position`, { status });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update task position');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error updating task status: ', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while updating task status';
            throw new Error(errorMessage);
        }
    },

    // Add comment to a task
    addComment: async (taskId: string, content: string): Promise<TaskResponse> => {
        try {
            const response = await api.post<TaskResponse>(
                `/tasks/${taskId}/comments`,
                { content },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to add comment');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error adding comment:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while adding comment';
            throw new Error(errorMessage);
        }
    },

    // Add private message to a task
    addPrivateMessage: async (taskId: string, content: string, recipientId: string): Promise<TaskResponse> => {
        try {
            const response = await api.post<TaskResponse>(
                `/tasks/${taskId}/private-messages`,
                { content, recipientId },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to add private message');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error adding private message:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while adding private message';
            throw new Error(errorMessage);
        }
    },

    // Delete comment
    deleteComment: async (taskId: string, commentId: string): Promise<TaskResponse> => {
        try {
            const response = await api.delete<TaskResponse>(
                `/tasks/${taskId}/comments/${commentId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete comment');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error deleting comment:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while deleting comment';
            throw new Error(errorMessage);
        }
    },

    // Delete private message
    deletePrivateMessage: async (taskId: string, messageId: string): Promise<TaskResponse> => {
        try {
            const response = await api.delete<TaskResponse>(
                `/tasks/${taskId}/private-messages/${messageId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete private message');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error deleting private message:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while deleting private message';
            throw new Error(errorMessage);
        }
    }
};