export type UserRole = 'admin' | 'client' | 'project manager' | 'stock manager' | 'technician';

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
  matriculeNumber?: number;
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