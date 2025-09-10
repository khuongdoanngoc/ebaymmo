'use client';

import { useState } from 'react';
import Input from '@/components/BaseUI/Input';
import Button from '@/components/BaseUI/Button';
import { useCreateBlogCommentMutation } from '@/generated/graphql';
import { useSession } from 'next-auth/react';

interface ReplyFormProps {
    blogId: string;
    parentId: string;
    onCancel: () => void;
}

export default function ReplyForm({
    blogId,
    parentId,
    onCancel
}: ReplyFormProps) {
    const [content, setContent] = useState('');
    const [createComment] = useCreateBlogCommentMutation();
    const { data: session } = useSession();
    const handleSubmit = async () => {
        try {
            await createComment({
                variables: {
                    object: {
                        blogId: blogId,
                        messageContent: content,
                        parentId: parentId,
                        sentDate: new Date().toISOString(),
                        createAt: new Date().toISOString(),
                        userId: session?.user?.id || ''
                    }
                }
            });
            setContent('');
            onCancel(); // Đóng form sau khi reply
        } catch (error) {
            console.error('Error posting reply:', error);
        }
    };

    return (
        <div className="flex flex-col gap-2 mt-2">
            <Input
                type="textarea"
                className="h-[100px]"
                placeholder="Write your reply..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
                <Button
                    className="bg-gray-200 hover:bg-gray-300"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!content.trim()}>
                    Reply
                </Button>
            </div>
        </div>
    );
}
