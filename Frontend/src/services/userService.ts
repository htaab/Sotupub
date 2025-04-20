import api from '@/lib/axios';
import { User } from '@/types/auth';
import { AxiosError } from 'axios';

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

export const userService = {
    getUsers: async (params: UserParams): Promise<UsersResponse> => {
        try {
            const response = await api.get<UsersResponse>('/users', { params });
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError && error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Failed to fetch users');
        }
    },
};