import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: (status) => {
        return status >= 200 && status < 500;
    },
});

// Request interceptor - Adds auth token to requests
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor - Handles token refresh
api.interceptors.response.use(
    (response) => {
        return Promise.resolve(response);
    },
    async (error) => {
        if (!error.response) {
            return Promise.reject(error);
        }

        const originalRequest = error.config;

        // Handle 401 and token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken, user } = response.data;
                useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle other common errors
        if (error.response?.status === 403) {
            // Handle forbidden access
            console.error('Access forbidden');
        } else if (error.response?.status === 404) {
            // Handle not found
            console.error('Resource not found');
        } else if (error.response?.status >= 500) {
            // Handle server errors
            console.error('Server error occurred');
        }

        return Promise.reject(error);
    }
);

export default api;