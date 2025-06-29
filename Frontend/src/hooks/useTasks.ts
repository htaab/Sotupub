import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";
import { useQuery } from "@tanstack/react-query";

export const useTasks = (projectId: string) => {

    // Fetch project details
    const {
        data: projectData,
        isLoading: isLoadingProject,
        error: projectError
    } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            try {
                return await projectService.getProject(projectId);
            } catch (error) {
                console.error("Error fetching project:", error);
                throw error;
            }
        },
        enabled: !!projectId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    // Fetch tasks for the project
    const {
        data: tasks,
        isLoading: isLoadingTasks,
        error: tasksError,
        refetch: refetchTasks
    } = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            try {
                const response = await taskService.getProjectTasks(projectId);
                return response;

            } catch (error) {
                console.error("Error fetching tasks:", error);
                throw error;
            }
        },
        enabled: !!projectId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        project: projectData,
        isLoadingProject,
        projectError,
        tasks: tasks?.data?.tasks || {},
        totalCount: tasks?.data?.totalCount || 0,
        isLoadingTasks,
        tasksError,
        refetchTasks
    }
};