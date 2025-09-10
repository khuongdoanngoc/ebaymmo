import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
interface FavouritePostItemProps {
    post: {
        favouriteId: string;
        blog: {
            blogId: string;
            title?: string | null;
            images?: string | null;
            postingDay?: string | null;
            favoriteCount?: number | null;
            totalView?: number | null;
            description?: string | null;
            slug?: string | null;
        };
    };
}

export default function FavouritePostItem({ post }: FavouritePostItemProps) {
    const t = useTranslations('favourite-post');
    return (
        <div className="flex w-full  lg:flex-row flex-col self-stretch items-start gap-[25px] ">
            <div className="image-favourite flex flex-col relative w-full  lg:max-w-[290px] md:max-w-full">
                <Link
                    href={`/shares/${post.blog.slug}`}
                    className="block transition-transform duration-300 hover:scale-105"
                >
                    {' '}
                    <Image
                        src={post.blog.images ?? '/images/twt_coin.png'}
                        alt="content-image"
                        width={282}
                        height={170}
                        className="object-cover w-[282px] h-[170px] rounded-[15px]"
                    />
                </Link>
                <button className="absolute top-[10px] right-[20px] transition-transform duration-200 hover:scale-110">
                    <Image
                        src="/images/heart-checked.svg"
                        alt="favorite"
                        width={30}
                        height={30}
                    />
                </button>
            </div>

            <div className="flex flex-col items-start justify-between self-stretch flex-1">
                <div className="flex flex-col items-start gap-[10px] self-stretch">
                    <Link
                        href={`/shares/${post.blog.slug}`}
                        className="self-stretch text-neutral-400 font-bold text-[18px] leading-[140%] hover:text-[#2C995E] transition-colors duration-200"
                    >
                        {post.blog.title}
                    </Link>
                    <p className="self-stretch text-neutral-400 font-normal text-[16px] leading-[160%] line-clamp-3">
                        {post.blog.description}
                    </p>
                </div>
                <Link href={`/shares/${post.blog.slug}`}>
                    <button className="flex h-[39px] lg:mt-0 mt-[10px] px-[25px] py-[10px] items-center gap-[10px] rounded-[86px] border border-[#2C995E] hover:bg-[#2C995E] hover:text-white transition-colors duration-200 bg-white">
                        {t('donate')}
                    </button>
                </Link>
            </div>
        </div>
    );
}
