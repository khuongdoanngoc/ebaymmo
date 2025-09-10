'use client';

import { useTranslations } from 'next-intl';

export default function BlogRelatedTitle() {
    const t = useTranslations('post');
    return (
        <>
            <h1 className="text-[#3F3F3F] text-[24px] font-bold leading-[140%]">
                {t('donate.relatedPost')}
            </h1>
        </>
    );
}
