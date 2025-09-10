'use client';

import { useState } from 'react';
import Input from '@/components/BaseUI/Input';
import Button from '@/components/BaseUI/Button';
import { useSession } from 'next-auth/react';
import {
    useCreateBlogCommentMutation,
    useGetBlogBySlugQuery
} from '@/generated/graphql';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useTranslations } from 'next-intl';

interface BlogCommentFormProps {
    slug: string;
    parentId?: string;
}

export default function BlogCommentForm({
    slug,
    parentId
}: BlogCommentFormProps) {
    const { data: session } = useSession();
    const { showModal } = useStatusModal();
    const [content, setContent] = useState('');
    const [createComment] = useCreateBlogCommentMutation();

    const { data: blogData, loading: blogLoading } = useGetBlogBySlugQuery({
        variables: { slug },
        fetchPolicy: 'network-only'
    });

    const blogId = blogData?.blogs[0]?.blogId;
    const handleSubmit = async () => {
        if (!blogId) {
            showModal(
                'error',
                'Cannot post comment at this time. Please try again later.'
            );
            return;
        }
        try {
            await createComment({
                variables: {
                    object: {
                        blogId: blogId || '',
                        messageContent: content,
                        parentId: parentId || null,
                        sentDate: new Date().toISOString(),
                        createAt: new Date().toISOString(),
                        updateAt: new Date().toISOString(),
                        isDeleted: false,
                        userId: session?.user?.id || ''
                    }
                }
            });
            setContent('');
        } catch (error) {
            console.error('Error posting comment:', error);
            showModal('error', 'Cannot post comment. Please try again later.');
        }
    };

    const t = useTranslations('post');

    return (
        <div className="flex flex-col gap-4">
            <Input
                type="textarea"
                className="h-[191px]"
                placeholder={
                    blogLoading
                        ? `${t('comment.loading')}`
                        : `${t('comment.placeHolder')}`
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={blogLoading}
            />
            <p className="text-[#1C1C1C] text-[16px] font-normal leading-[160%]">
                {t('comment.description')}
            </p>
            <Button
                className="w-full mt-[20px] hover:bg-blue-600 transition-colors duration-300"
                width="168px"
                onClick={handleSubmit}
                disabled={blogLoading || !content.trim()}
            >
                {t('comment.submit')}
            </Button>
        </div>
    );
}
