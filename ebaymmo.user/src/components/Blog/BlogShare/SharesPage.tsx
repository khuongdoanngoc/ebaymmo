'use client';

import { useEffect, useState } from 'react';
import PostShareItem from '@/components/Post/PostShareItem';
import Pagination from '@/components/BaseUI/Pagination/Pagination';
import usePagination from '@/hooks/usePagination';
import PostSkeleton from '@/components/Skeleton/PostSkeleton';
import { useTranslations } from 'next-intl';

interface Post {
    blogId: string;
    ghostId: string;
    authorUsername: string;
    authorImages: string;
    authorId: string;
    description: string;
    images: string;
    postingDay: string;
    views: number;
    likes: number;
    slug: string;
    title: string;
}

interface PaginationMeta {
    page: number;
    limit: number | string;
    pages: number;
    total: number;
    next: number | null;
    prev: number | null;
}

interface GhostResponse {
    posts: Post[];
    meta: {
        pagination: PaginationMeta;
    };
}

interface SharesPageProps {
    initialData: GhostResponse;
    allPosts?: boolean;
    apiEndpoint?: string;
}

export default function SharesPage({
    initialData,
    allPosts = false,
    apiEndpoint = '/shares/api'
}: SharesPageProps) {
    const [data, setData] = useState<GhostResponse>(initialData);
    const { limit, page, setPage } = usePagination('/shares', 6, 1);
    const [loading, setLoading] = useState(true);
    const [displayPosts, setDisplayPosts] = useState<Post[]>([]);

    const t = useTranslations('shares');

    useEffect(() => {
        setLoading(true);
        setData(initialData);
        setDisplayPosts(initialData.posts);
        setLoading(false);
    }, [page, limit, apiEndpoint, allPosts, initialData.posts]);

    const handlePostClick = (post: any) => {
        localStorage.setItem(
            'currentAuthor',
            JSON.stringify({
                name: post.authorUsername,
                avatar: post.authorImages
            })
        );
    };

    return (
        <div className="flex flex-col gap-8">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <PostSkeleton key={index} />
                    ))}
                </div>
            ) : displayPosts && displayPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayPosts.map((post) => (
                        <div
                            key={post.blogId}
                            onClick={() => handlePostClick(post)}
                        >
                            <PostShareItem
                                key={post.blogId}
                                id={post.blogId}
                                image={post.images}
                                date={post.postingDay}
                                title={post.title}
                                description={post.description}
                                slug={post.slug}
                                author={{
                                    name: post.authorUsername,
                                    avatar: post.authorImages,
                                    slug: post.authorId
                                }}
                                likes={post.likes}
                                views={post.views}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">{t('noPost')}</p>
                </div>
            )}

            {data.meta?.pagination?.total > 0 && (
                <div className="mt-8">
                    <Pagination
                        page={page}
                        limit={limit}
                        setPage={setPage}
                        total={data.meta.pagination.total}
                    />
                </div>
            )}
        </div>
    );
}
