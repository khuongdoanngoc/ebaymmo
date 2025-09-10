'use client';

import { formatDateTime } from '@/libs/datetime';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    useAddBlogFavoriteMutation,
    useRemoveBlogFavoriteMutation,
    useGetUserFavoriteBlogsQuery
} from '@/generated/graphql';
import { useState, useEffect, useMemo } from 'react';

interface PostShareItemProps {
    id: string;
    image: string;
    date: string;
    title: string;
    description: string;
    author: {
        name: string;
        avatar: string;
        slug: string;
    };
    likes: number;
    views: number;
    slug: string;
    onItemClick?: () => void;
}

// Hook để lấy và quản lý danh sách favorites
function useBlogFavorites() {
    const { data: session } = useSession();
    const [favoriteBlogIds, setFavoriteBlogIds] = useState<string[]>([]);

    const { data, refetch } = useGetUserFavoriteBlogsQuery({
        variables: {
            userId: session?.user?.id || '',
            limit: 20
        },
        skip: !session?.user?.id,
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if (data?.blogFavourite) {
            const ids = data.blogFavourite.map((item) => item.blog.blogId);
            setFavoriteBlogIds(ids);
        }
    }, [data]);

    const isFavorited = useMemo(() => {
        return (blogId: string) => favoriteBlogIds.includes(blogId);
    }, [favoriteBlogIds]);

    return { isFavorited, refetch };
}

export default function PostShareItem({
    id,
    image,
    date,
    title,
    description,
    author,
    likes,
    slug,
    views,
    onItemClick,
    isFavorited = false
}: PostShareItemProps & { isFavorited?: boolean }) {
    const { data: session } = useSession();

    const { isFavorited: checkIsFavorited, refetch } = useBlogFavorites();
    const [favorite, setFavorite] = useState(isFavorited);

    // Cập nhật từ favorites API
    useEffect(() => {
        if (session?.user?.id) {
            setFavorite(checkIsFavorited(id));
        }
    }, [checkIsFavorited, id, session?.user?.id]);

    const [addFavorite] = useAddBlogFavoriteMutation();
    const [removeFavorite] = useRemoveBlogFavoriteMutation();

    const handleFavoriteClick = async () => {
        if (!session?.user?.id) {
            return; // Không làm gì nếu chưa đăng nhập
        }

        // Optimistic update - cập nhật UI ngay lập tức
        setFavorite(!favorite);

        try {
            if (favorite) {
                // Remove from favorites
                await removeFavorite({
                    variables: {
                        blogId: id,
                        userId: session.user.id
                    }
                });
            } else {
                // Add to favorites
                await addFavorite({
                    variables: {
                        blogId: id,
                        userId: session.user.id
                    }
                });
            }
            // Làm mới dữ liệu favorite từ server
            refetch();
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Nếu có lỗi, hoàn tác thay đổi UI
            setFavorite(favorite);
        }
    };

    return (
        <div className="flex flex-col bg-white rounded-[20px] overflow-hidden border border-[#EFEFEF] h-[auto] max-w-[460px]">
            <div className="relative">
                {/* Heart icon */}
                <button
                    className="absolute top-4 right-4 z-10 cursor-pointer"
                    onClick={handleFavoriteClick}
                >
                    <Image
                        src={
                            favorite
                                ? '/images/heart-checked.svg'
                                : '/images/heart.2.png'
                        }
                        alt="like"
                        width={30}
                        height={30}
                        className="transition-transform hover:scale-110"
                    />
                </button>

                {/* Main image */}
                <div className="relative w-full overflow-hidden">
                    <Link href={`/shares/${slug}`} onClick={onItemClick}>
                        <Image
                            src={image || '/images/facebookproduct.png'}
                            alt={title}
                            width={460}
                            height={278}
                            className="object-cover transition-transform duration-300 !h-[278px] hover:scale-110 cursor-pointer"
                        />
                    </Link>
                </div>
            </div>

            <div className="px-2 py-4 flex justify-between items-center">
                {/* Date */}
                <span className="text-[16px] text-[#6C6C6C] leading-[25.6px] font-normal">
                    {formatDateTime(date)}
                </span>

                {/* Stats */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 cursor-pointer">
                        <Image
                            src="/images/heart-icon2.svg"
                            alt="likes"
                            width={20}
                            height={20}
                        />
                        <span className="text-[16px] text-[#6C6C6C] leading-[25.6px] font-normal">
                            {likes}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 cursor-pointer">
                        <Image
                            src="/images/eye.4.svg"
                            alt="views"
                            width={16}
                            height={16}
                        />
                        <span className="text-[16px] text-[#6C6C6C] leading-[25.6px] font-normal">
                            {views}
                        </span>
                    </div>
                </div>
            </div>

            <div className="pb-[15px] px-2">
                <div className="min-h-[136px]">
                    {/* Title */}
                    <Link href={`/shares/${slug}`} onClick={onItemClick}>
                        <span className="text-[#3F3F3F] font-bold font-beau-sans  text-[24px] leading-[33.6px] line-clamp-2 mb-2 hover:text-primary-500">
                            {title}
                        </span>
                    </Link>

                    {/* Description */}
                    <span className="text-[18x] text-[#6C6C6C] font-beau-sans text-base  font-normal leading-[28.8px] line-clamp-2 mb-4">
                        {description}
                    </span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2">
                    <a
                        href={`/user-details/${author.slug}`}
                        className="flex items-center gap-2"
                        onClick={onItemClick}
                    >
                        <Image
                            src={author.avatar ?? '/images/avatar.svg'}
                            alt={author.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                        />
                        <span className="text-[14px] text-[#47A8DF] cursor-pointer hover:text-[#226891]">
                            {author.name}
                        </span>
                    </a>
                </div>
            </div>
        </div>
    );
}
