'use client';

import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: boolean;
    errorMessage?: string;
    className?: string;
    id?: string;
    display?: string;
    rounded?: string;
    placeholder?: string;
    options: { value: string; label: string }[];
}

export default function Select({
    label,
    error,
    errorMessage,
    className,
    id,
    display,
    options,
    rounded = 'rounded-[14px]', // Giá trị mặc định
    ...props
}: SelectProps) {
    return (
        <div className={'relative mt-2 w-full'} style={{ width: display }}>
            <label
                className={
                    'absolute top-[-13px] left-3 bg-white px-2 text-[#3F3F3F] font-medium leading-6'
                }
                htmlFor={id}
            >
                {label}
            </label>
            <select
                {...props}
                id={id}
                className={`placeholder:font-medium w-full py-4 px-5 ${rounded} border border-[#7B7B7B] text-[#3F3F3F] placeholder:font-medium bg-white focus:border-[#33A959] caret-[#33A959] focus:outline-none focus:ring-1 focus:ring-[#33A959] self-stretch appearance-none cursor-pointer
                    [&>option]:py-2 [&>option]:px-4 [&>option]:cursor-pointer [&>option]:border-b [&>option]:border-gray-100 [&>option]:transition-colors [&>option:hover]:bg-[#33A959]/10
                    ${
                        error &&
                        'border-red-500 focus:ring-red-500 caret-red-500 text-red-500 focus:border-red-500'
                    } ${className}`}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && (
                <label className="text-red-500 font-medium">
                    {errorMessage}
                </label>
            )}
        </div>
    );
}
