'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../BaseUI/Input';
import { useTranslations } from 'next-intl';
export default function FormSearch() {
    const [searchText, setSearchText] = useState('');
    const router = useRouter();
    const t = useTranslations('content-management');
    const handleSearch = () => {
        const params = new URLSearchParams(window.location.search);

        if (searchText.trim() === '') {
            params.delete('search'); // Xóa query nếu input rỗng
        } else {
            params.set('search', searchText); // Cập nhật query search
        }

        router.push(`?${params.toString()}`);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSearch(); // Chỉ tìm kiếm khi nhấn Enter
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <Input
                value={searchText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchText(e.target.value)
                }
                display="99%"
                type="search"
                className="rounded-[86px] w-inherit"
                placeHolder={t('search.placeholder')}
                autoFocus
            />
        </form>
    );
}
