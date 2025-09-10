'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-datepicker/dist/react-datepicker.css';

// Import react-datepicker chỉ ở phía client, và ép kiểu component
const DatePicker = dynamic(
    () =>
        import('react-datepicker') as Promise<{
            default: React.ComponentType<any>;
        }>,
    {
        ssr: false
    }
);

interface DatePickerProps {
    label?: string;
    error?: boolean;
    errorMessage?: string;
    className?: string;
    id?: string;
    display?: string;
    rounded?: string;
    placeholder?: string;
    selectedDate?: Date | null;
    labelClassName?: string;
    minDate?: Date | null;
    onChange?: (date: Date | null) => void;
}

export default function CustomDatePicker({
    label,
    error,
    errorMessage,
    className = '',
    id,
    display,
    rounded = 'rounded-[14px]', // Giá trị mặc định
    placeholder,
    labelClassName = '',
    onChange,
    selectedDate,
    minDate
}: DatePickerProps) {
    return (
        <div className="relative mt-2 w-full" style={{ width: display }}>
            <label
                className={`!absolute top-[-13px] left-3 bg-white px-2 text-[#3F3F3F] font-medium leading-6 z-10 ${labelClassName}`}
                htmlFor={id}
            >
                {label}
            </label>

            <DatePicker
                id={id}
                placeholderText={placeholder}
                selected={selectedDate}
                autoComplete="off"
                onChange={onChange}
                dateFormat="dd/MM/yyyy"
                style={{ width: '100%' }}
                className={`w-full py-4 px-5 ${rounded} border border-[#7B7B7B] text-[#3F3F3F] placeholder:font-medium flex flex-start gap-1 focus:border-[#33A959] caret-[#33A959] focus:outline-none focus:ring-1 focus:ring-[#33A959] self-stretch ${
                    error &&
                    'border-red-500 focus:ring-red-500 caret-red-500 text-red-500 focus:border-red-500'
                } ${className}`}
                minDate={minDate}
            />
            {/* {errors.endDate && (
                <label className="text-[#FF0000] font-[500] text-[16px]">
                    {errors.endDate}
                </label>
            )} */}
            {error && errorMessage && (
                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
        </div>
    );
}
