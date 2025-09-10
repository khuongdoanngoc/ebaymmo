'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SearchIcon from '@images/search.svg';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
    className?: string;
    defaultValue?: string;
    currentTag?: string;
}

export default function SearchBar({
    placeholder = 'What do you want to find?',
    onSearch,
    className = '',
    defaultValue = '',
    currentTag = ''
}: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState(defaultValue);
    const router = useRouter();

    const t = useTranslations('shares');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchQuery);
        } else {
            const url = new URL('/shares', window.location.origin);
            if (searchQuery) url.searchParams.set('query', searchQuery);
            if (currentTag) url.searchParams.set('tag', currentTag);
            router.push(url.toString());
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`relative flex items-center w-full max-w-[1570px] mx-auto ${className}`}
        >
            <div className="relative w-full">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Image
                        src={SearchIcon}
                        alt="Search"
                        width={20}
                        height={20}
                    />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('placeholder')}
                    className="w-full py-4 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                />
            </div>
        </form>
    );
}
