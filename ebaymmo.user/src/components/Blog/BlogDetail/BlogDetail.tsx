import BlogRelated from '../BlogRelated/BlogRelated';
import { formatDate } from '@/libs/datetime';
import Image from 'next/image';
import { GET_RELATED } from '@/app/api/blog/api';
import BlogComments from '../BlogShare/BlogComments';
import BlogCommentForm from '../BlogShare/BlogCommentForm';
import BlogDonateButton from '../BlogDonateModal/BlogDonateButton';
import AuthorDisplay from './AuthorDisplay';
import { useTranslations } from 'next-intl';
import BlogDonateTitle from '../BlogDonateModal/BlogDonateTitle';
import BlogRelatedTitle from '../BlogRelated/BlogRelatedTitle';
import BlogCommentTotal from '../BlogShare/BlogCommentTotal';

interface BlogDetailComponentProps {
    data: {
        id: string;
        feature_image: string | '/images/facebookproduct.png';
        created_at: string;
        title: string;
        html: string;
        tags: [
            {
                name: string;
                slug: string;
            }
        ];
        authors: [
            {
                slug: string;
                name: string;
                profile_image: string | '';
            }
        ];
        likes: number;
        slug: string;
        totalView: number;
        feature_image_caption: string;
        uuid: string;
    };
}

export default async function BlogDetailComponent({
    data
}: BlogDetailComponentProps) {
    const tags = Array.isArray(data.tags)
        ? data.tags.map((tag) => tag.name).join(',')
        : data.tags;

    // const t = useTranslations('shares');

    const response = await GET_RELATED({ tag: tags, slug: data.slug });
    const dataRelated = await response.json();

    return (
        <>
            <div className="flex lg:flex-row flex-col w-full items-start lg:gap-[90px] gap-[50px]  mt-[20px] ">
                <div className="left-content flex flex-col w-full items-start max-w-[940px] gap-[20px] ">
                    <h2 className="blog-title lg:text-[40px] text-[30px] font-bold leading-[56px] text-gray-800 hover:text-primary-500 transition-colors duration-300">
                        {data.title}
                    </h2>

                    <AuthorDisplay
                        authorSlug={data.authors[0]?.slug}
                        authorName={data.authors[0]?.name}
                        authorImage={data.authors[0]?.profile_image}
                        created_at={data.created_at}
                    />

                    <div className="image flex flex-col mt-[20px] w-full">
                        <Image
                            src={
                                data?.feature_image ||
                                '/images/facebookproduct.png'
                            }
                            width={940}
                            height={750}
                            alt=""
                            className="h-[750px] object-cover"
                        />
                    </div>
                    <div className="blog-content w-full mt-[30px]">
                        <div className="w-full mx-auto text-[18px] pb-[50px] font-normal flex flex-col gap-[20px] leading-[28.8px] text-[#3F3F3F]">
                            <h1 className="text-2xl font-medium mb-4">
                                {data.title}
                            </h1>

                            <div
                                className="prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: data.html }}
                            />
                        </div>
                        <hr />
                        <div className="comment flex flex-col gap-[20px] mt-[40px] w-full">
                            <BlogCommentTotal />
                            <BlogCommentForm slug={data.slug} />
                            <BlogComments slug={data.slug} />
                        </div>
                    </div>
                </div>
                <div className="right-content flex flex-col items-start gap-[35px] max-w-[390px]">
                    <div className="flex flex-col items-start gap-[25px] mt-[10px]">
                        <div className="flex flex-col items-start gap-[10px]">
                            <BlogDonateTitle />
                        </div>
                        <BlogDonateButton blogId={data.uuid} />
                    </div>
                    <hr className="w-full" />
                    <div className="flex flex-col items-start gap-[30px]">
                        <BlogRelatedTitle />
                        <BlogRelated dataRelated={dataRelated} />
                    </div>
                </div>
            </div>
        </>
    );
}
