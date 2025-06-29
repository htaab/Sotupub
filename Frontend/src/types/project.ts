import { User } from './auth';
import { Task } from './task';

export interface Project {
    _id: string;
    name: string;
    entreprise: string;
    description?: string;
    beginDate: string;
    endDate: string;
    status: 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';
    client: User | string;
    projectManager: User | string;
    stockManager: User | string;
    products: Array<{
        product: {
            _id: string;
            name: string;
            reference: string;
            category: string;
            price: number;
        };
        quantity: number;
    }>;
    tasks?: Task[] | string[];
    createdAt: string;
    updatedAt: string;
}

export interface ProjectParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    client?: string;
    projectManager?: string;
    stockManager?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}