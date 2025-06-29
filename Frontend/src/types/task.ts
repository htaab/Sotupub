import { User } from './auth';
import { Project } from './project';

export interface Task {
  _id: string;
  name: string;
  description: string;
  beginDate: string;
  endDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'In Review' | 'Completed';
  assignedTo: User | string;
  project: Project | string;
  comments: Comment[];
  privateMessages: PrivateMessage[];
  attachments: Attachment[];
  workEvidence: WorkEvidence[];
  changeLog: ChangeLogEntry[];
  lastUpdatedBy?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  user: User | string;
  content: string;
  createdAt: string;
}

export interface PrivateMessage {
  _id: string;
  sender: User | string;
  recipient: User | string;
  content: string;
  createdAt: string;
}

export interface Attachment {
  _id: string;
  name: string;
  url: string;
  fileType: 'image' | 'document' | 'other';
  uploadedBy: User | string;
  uploadedAt: string;
}

export interface WorkEvidence {
  _id: string;
  imageUrl: string;
  originalName: string;
  uploadedBy: User | string;
  uploadedAt: string;
}

export interface ChangeLogEntry {
  _id: string;
  updatedBy: User | string;
  updatedAt: string;
  changes: {
    [key: string]: {
      from?: any;
      to?: any;
    } | { action: string };
  };
  message?: string;
}

export interface TaskParams {
  projectId?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  sort?: string;
}

export interface CreateTaskRequest {
  name: string;
  description: string;
  beginDate: string | Date;
  endDate: string | Date;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status?: 'To Do' | 'In Progress' | 'In Review' | 'Completed';
  assignedTo?: string;
  projectId: string;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  beginDate?: string | Date;
  endDate?: string | Date;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status?: 'To Do' | 'In Progress' | 'In Review' | 'Completed';
  assignedTo?: string | null;
}

export interface TaskFormData {
  name: string;
  description: string;
  beginDate: Date;
  endDate: Date;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'In Review' | 'Completed';
  assignedTo: string;
  projectId: string;
  files?: FileList;
  attachmentsToKeep?: string[];
}

export interface TaskColumn {
  id: string;
  title: string;
  taskIds: string[];
}

export interface TaskBoard {
  columns: {
    [key: string]: TaskColumn;
  };
  columnOrder: string[];
}