'use client';
import { useTranslations } from 'next-intl';
import BlogRelatedItem from './BlogRalatedItem';

interface BlogDetailComponentProps {
    dataRelated: {
        id: string;
        slug: string;
        title: string;
        feature_image: string;
        authors: Array<{
            slug: string;
            name: string;
            profile_image: string | '';
        }>;
        published_at: string;
    }[];
}

export default function BlogRelated({
    dataRelated
}: {
    dataRelated: BlogDetailComponentProps['dataRelated'];
}) {
    const t = useTranslations('post.donate');
    return (
        <>
            <div className="flex flex-col items-start gap-[25px]">
                {dataRelated && dataRelated.length > 0 ? (
                    dataRelated.map((post) => (
                        <BlogRelatedItem
                            key={post.id}
                            slug={post.slug}
                            title={post.title}
                            feature_image={post.feature_image}
                            author={
                                post.authors?.[0] || {
                                    slug: '',
                                    name: 'Unknown Author',
                                    profile_image: ''
                                }
                            }
                            published_at={post.published_at}
                        />
                    ))
                ) : (
                    <p>{t('errorRelated')}</p>
                )}
            </div>
        </>
    );
}
