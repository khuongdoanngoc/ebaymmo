import Image from 'next/image';
import React from 'react';

interface StatusModalProps {
    type: 'loading' | 'warning' | 'error' | 'success';
    message?: string;
    isOpen: boolean;
    onClose?: () => void;
    imageSrc?: string; // Chỉ dùng cho warning & error
}

export default function StatusModal({
    type,
    message,
    isOpen,
    onClose
}: StatusModalProps) {
    if (!isOpen) return null;

    const statusConfig = {
        success: {
            text: 'Success',
            imageSrc: null,
            icon: (
                <div className="flex items-center justify-center w-20 h-20 rounded-full border-[0.25rem] border-primary-400">
                    <svg
                        className="w-11 h-11 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
            )
        },
        loading: {
            text: 'Please wait a moment...',
            imageSrc: null,
            icon: (
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center animate-pulse">
                        <svg
                            viewBox="0 0 24 24"
                            className="w-8 h-8 text-primary-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
                </div>
            )
        },
        warning: {
            text: 'Warning!',
            imageSrc: '/images/warning.png',
            icon: null
        },
        error: {
            text: 'Error occurred!',
            imageSrc: '/images/close.png',
            icon: null
        }
    };

    const { imageSrc, text, icon } = statusConfig[type];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="animate-scaleBounce bg-white rounded-lg p-10 max-w-lg w-full mx-4 gap-3 flex flex-col items-center space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                {/* Loading Icon */}
                {(type === 'loading' || type === 'success') && icon}

                {/* Warning & Error Image */}
                {(type === 'warning' || type === 'error') && (
                    <Image
                        width={96}
                        height={96}
                        src={imageSrc || ''}
                        alt="type"
                        className="object-contain"
                    />
                )}

                {/* Message */}
                <p
                    className={
                        'text-lg text-center font-medium text-neutral-500'
                    }
                >
                    {message || text}
                </p>

                {/* Button */}
                {type !== 'loading' && (
                    <button
                        onClick={onClose}
                        className={
                            'px-4 py-2 text-white font-bold rounded-md duration-200 bg-[#7066e0] hover:bg-[#5c53d6] transition ease-in-out '
                        }
                    >
                        OK
                    </button>
                )}
            </div>
        </div>
    );
}
