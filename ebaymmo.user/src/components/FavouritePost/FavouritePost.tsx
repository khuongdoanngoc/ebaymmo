'use client';
import Image from 'next/image';
import Link from 'next/link';
import FavouritePostItem from './FavouritePostItem';
import usePagination from '@/hooks/usePagination';
import Pagination from '../BaseUI/Pagination';
import { useGetUserFavoriteBlogsQuery } from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

export default function FavouritePostComponent() {
    const t = useTranslations('favourite-post');
    const {
        limit = 3,
        offset,
        page,
        setPage
    } = usePagination('/user/your-favourite-post', 3, 1);

    const { data: session } = useSession();
    const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

    const { data, loading, error } = useGetUserFavoriteBlogsQuery({
        variables: {
            userId: userId,
            limit: limit,
            offset: offset
        }
    });

    // Memoize favorite posts data
    const favoritePosts = useMemo(() => {
        if (!data?.blogFavourite) return [];
        return data.blogFavourite;
    }, [data?.blogFavourite]);

    // Lấy tổng số bài viết từ aggregate
    const totalPosts = data?.blogFavouriteAggregate?.aggregate?.count || 0;

    if (loading)
        return (
            <div className="flex flex-col border lg:py-[40px] lg:px-[46px] px-[20px] py-[20px]  rounded-[15px] border-border_color bg-white gap-[26px]">
                <div className="h-[34px] w-[200px] bg-gray-200 rounded animate-pulse" />
                <div className="flex flex-col lg:gap-[25px] gap-[35px] self-stretch">
                    {[1, 2, 3].map((index) => (
                        <FavouritePostSkeleton key={index} />
                    ))}
                </div>
            </div>
        );
    if (error) return <div>{t('error')}</div>;

    // Add check for empty favorite posts
    if (favoritePosts.length === 0) {
        return (
            <div className="flex flex-col border lg:py-[40px] lg:px-[46px] px-[20px] py-[20px] rounded-[15px] border-border_color bg-white gap-[26px]">
                <h2 className="title-favourite-store text-[var(--Neutral-400,#3F3F3F)] text-[24px] font-bold leading-[140%]">
                    {t('title')}
                </h2>
                <p className="text-center text-gray-500">{t('noPosts')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col border lg:py-[40px] lg:px-[46px] px-[20px] py-[20px]  sm:max-w-unset sm:ml-[20px] sm:max-w-[100%]   rounded-[15px] border-border_color bg-white gap-[26px] font-beausans max-[390px]:max-w-[330px] ">
            <h2 className="title-favourite-store text-[var(--Neutral-400,#3F3F3F)] text-[24px] font-bold leading-[140%]">
                {t('title')}
            </h2>
            <div className="flex flex-col lg:gap-[25px] gap-[35px] self-stretch ">
                <div className="flex flex-col items-start gap-[25px] self-stretch">
                    {favoritePosts.map((post) => (
                        <FavouritePostItem key={post.favouriteId} post={post} />
                    ))}
                </div>
                <div className="flex justify-center">
                    <Pagination
                        limit={limit}
                        page={page}
                        setPage={setPage}
                        total={totalPosts}
                    />
                </div>
            </div>
        </div>
    );
}

export function FavouritePostSkeleton() {
    return (
        <div className="flex w-full lg:flex-row flex-col self-stretch items-start gap-[25px] animate-pulse">
            {/* Image skeleton */}
            <div className="image-favourite flex flex-col relative w-full lg:max-w-[290px] md:max-w-full">
                <div className="w-[282px] h-[170px] bg-gray-200 rounded-[15px]" />
                <div className="absolute top-[10px] right-[20px] w-[30px] h-[30px] bg-gray-200 rounded-full" />
            </div>

            {/* Content skeleton */}
            <div className="flex flex-col items-start justify-between self-stretch flex-1">
                <div className="flex flex-col items-start gap-[10px] self-stretch w-full">
                    <div className="h-[25px] bg-gray-200 rounded w-3/4" />
                    <div className="h-[60px] bg-gray-200 rounded w-full" />
                </div>
                <div className="flex items-center gap-[10px] mt-4">
                    <div className="w-[80px] h-[35px] bg-gray-200 rounded-[8px]" />
                </div>
            </div>
        </div>
    );
}
