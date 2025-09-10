import { useFilter } from '@/hooks/useFilter';
import usePagination from '@/hooks/usePagination';
import { initialFilters } from '../_constants';
import { useMemo, useState, useEffect } from 'react';
import {
    useGetPositionsQuery,
    useGetStoreViewQuery
} from '@/generated/graphql';
import { OrderBy } from '@/generated/graphql-request';

export const useProductsData = (path = '/products') => {
    const { filters, setFilters, updateFilter } = useFilter({
        ...initialFilters,
        type: 'product'
    });
    const { page, limit, setPage } = usePagination(path, 6);
    const [storesData, setStoresData] = useState<any>(null);
    const [storesLoading, setStoresLoading] = useState(false);
    const [storesError, setStoresError] = useState<Error | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const offset = (page - 1) * limit;

    // Query để lấy winnerStoreIds
    const { data: positionData } = useGetPositionsQuery({
        variables: {
            where:
                filters.category && filters.category !== ''
                    ? {
                          _and: [
                              {
                                  category: {
                                      slug: {
                                          _eq: filters.category
                                      }
                                  }
                              },
                              {
                                  winnerStores: {
                                      _isNull: false
                                  }
                              }
                          ]
                      }
                    : {
                          _and: [
                              {
                                  category: {
                                      slug: {
                                          _isNull: false
                                      }
                                  }
                              },
                              {
                                  winnerStores: {
                                      _isNull: false
                                  }
                              }
                          ]
                      },
            orderBy: {
                positionName: OrderBy.Asc
            }
        }
    });

    // Xử lý winnerStoreIds
    const winnerStoreIds = useMemo(() => {
        if (!positionData?.positions?.length) return [];
        return positionData.positions
            .filter((position) => position.winnerStores)
            .flatMap((position) => position.winnerStores);
    }, [positionData]);

    // Xây dựng điều kiện where chung cho cả hai query
    const baseWhereCondition = useMemo(() => {
        return {
            ...(filters.category === ''
                ? {
                      categoryType: {
                          _eq: filters.type
                      }
                  }
                : filters.subCategory.length > 0
                  ? {
                        parentCategorySlug: {
                            _eq: filters.category
                        },
                        categorySlug: {
                            _in: filters.subCategory
                        }
                    }
                  : {
                        categorySlug: {
                            _in: filters.category
                        }
                    }),
            ...(filters.classify
                ? {
                      duplicateProduct: {
                          _eq: filters.classify === 'Duplicate' ? true : false
                      }
                  }
                : {}),
            ...(filters.type === 'product'
                ? {
                      status: {
                          _eq: 'active'
                      }
                  }
                : {})
        };
    }, [filters]);

    // Fetch tất cả dữ liệu cho mục đích đếm tổng và ưu tiên winner stores
    const { data: allStoresData, loading: allStoresLoading } =
        useGetStoreViewQuery({
            variables: {
                where: baseWhereCondition
            },
            fetchPolicy: 'cache-and-network',
            skip: !baseWhereCondition // Skip nếu điều kiện chưa được xây dựng
        });

    // Query trả về kết quả theo trang
    const { data, loading, error, refetch } = useGetStoreViewQuery({
        variables: {
            where: baseWhereCondition,
            limit,
            offset
        },
        fetchPolicy: 'cache-and-network'
    });

    // Sắp xếp và chuẩn bị dữ liệu cuối cùng
    useEffect(() => {
        if (allStoresData && data) {
            // Ưu tiên sắp xếp tất cả store với winner store lên đầu
            if (allStoresData.listingStores?.length > 0) {
                const allStores = [...allStoresData.listingStores];

                // Thêm trường isSponsor cho winner stores
                const storesWithSponsorFlag = allStores.map((store) => ({
                    ...store,
                    isSponsor: winnerStoreIds.includes(store.storeId),
                    winnerIndex: winnerStoreIds.indexOf(store.storeId)
                }));

                // Sắp xếp theo thứ tự: winner stores trước (theo đúng thứ tự trong winnerStoreIds), sau đó các store khác
                const sortedAllStores = storesWithSponsorFlag.sort((a, b) => {
                    const aIsWinner = a.winnerIndex !== -1;
                    const bIsWinner = b.winnerIndex !== -1;

                    if (aIsWinner && bIsWinner) {
                        // Cả hai là winner, sắp xếp theo thứ tự trong winnerStoreIds
                        return a.winnerIndex - b.winnerIndex;
                    } else if (aIsWinner && !bIsWinner) {
                        // a là winner, b không phải
                        return -1;
                    } else if (!aIsWinner && bIsWinner) {
                        // b là winner, a không phải
                        return 1;
                    }
                    return 0;
                });

                // Lấy phần dữ liệu tương ứng với trang hiện tại từ dữ liệu đã sắp xếp
                const paginatedStores = sortedAllStores.slice(
                    offset,
                    offset + limit
                );

                // Cập nhật tổng số stores để phân trang chính xác
                setTotalCount(sortedAllStores.length);

                // Tạo dữ liệu cuối cùng với số lượng chính xác theo limit và đã được sắp xếp
                const finalData = {
                    ...data,
                    listingStores: paginatedStores,
                    listingStoresAggregate: {
                        aggregate: {
                            count: sortedAllStores.length
                        }
                    }
                };

                setStoresData(finalData);
            } else {
                setStoresData(data);
                setTotalCount(
                    data?.listingStoresAggregate?.aggregate?.count || 0
                );
            }

            setStoresLoading(false);
            setStoresError(null);
        } else if (data && !allStoresData) {
            // Fallback nếu chỉ có data từ query thứ hai
            // Thêm trường isSponsor cho các stores trong trường hợp fallback
            if (data.listingStores?.length > 0) {
                const storesWithSponsorFlag = data.listingStores.map(
                    (store) => {
                        const winnerIndex = winnerStoreIds.indexOf(
                            store.storeId
                        );
                        return {
                            ...store,
                            isSponsor: winnerIndex !== -1,
                            winnerIndex
                        };
                    }
                );

                // Sắp xếp theo thứ tự winner
                const sortedStores = storesWithSponsorFlag.sort((a, b) => {
                    const aIsWinner = a.winnerIndex !== -1;
                    const bIsWinner = b.winnerIndex !== -1;

                    if (aIsWinner && bIsWinner) {
                        return a.winnerIndex - b.winnerIndex;
                    } else if (aIsWinner && !bIsWinner) {
                        return -1;
                    } else if (!aIsWinner && bIsWinner) {
                        return 1;
                    }
                    return 0;
                });

                setStoresData({
                    ...data,
                    listingStores: sortedStores
                });
            } else {
                setStoresData(data);
            }

            setTotalCount(data?.listingStoresAggregate?.aggregate?.count || 0);
            setStoresLoading(false);
            setStoresError(null);
        }

        if (loading || allStoresLoading) {
            setStoresLoading(true);
        }

        if (error) {
            setStoresError(error);
            setStoresLoading(false);
        }
    }, [
        data,
        allStoresData,
        loading,
        allStoresLoading,
        error,
        winnerStoreIds,
        offset,
        limit
    ]);

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
        refetch,
        winnerStoreIds,
        totalCount
    };
};
