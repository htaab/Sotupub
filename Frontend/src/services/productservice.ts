import api from "@/lib/axios";
import { Product } from "@/types/product";

interface ProductsResponse {
    success: boolean;
    data: {
        products: Product[];
        pagination: {
            total: number;
            page: number;
            pages: number;
            limit: number;
        };
    };
    message?: string;
}

interface ProductsParams {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
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

interface ProductResponse {
    success: boolean;
    data: Product;
    message?: string;
}

export const productService = {
    getProducts: async (params: ProductsParams): Promise<ProductsResponse> => {
        try {
            const response = await api.get<ProductsResponse>('/products', { params });
            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'Failed to fetch products';
            throw new Error(errorMessage);
        }
    },

    createProduct: async (formData: FormData): Promise<Product> => {
        try {
            const response = await api.post<ProductResponse>('/products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create product');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error creating product:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while creating product';
            throw new Error(errorMessage);
        }
    },

    updateProduct: async (id: string, formData: FormData): Promise<Product> => {
        try {
            const response = await api.put<ProductResponse>(`/products/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update product');
            }

            return response.data.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error('Error updating product:', error);
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'An unexpected error occurred while updating product';
            throw new Error(errorMessage);
        }
    },

    deleteProduct: async (productId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await api.delete(`/products/${productId}`);
            return response.data;
        } catch (error: unknown) {
            const err = error as ApiError;
            const errorMessage = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || 'Failed to delete product';
            throw new Error(errorMessage);
        }
    },
}