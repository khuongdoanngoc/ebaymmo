'use client';

import React, { useState } from 'react';
import Button from '@/components/BaseUI/Button';
import BlogDonateModal from '../BlogDonateModal/BlogDonateModal';
import { useTranslations } from 'next-intl';

interface BlogDonateButtonProps {
    blogId: string;
}

const BlogDonateButton = ({ blogId }: BlogDonateButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenModal = () => {
        setIsOpen(true);
    };

    const handleCloseModal = () => {
        setIsOpen(false);
    };

    const t = useTranslations('post.donate');

    return (
        <>
            <Button
                className="text-[18px] h-[49px] hover:bg-blue-600 transition-colors duration-300"
                width="166px"
                onClick={handleOpenModal}
            >
                {t('title')}
            </Button>
            {isOpen && (
                <BlogDonateModal onClose={handleCloseModal} blogId={blogId} />
            )}
        </>
    );
};

export default BlogDonateButton;
