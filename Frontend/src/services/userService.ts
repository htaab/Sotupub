import api from '@/lib/axios';
import { User } from '@/types/auth';

interface UsersResponse {
    success: boolean;
    data: {
        users: User[];
        pagination: {
            total: number;
            page: number;
            pages: number;
            limit: number;
        };
    };
    message?: string;
}

interface UserParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sort?: string;
    order?: 'asc' | 'desc';
}

interface UserResponse {
    success: boolean;
    data: User;
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

interface PasswordUpdateData {
    currentPassword: string;
    newPassword: string;
}

export const userService = {
    getUsers: async (params: UserParams): Promise<UsersResponse> => {
        try {
            const response = await api.get<UsersResponse>('/users', { params });
            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'Failed to fetch users';
            throw new Error(errorMessage);
        }
    },

    createUser: async (formData: FormData): Promise<User> => {
        try {
            const response = await api.post<UserResponse>('/users', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create user');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error creating user:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while creating user';
            throw new Error(errorMessage);
        }
    },

    updateUser: async (userId: string, formData: FormData): Promise<User> => {
        try {
            const response = await api.put<UserResponse>(`/users/${userId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update user');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error updating user:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while updating user';
            throw new Error(errorMessage);
        }
    },

    deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await api.delete(`/users/${userId}`);
            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'Failed to delete user';
            throw new Error(errorMessage);
        }
    },

    toggleUserActive: async (userId: string): Promise<User> => {
        try {
            const response = await api.patch<UserResponse>(`/users/${userId}/toggle-active`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to toggle user status');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error toggling user status:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while toggling user status';
            throw new Error(errorMessage);
        }
    },

    getUserProfile: async (userId: string): Promise<User> => {
        try {
            const response = await api.get<UserResponse>(`/users/profile/${userId}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch user profile');
            }
            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error fetching user profile:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while fetching user profile';
            throw new Error(errorMessage);
        }
    },

    updateProfile: async (userId: string, formData: FormData): Promise<User> => {
        try {
            const response = await api.put<UserResponse>(`/users/profile/${userId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update profile');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error updating profile:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while updating profile';
            throw new Error(errorMessage);
        }
    },

    updatePassword: async (userId: string, passwordData: PasswordUpdateData): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await api.put<{ success: boolean; message: string }>(
                `/users/profile/${userId}/password`,
                passwordData
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update password');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error updating password:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while updating password';
            throw new Error(errorMessage);
        }
    },

    adminResetPassword: async (userId: string, data: { newPassword: string }): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await api.post<{ success: boolean; message: string }>(
                `/users/${userId}/reset-password`,
                data
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to reset password');
            }

            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error resetting password:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while resetting password';
            throw new Error(errorMessage);
        }
    },
};