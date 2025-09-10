import Breadcrumb from '../_components/Breadcrumb';
import SearchBar from '@/components/SearchBar/SearchBar';
import FilterTags from '@/components/FilterTags/FilterTags';
import SharesPage from '@/components/Blog/BlogShare/SharesPage';
import axios from 'axios';
import { GET_TAG } from '@/app/api/blog/api';
import { headers } from 'next/headers';
import { useTranslations } from 'next-intl';
interface Post {
    likes?: number;
    totalView?: number;
    authorUsername: string;
    blogId: string;
    createAt: string;
    description: string;
    donateAmount: number;
    donationCount: number;
    email: string;
    ghostId: string;
    images: string;
    postingDay: string;
    title: string;
    slug: string;
    updateAt: string;
    user: {
        username: string;
        userId: string;
        images: string;
    };
}

export default async function Shares({
    searchParams
}: {
    searchParams: Promise<{
        tag?: string;
        page?: string;
        limit?: string;
        query?: string;
    }>;
}) {
    try {
        // const t = useTranslations('shares');
        const resolvedParams = await searchParams;
        const tag = resolvedParams.tag || '';
        const page = resolvedParams.page || '1';
        const limit = resolvedParams.limit || '6';
        const query = resolvedParams.query || '';

        const searchParamsObj = new URLSearchParams();
        if (tag && tag !== '') {
            searchParamsObj.append('tags', tag);
        }
        if (query && query !== '') {
            searchParamsObj.append('query', query);
        }
        searchParamsObj.append('page', page);
        searchParamsObj.append('limit', limit);

        const headersList = await headers();
        const protocol =
            process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const host = headersList.get('host') || 'localhost:3000';
        const baseURL = `${protocol}://${host}`;

        const { data } = await axios.get(
            `${baseURL}/api/search-blog/?${searchParamsObj.toString()}`
        );

        // Format data for SharesPage

        const formattedData = {
            posts:
                data.blogs &&
                data.blogs
                    .filter((post: Post | null): post is Post => post !== null)
                    .map((post: Post) => ({
                        blogId: post.blogId,
                        ghostId: post.ghostId,
                        title: post.title,
                        authorUsername: post.user.username,
                        authorImages: post.user.images,
                        authorId: post.user.userId,
                        description: post.description,
                        images: post.images,
                        slug: post.slug,
                        postingDay: post.postingDay,
                        views: post.totalView || 0,
                        likes: post.likes || 0
                    })),
            meta: {
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: data.pagination.totalPages,
                    total: data.pagination.total,
                    next:
                        data.pagination.total > parseInt(limit) * parseInt(page)
                            ? parseInt(page) + 1
                            : null,
                    prev: parseInt(page) > 1 ? parseInt(page) - 1 : null
                }
            }
        };

        // console.log(formattedData);
        // Fetch tags
        const responseTags = await GET_TAG();
        const tagsData = await responseTags.json();

        // Format tags for FilterTags component
        const formattedTags = Array.isArray(tagsData)
            ? tagsData.map((tag: any) => ({
                  id: tag.slug,
                  label: tag.name,
                  href: `/shares?tag=${tag.slug}`
              }))
            : [];

        return (
            <div className="container mx-auto px-3 py-10 max-w-[1564px]">
                <div className="flex flex-col gap-8">
                    <div>
                        <Breadcrumb
                            key="Shares"
                            forUrl={'shares?tag='}
                            type="Shares"
                        />
                    </div>
                    <div className="w-full">
                        <SearchBar
                            className="w-full"
                            defaultValue={query}
                            currentTag={tag}
                        />
                    </div>

                    <div className="w-full">
                        <FilterTags
                            tags={[
                                { id: '', label: 'All', href: '/shares' },
                                ...formattedTags
                            ]}
                            activeTagId={tag}
                            currentQuery={query}
                        />
                    </div>

                    <SharesPage
                        key={tag}
                        initialData={formattedData}
                        allPosts={true}
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.log('Error fetching data:', error);
        return (
            <div className="container mx-auto px-4 py-8">
                <h1>Error loading posts</h1>
                <p>Sorry, there was a problem fetching the blog posts.</p>
            </div>
        );
    }
}
