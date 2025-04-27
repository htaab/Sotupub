import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productService } from '@/services/productservice';


export const useProducts = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isCreating, setIsCreating] = useState(false);

    const defaultValues = useMemo(() => ({
        page: 1,
        limit: 10,
        search: '',
        sort: 'createdAt',
        order: 'desc' as const
    }), []);

    const queryParams = useMemo(() => ({
        page: Number(searchParams.get('page')) || defaultValues.page,
        limit: Number(searchParams.get('limit')) || defaultValues.limit,
        search: searchParams.get('search') || defaultValues.search,
        sort: searchParams.get('sort') || defaultValues.sort,
        order: (searchParams.get('order') as 'asc' | 'desc') || defaultValues.order
    }), [searchParams, defaultValues]);

    const updateSearchParams = useCallback((params: Record<string, string | undefined>) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            Object.entries(params).forEach(([key, value]) => {
                if (!value) {
                    newParams.delete(key);
                } else {
                    newParams.set(key, value);
                }
            });
            return newParams;
        }, { replace: true }); // Add replace option to prevent adding to browser history
    }, [setSearchParams]);

    // Optimize resetFilters to use default values
    const resetFilters = useCallback(() => {
        setSearchParams({}, { replace: true });
    }, [setSearchParams]);

    const { page, limit, search, sort, order } = queryParams;

    const handlePageChange = (newPage: number) => {
        updateSearchParams({ page: String(Math.max(1, newPage)) });
    };

    const handleLimitChange = (newLimit: number) => {
        const limit = Math.min(Math.max(1, newLimit), 100);
        updateSearchParams({ limit: String(limit), page: '1' });
    };

    const debouncedSearch = useMemo(
        () =>
            debounce((searchTerm: string) => {
                updateSearchParams({
                    search: searchTerm || undefined,
                    page: '1'
                });
            }, 300), // Reduced debounce time for better responsiveness
        [updateSearchParams]
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleSearch = useCallback((searchTerm: string) => {
        debouncedSearch(searchTerm);
    }, [debouncedSearch]);

    const handleSort = (sortField: string) => {
        if (sort === sortField) {
            updateSearchParams({
                order: order === 'asc' ? 'desc' : 'asc',
                page: '1'
            });
        } else {
            updateSearchParams({
                sort: sortField,
                order: 'desc',
                page: '1'
            });
        }
    };

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['products', queryParams],
        queryFn: async () => {
            const filters = {
                ...queryParams,
                search: queryParams.search.trim() || undefined
            };

            const response = await productService.getProducts(filters);

            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch products');
            }

            return response;
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const createProduct = async (formData: FormData) => {
        setIsCreating(true);
        try {
            const response = await productService.createProduct(formData);
            await refetch();
            return response;
        } finally {
            setIsCreating(false);
        }
    };

    return {
        products: data?.data?.products || [],
        pagination: data?.data?.pagination,
        isLoading,
        isFetching,
        error,
        refetch,
        resetFilters,
        handlePageChange,
        handleLimitChange,
        handleSearch,
        handleSort,
        page,
        limit,
        search,
        sort,
        order,
        isCreating,
        createProduct,
    };
};