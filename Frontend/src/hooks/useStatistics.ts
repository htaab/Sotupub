import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '@/services/statisticsService';
import { useAuthStore } from '@/store/auth-store';

export const useProjectCompletionStats = (startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: ['projectCompletionStats', startDate, endDate],
        queryFn: () => statisticsService.getProjectCompletionStats(startDate, endDate),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useUserStats = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['userStats'],
        queryFn: () => statisticsService.getUserStats(),
        enabled: user?.role === 'admin',
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useIncompleteProjectsCount = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['incompleteProjectsCount'],
        queryFn: () => statisticsService.getIncompleteProjectsCount(),
        enabled: user?.role === 'project manager' || user?.role === 'technician',
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useProductManagerStats = (startDate?: string, endDate?: string) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['productManagerStats', startDate, endDate],
        queryFn: () => statisticsService.getProductManagerStats(startDate, endDate),
        enabled: user?.role === 'admin', // Assuming product manager stats are visible to admin
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};