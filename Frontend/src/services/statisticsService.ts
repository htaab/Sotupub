import api from '@/lib/axios';

interface ProjectCompletionStats {
    total: number;
    completed: number;
    completionPercentage: number;
    statusBreakdown: Array<{ _id: string; count: number }>;
    dateRange: { start: string; end: string };
}

interface UserStats {
    totalUsers: number;
    roleBreakdown: Array<{ _id: string; count: number }>;
}

interface IncompleteProjectsStats {
    incompleteProjects: number;
}

interface ProductManagerStats {
    projectTrends: Array<{
        _id: { month: number; year: number; status: string };
        count: number;
    }>;
    averageProjectDuration: number;
    technicianUtilization: Array<{
        _id: string;
        name: string;
        totalTasks: number;
        completedTasks: number;
    }>;
    dateRange: { start: string; end: string };
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
    message: string;
}

export const statisticsService = {
    // Get project completion statistics
    async getProjectCompletionStats(startDate?: string, endDate?: string): Promise<ProjectCompletionStats> {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get<{ success: boolean; data: ProjectCompletionStats }>(
                `/statistics/project-completion?${params.toString()}`
            );
            return response.data.data;
        } catch (error) {
            const err = error as ApiError;
            throw new Error(err.response?.data?.message || err.message || 'Failed to fetch project completion statistics');
        }
    },

    // Get user statistics (admin only)
    async getUserStats(): Promise<UserStats> {
        try {
            const response = await api.get<{ success: boolean; data: UserStats }>('/statistics/users');
            return response.data.data;
        } catch (error) {
            const err = error as ApiError;
            throw new Error(err.response?.data?.message || err.message || 'Failed to fetch user statistics');
        }
    },

    // Get incomplete projects count
    async getIncompleteProjectsCount(): Promise<IncompleteProjectsStats> {
        try {
            const response = await api.get<{ success: boolean; data: IncompleteProjectsStats }>('/statistics/incomplete-projects');
            return response.data.data;
        } catch (error) {
            const err = error as ApiError;
            throw new Error(err.response?.data?.message || err.message || 'Failed to fetch incomplete projects count');
        }
    },

    // Get product manager statistics
    async getProductManagerStats(startDate?: string, endDate?: string): Promise<ProductManagerStats> {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get<{ success: boolean; data: ProductManagerStats }>(
                `/statistics/product-manager?${params.toString()}`
            );
            return response.data.data;
        } catch (error) {
            const err = error as ApiError;
            throw new Error(err.response?.data?.message || err.message || 'Failed to fetch product manager statistics');
        }
    }
};