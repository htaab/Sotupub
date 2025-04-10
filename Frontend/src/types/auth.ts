export type UserRole = 'admin' | 'project_manager' | 'technician' | 'stock_manager' | 'client';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phoneNumber?: string;
  address?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  success?: boolean;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}