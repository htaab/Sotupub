import { useCallback, useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from "react-router-dom";
import { projectService } from "@/services/projectService";

const useProjects = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isCreating, setIsCreating] = useState(false);

    // Memoize default values for query params
    const defaultValues = useMemo(() => ({
        page: 1,
        limit: 10,
        search: '',
        status: '',
        startDate: '',
        endDate: '',
        client: '',
        projectManager: '',
        stockManager: '',
        sort: 'createdAt',
        order: 'desc' as const
    }), []);

    const queryParams = useMemo(() => ({
        page: Number(searchParams.get('page')) || defaultValues.page,
        limit: Number(searchParams.get('limit')) || defaultValues.limit,
        search: searchParams.get('search') || defaultValues.search,
        status: searchParams.get('status') || defaultValues.status,
        startDate: searchParams.get('startDate') || defaultValues.startDate,
        endDate: searchParams.get('endDate') || defaultValues.endDate,
        client: searchParams.get('client') || defaultValues.client,
        projectManager: searchParams.get('projectManager') || defaultValues.projectManager,
        stockManager: searchParams.get('stockManager') || defaultValues.stockManager,
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

    const {
        page, limit, search, status, startDate, endDate,
        client, projectManager, stockManager, sort, order
    } = queryParams;

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

    const handleStatusChange = (newStatus: string | undefined) => {
        updateSearchParams({ status: newStatus, page: '1' });
    };

    const handleDateChange = (type: 'startDate' | 'endDate', date: string | undefined) => {
        updateSearchParams({ [type]: date, page: '1' });
    };

    const handleUserChange = (type: 'client' | 'projectManager' | 'stockManager', userId: string | undefined) => {
        updateSearchParams({ [type]: userId, page: '1' });
    };

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['projects', queryParams],
        queryFn: async () => {
            const filters = {
                ...queryParams,
                search: queryParams.search.trim() || undefined,
                status: queryParams.status || undefined,
                startDate: queryParams.startDate || undefined,
                endDate: queryParams.endDate || undefined,
                client: queryParams.client || undefined,
                projectManager: queryParams.projectManager || undefined,
                stockManager: queryParams.stockManager || undefined
            };

            const response = await projectService.getProjects(filters);

            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch projects');
            }

            return response;
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const createProject = async (formData: FormData) => {
        setIsCreating(true);
        try {
            const response = await projectService.createProject(formData);
            await refetch();
            return response;
        } finally {
            setIsCreating(false);
        }
    };

    return {
        projects: data?.data?.projects || [],
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
        handleStatusChange,
        handleDateChange,
        handleUserChange,
        page,
        limit,
        search,
        status,
        startDate,
        endDate,
        client,
        projectManager,
        stockManager,
        sort,
        order,
        isCreating,
        createProject,
    };
};

export default useProjects;