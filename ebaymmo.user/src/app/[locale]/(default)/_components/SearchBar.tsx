'use client';

import React, { useState, useEffect, useRef } from 'react';
import DropdownFilter from './DropdownFilter';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import useDebounced from '../products/_hooks/useDebounced';
import { useTranslations } from 'next-intl';
import { useStatusModal } from '@/contexts/StatusModalContext';

const SearchBar: React.FC = () => {
    const t = useTranslations();
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const historyDropdownRef = useRef<HTMLDivElement>(null);
    const { showModal } = useStatusModal();

    const [isLogin, setIsLogin] = useState(false);
    const [search, setSearch] = useState<string>('');
    const [category, setCategory] = useState('All');
    const [cateSlug, setCateSlug] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchHistory, setSearchHistory] = useState<
        { content: string; personal: boolean; id: string }[]
    >([]);
    const { data: session, status } = useSession();
    const [suggestions, setSuggestions] = useState<
        { content: string; type: string }[]
    >([]);
    const [topSuggestions, setTopSuggestions] = useState<{ content: string }[]>(
        []
    );

    const debouncedSearch = useDebounced(search, 300);

    const MAX_SEARCH_LENGTH = 100;

    useEffect(() => {
        const fetchSearchHistory = async () => {
            if (isLogin) {
                try {
                    const response = await axios.get('/api/search-history');
                    setSearchHistory(response.data.histories);
                } catch (error) {
                    console.error('Failed to fetch search history:', error);
                }
            }
        };

        fetchSearchHistory();
    }, [isLogin]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!debouncedSearch.trim()) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await axios.get(
                    `/api/search-suggestion?query=${encodeURIComponent(debouncedSearch)}`
                );
                setSuggestions(response.data.suggestions || []);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
                setSuggestions([]);
            }
        };

        fetchSuggestions();
    }, [debouncedSearch]);

    useEffect(() => {
        const fetchTopSuggestions = async () => {
            try {
                const response = await axios.get('/api/search-stats');
                setTopSuggestions(response.data.results || []);
            } catch (error) {
                console.error('Failed to fetch top suggestions:', error);
                setTopSuggestions([]);
            }
        };

        fetchTopSuggestions();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= MAX_SEARCH_LENGTH) {
            setSearch(newValue);
        } else {
            showModal(
                'warning',
                t(`Maximum ${MAX_SEARCH_LENGTH} characters allowed`)
            );
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = e.clipboardData.getData('text');
        const currentLength = search.length;
        const selectionStart = e.currentTarget.selectionStart || 0;
        const selectionEnd = e.currentTarget.selectionEnd || 0;
        const selectedLength = selectionEnd - selectionStart;

        // Tính toán độ dài cuối cùng sau khi paste
        const finalLength = currentLength - selectedLength + pastedText.length;

        if (finalLength > MAX_SEARCH_LENGTH) {
            e.preventDefault();
            showModal(
                'warning',
                t(
                    `Text too long. Maximum ${MAX_SEARCH_LENGTH} characters allowed`
                )
            );
        }
    };

    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && search.trim()) {
            const encodedSearch = search.replace(/\s+/g, '+');
            const encodedCategory = cateSlug.replace(/\s+/g, '+');
            if (encodedCategory) {
                router.push(
                    `/search?query=${encodedSearch}&category=${encodedCategory}`
                );
            } else {
                router.push(`/search?query=${encodedSearch}`);
            }
            setShowDropdown(false);

            if (isLogin) {
                try {
                    await axios.post('/api/search-history', {
                        searchText: search
                    });
                    const response = await axios.get('/api/search-history');
                    setSearchHistory(response.data.histories);
                } catch (error) {
                    console.error('Failed to save search history:', error);
                }
            }
        }
    };

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [session, status, router]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node) &&
                historyDropdownRef.current &&
                !historyDropdownRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (search !== '') {
            const encodedSearch = search.replace(/\s+/g, '+');
            if (cateSlug) {
                router.push(
                    `/search?query=${encodedSearch}&category=${cateSlug}`
                );
            } else {
                router.push(`/search?query=${encodedSearch}`);
            }
        }
    }, [category, cateSlug]);

    const handleHistoryItemClick = async (item: string) => {
        setSearch(item);
        const encodedItem = item.replace(/\s+/g, '+');
        const encodedCategory = cateSlug.replace(/\s+/g, '+');
        router.push(`/search?query=${encodedItem}&category=${encodedCategory}`);
        setShowDropdown(false);

        if (isLogin) {
            try {
                await axios.post('/api/search-history', {
                    searchText: item
                });
                const response = await axios.get('/api/search-history');
                setSearchHistory(response.data.histories);
            } catch (error) {
                console.error('Failed to save search history:', error);
            }
        }
    };

    const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await axios.delete(`/api/search-history/${id}`);
            setSearchHistory(searchHistory.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Failed to delete search history item:', error);
        }
    };

    // Xác định nên hiển thị search history hay suggestions
    const shouldShowSuggestions =
        search.trim() !== '' && suggestions.length > 0;
    const shouldShowHistory =
        isLogin && (!search.trim() || !suggestions.length);

    return (
        <div className="sort-search flex lg:flex-col items-center w-full lg:w-[calc(100% - 176px)] lg:min-w-[500px]">
            <div className="search-box flex lg:flex-row items-center px-[40px] py-[10px] bg-white rounded-[86px] shadow-md w-full lg:w-full relative">
                <div className="filter flex-shrink-0 lg:min-w-[50px]">
                    <DropdownFilter
                        selectedCategory={category}
                        setSelectedCategory={setCategory}
                        setCateSlug={setCateSlug}
                    />
                </div>
                <div className="vertical-line my-2 lg:my-0 w-[1px] h-[29.547px] bg-black" />
                <div className="field-search flex items-center w-full ml-6 relative">
                    <img
                        src="/images/search1.png"
                        alt="Kính lúp"
                        className="w-[20px] h-[20px] mr-[10px]"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t('What are you looking for?')}
                        value={search}
                        onChange={handleInputChange}
                        onKeyDown={handleSearch}
                        onFocus={() => setShowDropdown(true)}
                        onPaste={handlePaste}
                        maxLength={MAX_SEARCH_LENGTH}
                        className="border-none focus:outline-none text-[#6C6C6C] w-full"
                    />
                    {showDropdown && (isLogin || suggestions.length > 0) && (
                        <div
                            ref={historyDropdownRef}
                            className="absolute top-full left-0 right-0 mt-4 bg-white rounded-lg shadow-lg z-10 max-h-[300px] overflow-y-auto w-[calc(100%+40px)] -ml-[20px] lg:w-[calc(100%+80px)] lg:-ml-[40px]"
                        >
                            <div className="p-2">
                                {shouldShowSuggestions && (
                                    <>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2 px-4">
                                            Suggestions
                                        </h3>
                                        <ul className="mb-3">
                                            {suggestions.map(
                                                (suggestion, index) => (
                                                    <li
                                                        key={`suggestion-${index}`}
                                                        className="py-2 px-3 hover:bg-gray-100 cursor-pointer flex items-center"
                                                        onClick={() =>
                                                            handleHistoryItemClick(
                                                                suggestion.content
                                                            )
                                                        }
                                                    >
                                                        <img
                                                            src={
                                                                suggestion.type ===
                                                                'suggestion'
                                                                    ? '/images/search1.png'
                                                                    : '/images/clock.svg'
                                                            }
                                                            alt="Search"
                                                            className="w-4 h-4 mr-2 opacity-50"
                                                        />
                                                        <span>
                                                            {suggestion.content}
                                                        </span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </>
                                )}

                                {shouldShowHistory && (
                                    <>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2 px-4">
                                            {t('Search History')}
                                        </h3>
                                        <ul>
                                            {searchHistory.length > 0 ? (
                                                searchHistory?.map(
                                                    (item, index) => (
                                                        <li
                                                            key={index}
                                                            className="py-2 px-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                                                            onClick={() =>
                                                                handleHistoryItemClick(
                                                                    item.content
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center">
                                                                <img
                                                                    src={
                                                                        item.personal
                                                                            ? '/images/clock.svg'
                                                                            : '/images/search1.png'
                                                                    }
                                                                    alt={
                                                                        item.personal
                                                                            ? 'History'
                                                                            : 'Search'
                                                                    }
                                                                    className="w-4 h-4 mr-2 opacity-50"
                                                                />
                                                                <span>
                                                                    {
                                                                        item.content
                                                                    }
                                                                </span>
                                                            </div>
                                                            {item.personal &&
                                                                item.id && (
                                                                    <div
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            handleDeleteHistoryItem(
                                                                                item.id,
                                                                                e
                                                                            )
                                                                        }
                                                                        className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer font-bold w-6 h-6 flex items-center justify-center"
                                                                    >
                                                                        ×
                                                                    </div>
                                                                )}
                                                        </li>
                                                    )
                                                )
                                            ) : (
                                                <li className="py-2 px-3 text-gray-500">
                                                    {t(
                                                        'No search history found'
                                                    )}
                                                </li>
                                            )}
                                        </ul>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="quick-link hidden lg:flex lg:w-full justify-center">
                <ul className="flex items-center h-[22px] text-white text-sm font-normal leading-[22.4px] whitespace-nowrap mt-[13px]">
                    {topSuggestions.map((suggestion, index) => (
                        <React.Fragment key={index}>
                            <li className="flex items-center mr-[10px]">
                                <button
                                    onClick={() => {
                                        setSearch(suggestion.content);
                                        const encodedContent =
                                            suggestion.content.replace(
                                                /\s+/g,
                                                '+'
                                            );
                                        const encodedCategory =
                                            cateSlug.replace(/\s+/g, '+');
                                        if (encodedCategory) {
                                            router.push(
                                                `/search?query=${encodedContent}&category=${encodedCategory}`
                                            );
                                        } else {
                                            router.push(
                                                `/search?query=${encodedContent}`
                                            );
                                        }
                                    }}
                                    className="text-white hover:underline"
                                >
                                    {suggestion.content}
                                </button>
                            </li>
                            {index < topSuggestions.length - 1 && (
                                <span className="mr-[10px] text-gray-300">
                                    |
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SearchBar;
