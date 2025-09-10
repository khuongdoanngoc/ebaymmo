'use client';

import { useUpdateBlogMutation } from '@/generated/graphql';
import { useEffect, useRef } from 'react';

export default function ViewCounter({ blogUuid }: { blogUuid: string }) {
    const [updateBlog, { data, loading, error }] = useUpdateBlogMutation();
    const hasUpdatedRef = useRef(false);

    useEffect(() => {
        const updateViews = async () => {
            // Kiểm tra nếu đã cập nhật rồi thì không cập nhật nữa
            if (hasUpdatedRef.current) return;

            await updateBlog({
                variables: {
                    where: {
                        blogId: { _eq: blogUuid }
                    },
                    _inc: {
                        totalView: 1
                    }
                }
            });

            // Đánh dấu đã cập nhật
            hasUpdatedRef.current = true;
        };

        // Đặt timeout 10 giây trước khi tăng lượt xem
        const timeoutId = setTimeout(() => {
            updateViews();
        }, 10000); // 10 giây

        // Cleanup function để tránh memory leak
        return () => {
            clearTimeout(timeoutId);
        };
    }, [blogUuid, updateBlog]);

    return null; // This component doesn't render anything
}
