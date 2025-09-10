'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ContentManagementList from './ContentManagementList';
import FormSearch from './FormSearch';

interface ContentManagementClientProps {
    data: any;
}

export default function ContentManagementClient({
    data
}: ContentManagementClientProps) {
    const t = useTranslations('content-management');

    if (!data) {
        return (
            <div className="flex flex-col border lg:py-[40px] lg:px-[46px] px-[20px] py-[20px] sm:max-w-unset sm:ml-[20px] sm:max-w-[100%] rounded-[15px] border-border_color bg-white gap-[26px] font-beausans max-[390px]:max-w-[330px]">
                {t('postNotFound')}
            </div>
        );
    }

    return (
        <div className="flex flex-col border lg:py-[40px] lg:px-[46px] px-[20px] py-[20px] sm:max-w-unset sm:ml-[20px] sm:max-w-[100%] rounded-[15px] border-border_color bg-white gap-[26px] font-beausans max-[390px]:max-w-[330px]">
            <div className="flex items-center self-stretch justify-between">
                <h2 className="text-neutral-400 font-bold text-[24px] leading-[140%]">
                    {t('publicPosts')}
                </h2>
                <div>
                    <Link
                        href={`${process.env.NEXT_PUBLIC_GHOST_API_URL}/ghost/#/editor/post`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <button className="flex gap-[10px] bg-gradient-to-r from-[#F15959] to-[#D33E3E] px-[25px] py-[10px] text-[18px] items-center text-[#FFF] rounded-[20px] font-beau-sans text-base font-normal leading-[25.6px] whitespace-nowrap">
                            {t('post')}
                            <img
                                src="/images/send_white.svg"
                                alt=""
                                className="w-[18px] h-[18px]"
                            />
                        </button>
                    </Link>
                </div>
            </div>
            <div className="flex flex-col gap-[30px] self-stretch flex-start">
                <div className="flex w-full lg:flex-row flex-col mx-auto justify-between self-stretch">
                    <FormSearch />
                </div>
                <ContentManagementList data={data} />
            </div>
        </div>
    );
}
