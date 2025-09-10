import { useFilter } from '@/hooks/useFilter';
import usePagination from '@/hooks/usePagination';
import { initialFilters } from '../_constants';
import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';

export const useSearchStoreData = (path = '') => {
    const { filters, setFilters, updateFilter } = useFilter(initialFilters);
    const { page, limit, setPage } = usePagination(path, 6);
    const [storesData, setStoresData] = useState<any>(null);
    const [storesLoading, setStoresLoading] = useState(false);
    const [storesError, setStoresError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setStoresLoading(true);
            try {
                const searchParams = new URLSearchParams({
                    type: filters.type || '',
                    category: filters.category || '',
                    subCategory: filters.subCategory || [],
                    page: page.toString(),
                    limit: limit.toString(),
                    query: filters.query || ''
                });

                if (filters.classify) {
                    searchParams.append('classify', filters.classify);
                }

                const { data } = await axios.get(
                    `/api/products?${searchParams.toString()}`
                );
                setStoresData(data);
            } catch (error) {
                setStoresError(error as Error);
            } finally {
                setStoresLoading(false);
            }
        };

        fetchData();
    }, [filters, page, limit]);

    return {
        storesData: useMemo(() => storesData, [storesData]),
        storesLoading,
        storesError,
        filters,
        setFilters,
        updateFilter,
        page,
        setPage,
        limit
    };
};
