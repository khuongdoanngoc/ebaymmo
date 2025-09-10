'use client';

import React, { useState, useEffect, useRef } from 'react';
import Accessory from '@/assets/images/dropdown-accessory.svg';
// import Image from 'next/image';

interface DropdownProps {
    button: React.ReactNode; // Button để toggle dropdown
    children: React.ReactNode; // Nội dung dropdown
    width?: string;
    items?: Array<{
        icon: string;
        title: string;
        link: string;
    }>;
}

/**
 * Cách sử dụng dropdown component
 * Truyền vào prop button là 1 thẻ bất kỳ dùng để khi click vào thẻ đó thì dropdown sẽ open
 * Dữ liệu bên trong dropdown có thể tuỳ ý config
 * <Dropdown button={thêm thẻ khi click vào thì hiện dropdown ở đây}> (tuỳ ý code UI trong dropdown ở đây) </Dropdown>
 */
const DropdownAccount: React.FC<DropdownProps> = ({
    button,
    children,
    width = '242px'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // theo dõi click không phải trong dropdown thì close dropdown
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

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Button để toggle dropdown */}
            <div onClick={toggleDropdown} className="cursor-pointer">
                {button}
            </div>

            {/* Dropdown content */}
            {isOpen && (
                <div
                    className="absolute z-50 left-1/2 transform -translate-x-1/2 mt-5 p-5 bg-white rounded-[12px] shadow-[0px_5px_30px_0px_rgba(2,99,17,0.15)]"
                    style={{ width: width }}
                >
                    <img
                        src={Accessory}
                        alt="accessory-icon"
                        width={34}
                        className="absolute -top-3 left-1/2 -translate-x-1/2"
                    />
                    {children}
                </div>
            )}
        </div>
    );
};

export default DropdownAccount;
