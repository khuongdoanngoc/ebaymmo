'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import FavouriteStoreItem from './FavouriteStoreItem';
import { useFavouriteStoreQuery } from '@/generated/graphql';
import usePagination from '@/hooks/usePagination';
import Pagination from '../BaseUI/Pagination';

export default function FavouriteStore() {
    const t = useTranslations();
    const { data: session, status } = useSession();
    const [userId, setUserId] = useState<string | null>(null);

    const {
        limit,
        offset,
        setPage: originalSetPage,
        page
    } = usePagination('/user/your-favourite-store', 5);

    // Memoize the setPage function to prevent unnecessary re-renders
    const setPage = useCallback(
        (newPage: number | ((prevState: number) => number)) => {
            originalSetPage(newPage);
        },
        [originalSetPage]
    );

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            setUserId(session.user.id);
        }
    }, [session, status]);

    const { data, loading, error } = useFavouriteStoreQuery({
        variables: {
            limit,
            offset,
            where: {
                userId: {
                    _eq: userId
                }
            }
        },
        fetchPolicy: 'cache-and-network',
        skip: !userId
    });

    // Dùng useMemo để tối ưu hóa việc xử lý danh sách wishlist
    const favouriteStores = useMemo(() => {
        return data?.wishlist?.filter((item) => item.store) || [];
    }, [data]);

    const totalCount = useMemo(() => {
        return data?.wishlistAggregate?.aggregate?.count || 0;
    }, [data]);

    if (status === 'loading' || loading)
        return (
            <div className="flex flex-col border lg:py-[40px] lg:px-[46px] px-[20px] py-[20px] lg:max-w-[1230px] sm:max-w-unset sm:ml-[20px] sm:max-w-[100%] lg:w-[1030px] rounded-[15px] border-border_color bg-white gap-[26px] font-beausans max-[390px]:max-w-[330px]">
                <h2 className="title-favourite-store text-[var(--Neutral-400,#3F3F3F)] text-[24px] font-bold leading-[140%]">
                    {t('store.details.favoriteStores')}
                </h2>
                <div className="flex flex-col lg:gap-[25px] gap-[35px] self-stretch lg:w-full ">
                    {[...Array(5)].map((_, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center p-[20px] border rounded-[10px] animate-pulse h-[300px]"
                        >
                            <div className="flex items-center gap-4">
                                {/* Store icon */}
                                <div className="w-[270px] h-[180px] bg-gray-200 rounded-[10px]" />

                                {/* Store info */}
                                <div className="flex flex-col gap-2">
                                    <div className="h-7 w-[200px] bg-gray-200 rounded" />
                                    <div className="h-7 w-[200px] bg-gray-200 rounded" />

                                    <div className="flex flex-col gap-4 mt-1">
                                        <div className="h-5 w-[100px] bg-gray-200 rounded" />
                                        <div className="h-5 w-[100px] bg-gray-200 rounded" />
                                        <div className="h-5 w-[100px] bg-gray-200 rounded" />
                                    </div>
                                </div>
                            </div>

                            {/* Price and button */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-6 w-[80px] bg-gray-200 rounded" />
                                <div className="h-[40px] w-[80px] bg-gray-200 rounded-[20px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="flex flex-col border lg:py-[40px] lg:px-[46px] px-[20px] py-[20px]  sm:max-w-unset sm:ml-[20px] sm:max-w-[100%]   rounded-[15px] border-border_color bg-white gap-[26px] font-beausans max-[390px]:max-w-[330px] ">
            <h2 className="title-favourite-store text-[var(--Neutral-400,#3F3F3F)] text-[24px] font-bold leading-[140%]">
                {t('store.details.favoriteStores')}
            </h2>
            <div className="flex flex-col lg:gap-[25px] gap-[35px] self-stretch lg:w-full">
                {favouriteStores.length === 0 ? (
                    <div className="flex justify-center items-center pt-6 text-gray-500 text-lg">
                        {t('store.details.noFavoriteStores')}
                    </div>
                ) : (
                    favouriteStores.map((item) => {
                        if (!item.store) return null; // Bỏ qua nếu store bị null hoặc undefined
                        return (
                            <FavouriteStoreItem
                                key={item.wishlistId}
                                store={{
                                    avatar: item.store.avatar ?? '',
                                    averageRating:
                                        item.store.averageRating ?? 0,
                                    category: {
                                        type:
                                            item.store.category?.type ??
                                            'Unknown'
                                    },
                                    ratingTotal: item.store.ratingTotal ?? 0,
                                    slug: item.store.slug ?? '',
                                    storeId: item.store.storeId ?? '',
                                    storeName:
                                        item.store.storeName ?? 'Unknown Store',
                                    storePrice: item.store.storePrice ?? '0',
                                    storeTag: item.store.storeTag ?? '',
                                    subTitle: item.store.subTitle ?? '',
                                    totalStockCount:
                                        item.store.totalStockCount ?? 0,
                                    totalSoldCount:
                                        item.store.totalSoldCount ?? 0
                                }}
                            />
                        );
                    })
                )}
                {favouriteStores.length > 0 && (
                    <Pagination
                        total={totalCount}
                        limit={limit}
                        page={page}
                        setPage={setPage}
                    />
                )}
            </div>
        </div>
    );
}
