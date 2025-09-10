import { formatDateTime } from '@/libs/datetime';
import Image from 'next/image';
import Link from 'next/link';

interface BlogRelatedItemProps {
    slug: string;
    title: string;
    feature_image: string;
    author: {
        slug: string;
        name: string;
        profile_image: string | '';
    };
    published_at: string;
}

export default function BlogRelatedItem({
    slug,
    title,
    feature_image,
    author,
    published_at
}: BlogRelatedItemProps) {
    return (
        <div className="flex items-start gap-[19px] w-full group cursor-pointer hover:bg-slate-50 rounded-lg p-3 transition-all duration-300">
            <Link href={`/shares/${slug}`} className="rounded-[10px] ">
                <Image
                    src={feature_image}
                    alt="blog image"
                    width={150}
                    height={150}
                    className="rounded-[10px]  max-w-[250px] h-[113px] object-cover transform transition-transform duration-300 group-hover:scale-105"
                />
            </Link>

            <div className="flex flex-col items-start gap-[13px]">
                <div className="flex gap-[5px] items-center">
                    <Image
                        src="/images/clock.svg"
                        width={16}
                        height={16}
                        alt="clock icon"
                    />
                    <div className="flex gap-[6px] items-center justify-center text-[16px] font-normal leading-[25.6px] text-[#6C6C6C] font-beausans2">
                        <span>{formatDateTime(published_at)}</span>
                    </div>
                </div>
                <Link
                    href={`/shares/${slug}`}
                    className="text-neutral-400 text-[16px] self-stretch font-medium leading-[160%] hover:text-primary-500 transition-colors duration-300"
                >
                    {title}
                </Link>
            </div>
        </div>
    );
}
