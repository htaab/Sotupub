import axios, { InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { ApiResponse } from '@/types/auth';

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: (status) => status >= 200 && status < 500,
    timeout: 15000,
} as CustomAxiosRequestConfig);

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const customConfig = config as CustomAxiosRequestConfig;
        if (customConfig._skipAuthRefresh) {
            return config;
        }

        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        if (!error.response || !error.config) {
            return Promise.reject(new Error('Network Error'));
        }

        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await api.post<ApiResponse>(
                    '/auth/refresh-token',
                    { refreshToken },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.success === false) {
                    throw new Error(response.data.message || 'Invalid refresh token response');
                }

                const { accessToken, refreshToken: newRefreshToken, user } = response.data;

                if (!accessToken || !newRefreshToken || !user) {
                    throw new Error('Missing required fields in refresh token response');
                }

                useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                return api(originalRequest);

            } catch (refreshError) {
                useAuthStore.getState().logout();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError instanceof Error ? refreshError : new Error('Token refresh failed'));
            }
        }

        const errorMessages: Record<number, string> = {
            400: 'Bad Request - Please check your input',
            401: 'Unauthorized - Please login again',
            403: 'Forbidden - You do not have permission to access this resource',
            404: 'Not Found - The requested resource does not exist',
            408: 'Request Timeout - Please try again',
            429: 'Too Many Requests - Please try again later',
            500: 'Internal Server Error - Please try again later',
            502: 'Bad Gateway - Server is temporarily unavailable',
            503: 'Service Unavailable - Please try again later',
            504: 'Gateway Timeout - Please try again later'
        };

        const status = error.response.status;
        const errorMessage = errorMessages[status] || 'An unexpected error occurred';

        console.error(`${status}: ${errorMessage}`, {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            error: error.message
        });

        return Promise.reject({
            ...error,
            message: errorMessage
        });
    }
);

export default api;