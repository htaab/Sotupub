import { useState } from 'react';
import { userService } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';

export const useUsers = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState<string | undefined>();
    const [isActive, setIsActive] = useState<boolean | undefined>();
    const [sort, setSort] = useState('createdAt');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading, error } = useQuery({
        queryKey: ['users', page, limit, search, role, isActive, sort, order],
        queryFn: () => userService.getUsers({ page, limit, search, role, isActive, sort, order }),
    });

    return {
        users: data?.data.users,
        pagination: data?.data.pagination,
        isLoading,
        error,
        setPage,
        setLimit,
        setSearch,
        setRole,
        setIsActive,
        setSort,
        setOrder,
    };
};