'use client';
import usePagination from '@/hooks/usePagination';
import Image from 'next/image';
import Link from 'next/link';
import Pagination from '../BaseUI/Pagination';

interface ContentManagementItemProps {
    imageSrc: string;
    title: string;
    description: string;
    total: number;
    link: string;
    linkPost: string;
    buttonText: string;
}

export default function ContentManagementItem({
    imageSrc,
    title,
    description,
    link,
    linkPost,
    buttonText
}: ContentManagementItemProps) {
    return (
        <div className="flex w-full lg:flex-row flex-col self-stretch items-start gap-[25px] ">
            <Link href={linkPost}>
                {' '}
                <Image
                    src={imageSrc ?? '/images/facebookproduct.png'}
                    alt="content-image"
                    width={282}
                    height={170}
                    className="object-cover w-[282px] h-[170px] rounded-[15px]"
                />
            </Link>

            <div className="flex flex-col items-start justify-between self-stretch flex-1">
                <div className="flex flex-col items-start gap-[10px] self-stretch">
                    <Link
                        href={linkPost}
                        className="self-stretch text-neutral-400 font-bold text-[18px] leading-[140%]"
                    >
                        {title}
                    </Link>
                    <p className="self-stretch text-neutral-400 font-normal text-[16px] leading-[160%] line-clamp-3">
                        {description}
                    </p>
                </div>
                <Link href={link} target="_blank" rel="noopener noreferrer">
                    <button className="flex h-[39px] lg:mt-0 mt-[10px] px-[25px] py-[10px] items-center gap-[10px] rounded-[86px] border border-[#2C995E] hover:bg-[#2C995E] hover:text-white transition-colors duration-200 bg-white">
                        {buttonText}
                    </button>
                </Link>
            </div>
        </div>
    );
}
