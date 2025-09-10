'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGetCategoriesQuery } from '@/generated/graphql';

interface DropdownFilterProps {
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    setCateSlug: (cateSlug: string) => void;
}

const DropdownFilter = ({
    selectedCategory,
    setSelectedCategory,
    setCateSlug
}: DropdownFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { loading, error, data } = useGetCategoriesQuery({
        variables: {
            where: {
                parentCategoryId: {
                    _isNull: true
                }
            }
        },
        fetchPolicy: 'cache-first'
    });

    const categories = useMemo(() => {
        if (data?.categories) {
            return data.categories;
        }
        return [];
    }, [data]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (error) return <p className="text-red-500">Lỗi: {error.message}</p>;

    const handleCategorySelect = (categoryName: string, cateSlug: string) => {
        setSelectedCategory(categoryName);
        setCateSlug(cateSlug);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {!loading ? (
                    <div className="flex items-center cursor-pointer">
                        <span className="text-[#6C6C6C] font-beausans text-base font-normal leading-relaxed mr-[8px] lg:w-[155px] truncate whitespace-nowrap">
                            {selectedCategory}
                        </span>
                        <img
                            src="/images/diamond.png"
                            alt="mũi tên xuống"
                            className="w-[20px] h-[20px] mr-[15px] flex-shrink-0"
                        />
                    </div>
                ) : (
                    <div className="flex items-center cursor-pointer">
                        <div className="h-6 w-[155px] bg-gray-200 rounded animate-pulse mr-[8px]" />
                        <img
                            src="/images/diamond.png"
                            alt="mũi tên xuống"
                            className="w-[20px] h-[20px] mr-[15px] flex-shrink-0"
                        />
                    </div>
                )}
            </div>
            {isOpen && (
                <div
                    className="absolute lg:right-0 z-10 bg-white rounded-lg shadow-lg mt-2 overflow-y-auto 
                    [&::-webkit-scrollbar]:w-2 
                    [&::-webkit-scrollbar-track]:bg-gray-100 
                    [&::-webkit-scrollbar-thumb]:bg-[#33A959] 
                    [&::-webkit-scrollbar-thumb]:rounded-full"
                    style={{ width: '216px', height: '225px' }}
                >
                    <ul className="py-[10px] px-[10px]">
                        <li
                            key="all"
                            className="rounded-[6px] px-[15px] py-[13px] hover:bg-[#E8FFEF] cursor-pointer text-[#6C6C6C]"
                            onClick={() => handleCategorySelect('All', '')}
                        >
                            All
                        </li>
                        {categories.map((category) => (
                            <li
                                key={category.categoryId}
                                className="rounded-[6px] px-[15px] py-[13px] hover:bg-[#E8FFEF] cursor-pointer text-[#6C6C6C]"
                                onClick={() =>
                                    handleCategorySelect(
                                        category.categoryName || '',
                                        category.slug || ''
                                    )
                                }
                            >
                                {category.categoryName}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DropdownFilter;
