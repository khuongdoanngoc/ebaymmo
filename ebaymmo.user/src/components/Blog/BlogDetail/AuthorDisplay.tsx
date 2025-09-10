'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/libs/datetime';

interface AuthorDisplayProps {
    authorSlug?: string;
    authorName?: string;
    authorImage?: string;
    created_at: string;
}

export default function AuthorDisplay({
    authorSlug = '',
    authorName = 'No name',
    authorImage = '',
    created_at
}: AuthorDisplayProps) {
    const [authorInfo, setAuthorInfo] = useState<any>(null);

    useEffect(() => {
        // Đọc thông tin từ localStorage
        const storedAuthor = localStorage.getItem('currentAuthor');
        if (storedAuthor) {
            setAuthorInfo(JSON.parse(storedAuthor));
            // Xóa sau khi đã sử dụng
            localStorage.removeItem('currentAuthor');
        }
    }, []);

    const authorAvatar =
        authorInfo?.avatar || authorImage || '/images/avatar.svg';
    const displayName = authorInfo?.name || authorName || 'Unknown Author';

    return (
        <div className="blog-author flex gap-[14px] items-center">
            <div className="flex gap-[10px] items-center">
                <a
                    className="flex gap-[10px] items-center group"
                    href={`/user-detail/${authorSlug}`}
                >
                    <img
                        src={authorAvatar || '/images/avatar.svg'}
                        alt=""
                        width="35"
                        height="35"
                        className="rounded-full transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="text-[18px] font-medium leading-[25.2px] text-[#47A8DF] hover:text-blue-600 transition-colors duration-300">
                        {displayName}
                    </span>
                </a>
            </div>
            <span className="text-[#585858]">|</span>

            <div className="flex gap-[5px] items-center">
                <img src="/images/clock.svg" alt="" />
                <div className="flex gap-[6px] items-center justify-center text-[16px] font-normal leading-[25.6px] text-[#6C6C6C] font-beausans2">
                    <span>{formatDate(created_at, 'DD/MM/YYYY')}</span>
                </div>
            </div>
        </div>
    );
}
