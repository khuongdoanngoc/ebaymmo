'use client';

import { useTranslations } from 'next-intl';

export default function BlogCommentTotal() {
    const t = useTranslations('post');
    return (
        <>
            <h2 className="text-[#2A2B2E] text-[24px] font-bold leading-[140%]">
                {t('comment.title')}
            </h2>
        </>
    );
}
