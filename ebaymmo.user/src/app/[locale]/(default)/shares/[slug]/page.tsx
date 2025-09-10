import BlogDetailComponent from '@/components/Blog/BlogDetail/BlogDetail';
import Breadcrumb from '../../_components/Breadcrumb';
import { GET_SLUG } from '@/app/api/blog/api';
import { NextRequest } from 'next/server';
import notFound from '@/app/not-found-no-default';
import { Metadata } from 'next';
import { useUpdateBlogMutation } from '@/generated/graphql';
import ViewCounter from '@/components/ViewCounter/ViewCounter';

interface BlogDetails {
    id: string;
    feature_image: string;
    date: string;
    title: string;
    html: string;
    authors: [
        {
            slug: string;
            name: string;
            profile_image: string | '';
        }
    ];
    tags: [
        {
            slug: string;
            name: string;
        }
    ];
    likes: number;
    slug: string;
    totalView: number;
    feature_image_caption: string;
    created_at: string;
    uuid: string;
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    try {
        const { slug } = await params;

        const response = await GET_SLUG({ slug });
        const post = await response.json();

        if (!post || !post.title) {
            return {
                title: 'Post Not Found - SHOP3',
                description: 'The requested post could not be found.'
            };
        }

        return {
            title: `${post.title} `,
            description:
                post.excerpt || post.meta_description || 'Read more on SHOP3',
            alternates: {
                canonical: `${process.env.NEXT_PUBLIC_GHOST_API_URL}/shares/${post.slug}`
            },
            keywords: post.title,
            openGraph: {
                title: post.title,
                description: post.excerpt || post.meta_description,
                url: `${process.env.NEXT_PUBLIC_GHOST_API_URL}/shares/${post.slug}`,
                images: [
                    {
                        url:
                            post.feature_image ||
                            'https://shop3.crbgroup.live/_next/image?url=%2Fimages%2Fblockchain-services.png&w=1920&q=75',
                        width: 1200,
                        height: 630,
                        alt: post.title
                    }
                ],
                siteName: post.title
            }
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'SHOP3 Blog',
            description: 'Stay updated with the latest news about SHOP3'
        };
    }
}

async function BlogDetails({ params }: { params: Promise<{ slug: string }> }) {
    try {
        // Create base URL for Ghost API
        const { slug } = await params;

        const response = await GET_SLUG({ slug });

        const data: BlogDetails = await response.json();

        // Check if data exists and has required properties
        if (!data || !data.slug) {
            return notFound();
        }

        return (
            <section className="w-full flex flex-col items-center">
                <div className="w-full max-w-[1800px] py-[50px] px-6 lg:px-32 2xl:px-36 flex flex-col justify-center">
                    <div className="flex flex-col gap-8">
                        <div>
                            <Breadcrumb
                                key="Shares"
                                forUrl="shares?tag="
                                type="Shares"
                            />
                        </div>
                    </div>
                    <BlogDetailComponent data={data} />
                    <ViewCounter blogUuid={data.uuid} />
                </div>
            </section>
        );
    } catch (error) {
        console.error('Error fetching blog details:', error);
    }
}

export default BlogDetails;
