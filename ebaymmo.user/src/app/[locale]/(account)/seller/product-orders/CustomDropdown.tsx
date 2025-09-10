'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface CustomDropdownProps {
    className?: string;
    options?: string[];
    selectedValue?: string;
    onChange?: (value: string) => void;
}

const CustomDropdown = ({
    className = '',
    options: customOptions,
    selectedValue,
    onChange
}: CustomDropdownProps) => {
    const t = useTranslations('custom-dropdown');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(
        selectedValue || t('all')
    );
    const wrapperRef = useRef<HTMLDivElement>(null);

    const defaultOptions = [
        t('all'),
        t('pending'),
        t('successed'),
        t('refunded'),
        t('cancelled')
    ];

    const options = customOptions || defaultOptions;

    // Update selectedOption when selectedValue prop changes
    useEffect(() => {
        if (selectedValue) {
            setSelectedOption(selectedValue);
        }
    }, [selectedValue]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {/* Input field with dropdown icon */}
            <div
                className="w-full h-[42px]  rounded-[10px] border border-[#E1E1E1] px-5 py-2 flex justify-between items-center cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption}</span>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* Dropdown options */}
            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 border rounded-[10px] bg-white shadow-lg z-10 overflow-hidden">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className={`px-5 py-2 cursor-pointer ${
                                selectedOption === option
                                    ? 'bg-[#1a73e8] text-white'
                                    : 'hover:bg-gray-100'
                            }`}
                            onClick={() => {
                                setSelectedOption(option);
                                onChange?.(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
