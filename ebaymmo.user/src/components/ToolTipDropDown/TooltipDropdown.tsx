'use client';

import React, { useState, ReactNode } from 'react';
import Image from 'next/image';
import Accessory from '@images/dropdown-accessory.svg';

interface TooltipDropdownProps {
    children: ReactNode[];
}

const TooltipDropdown: React.FC<TooltipDropdownProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [trigger, content] = children;

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {trigger}
            {isOpen && (
                <div
                    className="absolute text-center text-[14px] z-50 left-1/2 transform -translate-x-1/2 bottom-[calc(100%+12px)] bg-white rounded-[12px] shadow-[0px_5px_30px_0px_rgba(2,99,17,0.15)]"
                    style={{ width: '320px' }}
                >
                    <Image
                        src={Accessory}
                        alt="accessory-icon"
                        width={34}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 rotate-180"
                    />
                    {content}
                </div>
            )}
        </div>
    );
};

export default TooltipDropdown;
