import { useFilter } from '@/hooks/useFilter';
import usePagination from '@/hooks/usePagination';
import { initialFilters } from '../_constants';
import { useMemo, useState, useEffect } from 'react';
import { useGetPaginationStoresQuery } from '@/generated/graphql';
import { useSession } from 'next-auth/react';

export const useFavoriteStoreData = (path = '/favorite-stores') => {
    const { filters, setFilters, updateFilter } = useFilter({
        ...initialFilters,
        type: 'product'
    });
    const { page, limit, setPage } = usePagination(path, 6);
    const [storesData, setStoresData] = useState<any>(null);
    const [storesLoading, setStoresLoading] = useState(false);
    const [storesError, setStoresError] = useState<Error | null>(null);
    const { data: session } = useSession();
    const offset = (page - 1) * limit;

    const { data, loading, error, refetch } = useGetPaginationStoresQuery({
        variables: {
            where: {
                wishlists: {
                    userId: {
                        _eq: session?.user?.id
                    }
                },
                ...(filters.category === ''
                    ? {
                          category: {
                              type: {
                                  _eq: filters.type
                              }
                          }
                      }
                    : filters.subCategory.length > 0
                      ? {
                            category: {
                                slug: {
                                    _in: filters.subCategory
                                }
                            }
                        }
                      : {
                            category: {
                                slug: {
                                    _eq: filters.category
                                }
                            }
                        }),
                ...(filters.classify
                    ? { storeTag: { _eq: filters.classify } }
                    : {})
            },
            limit,
            offset,
            userId: session?.user?.id || ''
        },
        fetchPolicy: 'cache-and-network',
        skip: !session?.user?.id
    });

    useEffect(() => {
        if (data) {
            setStoresData(data);
            setStoresLoading(false);
            setStoresError(null);
        }
        if (loading) {
            setStoresLoading(true);
        }
        if (error) {
            setStoresError(error);
            setStoresLoading(false);
        }
    }, [data, loading, error]);

    return {
        storesData: useMemo(() => storesData, [storesData]),
        storesLoading,
        storesError,
        filters,
        setFilters,
        updateFilter,
        page,
        setPage,
        limit,
        refetch
    };
};
