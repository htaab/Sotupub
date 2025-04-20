import { useCallback, useEffect, useMemo } from 'react';
import { debounce } from "lodash";
import { userService } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

export const useUsers = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Memoize default values for query params
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
        role: searchParams.get('role') || undefined,
        isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
        sort: searchParams.get('sort') || defaultValues.sort,
        order: (searchParams.get('order') as 'asc' | 'desc') || defaultValues.order
    }), [searchParams, defaultValues]);

    // Optimize updateSearchParams with functional update
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

    const { page, limit, search, role, isActive, sort, order } = queryParams;

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
                updateSearchParams({ search: searchTerm, page: '1' });
            }, 500),
        [updateSearchParams]
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleSearch = (searchTerm: string) => {
        debouncedSearch(searchTerm);
    };

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

    const handleRoleChange = (newRole: string | undefined) => {
        updateSearchParams({ role: newRole, page: '1' });
    };

    const handleActiveStatusChange = (status: boolean | undefined) => {
        updateSearchParams({
            isActive: status === undefined ? undefined : String(status),
            page: '1'
        });
    };

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['users', queryParams],
        queryFn: async () => {
            const filters = {
                ...queryParams,
                search: queryParams.search.trim() || undefined
            };

            const response = await userService.getUsers(filters);

            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch users');
            }

            return response;
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    return {
        users: data?.data?.users || [],
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
        handleRoleChange,
        handleActiveStatusChange,
        page,
        limit,
        search,
        role,
        isActive,
        sort,
        order,
    };
};