'use client';
import { useTranslations } from 'next-intl';

export default function BlogDonateTitle() {
    const t = useTranslations('post.donate');
    return (
        <>
            <h2 className="text-[#3F3F3F] text-[24px] font-bold leading-[140%]">
                {t('enjoy')}
            </h2>
            <p className="text-[#1C1C1C] text-[16px] font-normal leading-[160%] self-stretch">
                {t('description')}
            </p>
        </>
    );
}
