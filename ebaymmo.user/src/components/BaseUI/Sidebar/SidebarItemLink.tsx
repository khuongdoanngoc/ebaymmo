import Link from 'next/link';
import Image from 'next/image';

interface SidebarItemLinkProps {
    titleLink: string;
    imageLink: string;
    isCollapsed: boolean;
    url: string;
    className?: string;
    isActive?: boolean;
    onClick?: () => void;
}

export default function SidebarItemLink({
    titleLink,
    imageLink,
    isCollapsed,
    className,
    isActive,
    url,
    onClick
}: SidebarItemLinkProps) {
    return (
        <Link
            href={url}
            onClick={onClick}
            className={`flex items-center sm:gap-[12px] gap-[18px] p-[13px_22px] rounded-lg transition-colors duration-300 ${className} ${
                isActive ? 'bg-[#B9F7CD]' : 'bg-transparent'
            }`}
        >
            <Image
                src={imageLink}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
            />
            <span
                className={`sm:text-[18px] text-[16px] font-normal leading-[28.8px] text-[#1C1C1C] ${
                    isCollapsed ? 'hidden' : 'block'
                }`}
            >
                {titleLink}
            </span>
        </Link>
    );
}
