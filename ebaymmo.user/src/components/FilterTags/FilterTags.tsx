'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface FilterTagsProps {
    title?: string;
    tags: {
        id: string;
        label: string;
        href: string;
    }[];
    activeTagId?: string;
    currentQuery?: string;
}

export default function FilterTags({
    title = 'Search by:',
    tags = [],
    activeTagId,
    currentQuery
}: FilterTagsProps) {
    const [active, setActive] = useState(activeTagId || tags[0]?.id);
    const router = useRouter();

    const t = useTranslations('shares');

    const handleClick = (tagId: string, href: string) => {
        setActive(tagId);
        const url = new URL(href, window.location.origin);
        if (currentQuery) {
            url.searchParams.set('query', currentQuery);
        }
        router.push(url.toString());
    };

    return (
        <div className="w-full">
            <div className="flex lg:flex-row flex-col items-start gap-[15px] w-full">
                <span className="text-[16px] text-neutral-500 font-medium mt-[10px] whitespace-nowrap" />
                <div className="flex lg:flex-row flex-col items-start gap-[15px] w-full">
                    <span className="text-[16px] text-neutral-500 font-medium mt-[10px] whitespace-nowrap">
                        {t('searchBy')}
                    </span>

                    <div className="flex  flex-wrap gap-x-[10px] gap-y-[20px] w-full">
                        {tags.map((tag) => (
                            <Link
                                href={`/shares/?tag=${tag.id}${currentQuery ? `&query=${currentQuery}` : ''}`}
                                key={tag.id}
                            >
                                <button
                                    key={tag.id}
                                    onClick={() =>
                                        handleClick(tag.id, tag.href)
                                    }
                                    className={`h-[46px] px-[28px] rounded-[7px] text-[#3F3F3F] font-beau-sans text-base font-normal leading-[25.6px] whitespace-nowrap ${
                                        active === tag.id
                                            ? 'bg-[#33A959] text-white'
                                            : 'bg-[#F5F5F5] text-neutral-500 hover:bg-gray-200'
                                    }`}
                                >
                                    {tag.label}
                                </button>
                            </Link>
                        ))}
                    </div>

                    <div className="flex ">
                        <Link
                            href={`${process.env.NEXT_PUBLIC_GHOST_API_URL}/ghost/#/editor/post`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <button className="flex gap-[10px]  bg-gradient-to-r from-[#F15959] to-[#D33E3E] px-[25px] py-[10px] text-[18px] items-center text-[#FFF] rounded-[20px] font-beau-sans text-base font-normal leading-[25.6px] whitespace-nowrap ]">
                                {t('post')}
                                <img
                                    src="/images/send_white.svg"
                                    alt=""
                                    className="w-[18px] h-[18px] "
                                />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
