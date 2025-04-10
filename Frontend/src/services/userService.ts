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
}

export const userService = {
    getUsers: async (params: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        isActive?: boolean;
        sort?: string;
        order?: 'asc' | 'desc';
    }): Promise<UsersResponse> => {
        const response = await api.get('/users', { params });
        return response.data;
    },
};