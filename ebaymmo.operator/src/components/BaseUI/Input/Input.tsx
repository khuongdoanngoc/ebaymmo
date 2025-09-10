'use client';

// import Image from 'next/image';
import React, { useState } from 'react';

interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    type?: 'number' | 'text' | 'password' | 'textarea' | 'checkbox' | 'search';
    label?: string;
    error?: boolean;
    errorMessage?: string;
    className?: string;
    id?: string;
    display?: string;
    notEyeIcon?: boolean;
    placeHolder?: string;
    rounded?: string; // Thêm prop mới
    labelClassName?: string;
    name?: string;
}

export default function Input({
    type,
    label,
    error,
    errorMessage,
    className,
    id,
    display,
    placeHolder,
    notEyeIcon = false,
    rounded = 'rounded-[14px]', // Giá trị mặc định
    labelClassName,
    name,
    ...props
}: InputProps) {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const getType = () => {
        if (type === 'password') {
            return showPassword ? 'text' : 'password';
        }
        return type === 'number' ? 'number' : 'text';
    };

    return (
        <div className={'relative mt-2'} style={{ width: display }}>
            <label
                className={`absolute top-[-13px] left-3 bg-white px-2 text-[#3F3F3F] font-medium leading-6 ${labelClassName}`}
                htmlFor={id}
            >
                {label}
            </label>
            {type === 'textarea' ? (
                <textarea
                    {...props}
                    id={id}
                    className={`w-full py-4 px-5 ${rounded} border border-[#7B7B7B] text-[#3F3F3F] placeholder:font-medium resize-y flex flex-start gap-1 focus:border-[#33A959] caret-[#33A959] focus:outline-none focus:ring-1 focus:ring-[#33A959] self-stretch ${
                        error &&
                        'border-red-500 focus:ring-red-500 caret-red-500 text-red-500 focus:border-red-500'
                    }  ${className}`}
                />
            ) : type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                    <input
                        {...props}
                        id={id}
                        type="checkbox"
                        className={`w-[24px] h-[24px] ${rounded} border border-[#7B7B7B] text-[#33A959] focus:ring-2 focus:ring-[#33A959] ${
                            error && 'border-red-500 focus:ring-red-500'
                        }`}
                    />
                    {label && <span className="text-[#3F3F3F]">{label}</span>}
                </div>
            ) : type === 'search' ? (
                <div className={'relative mt-2'} style={{ width: display }}>
                    <img
                        src="/images/search.svg"
                        alt="Search icon"
                        className="absolute left-[22px] top-1/2 transform -translate-y-1/2 text-gray-500"
                    />
                    <input
                        {...props}
                        id={id}
                        name={name}
                        type={getType()}
                        placeholder={placeHolder}
                        className={`w-full md:py-4 md:px-[50px] py-[10px] pr-[15px] pl-[50px] ${rounded} text-[#3F3F3F] placeholder:font-medium flex flex-start gap-1 bg-bg_search caret-[#33A959] focus:outline-none focus:ring-1 focus:ring-[#fff] self-stretch ${
                            error &&
                            'border-red-500 focus:ring-red-500 caret-red-500 text-red-500 focus:border-red-500'
                        } ${className}`}
                    />
                </div>
            ) : (
                <input
                    {...props}
                    id={id}
                    type={getType()}
                    placeholder={placeHolder}
                    className={`w-full py-4 px-5 ${rounded} border border-[#7B7B7B] text-[#3F3F3F] placeholder:font-medium flex flex-start gap-1 focus:border-[#33A959] caret-[#33A959] focus:outline-none focus:ring-1 focus:ring-[#33A959] self-stretch ${
                        error &&
                        'border-red-500 focus:ring-red-500 caret-red-500 text-red-500 focus:border-red-500'
                    } ${className}`}
                />
            )}
            {type === 'password' && (
                <button
                    type="button"
                    tabIndex={10}
                    onClick={togglePasswordVisibility}
                    style={{ top: error ? 'calc(50% - 12px)' : '50%' }}
                    className="absolute right-3 transform -translate-y-1/2 text-gray-600"
                >
                    {!notEyeIcon ? (
                        showPassword ? (
                            <img
                                src={'/images/eye-icon.svg'}
                                width={24}
                                height={24}
                                alt="eye-icon"
                            />
                        ) : (
                            <img
                                src={'/images/eye-closed-icon.svg'}
                                width={24}
                                height={24}
                                alt="eye-closed-icon"
                            />
                        )
                    ) : (
                        <></>
                    )}
                </button>
            )}
            {error && (
                <label className="text-red-500 font-medium">
                    {errorMessage}
                </label>
            )}
        </div>
    );
}
