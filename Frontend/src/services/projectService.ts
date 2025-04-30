import api from '@/lib/axios';
import { Project, ProjectParams } from '@/types/project';

interface ProjectsResponse {
    success: boolean;
    data: {
        projects: Project[];
        pagination: {
            total: number;
            page: number;
            pages: number;
            limit: number;
        };
    };
    message?: string;
}

interface ProjectResponse {
    success: boolean;
    data: Project;
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

// Define proper types for project creation and update
interface ProjectCreateData {
    name: string;
    entreprise: string;
    description?: string;
    beginDate: string;
    endDate: string;
    status: string;
    client: string;
    projectManager: string;
    stockManager?: string;
    products?: Array<{
        product: string;
        quantity: number;
    }>;
}

// Reuse the same type for update
type ProjectUpdateData = ProjectCreateData;

export const projectService = {
    getProjects: async (params: ProjectParams): Promise<ProjectsResponse> => {
        try {
            const response = await api.get<ProjectsResponse>('/projects', { params });
            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'Failed to fetch projects';
            throw new Error(errorMessage);
        }
    },

    getProject: async (projectId: string): Promise<Project> => {
        try {
            const response = await api.get<ProjectResponse>(`/projects/${projectId}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch project');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error fetching project:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while fetching project';
            throw new Error(errorMessage);
        }
    },

    createProject: async (projectData: ProjectCreateData): Promise<Project> => {
        try {
            const response = await api.post<ProjectResponse>('/projects', projectData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create project');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error creating project:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while creating project';
            throw new Error(errorMessage);
        }
    },

    updateProject: async (projectId: string, projectData: ProjectUpdateData): Promise<Project> => {
        try {
            const response = await api.put<ProjectResponse>(`/projects/${projectId}`, projectData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update project');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error updating project:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while updating project';
            throw new Error(errorMessage);
        }
    },

    deleteProject: async (projectId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await api.delete(`/projects/${projectId}`);
            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'Failed to delete project';
            throw new Error(errorMessage);
        }
    },
};
export type { Project, ProjectParams, ProjectCreateData, ProjectUpdateData };
