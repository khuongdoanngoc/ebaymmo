import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface CategoryItemProps {
    name: string;
    imageUrl?: string;
    description: string;
    slug?: string;
    backgroundColor?: string;
    iconClassname?: string;
    loading?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
    name,
    imageUrl,
    description,
    slug,
    backgroundColor = 'white',
    iconClassname,
    loading = false
}) => {
    const t = useTranslations('categorysection');
    if (loading) {
        return (
            <div
                className="item-container relative flex flex-col items-start gap-[10px] p-[26px_37px] h-[325px] flex-[1_0_0] rounded-[25px] shadow-[0px_5px_40px_0px_rgba(0,0,0,0.10)]"
                style={{ backgroundColor }}
            >
                <div className="top animate-pulse">
                    <div className="h-16 w-16 bg-gray-300 rounded-full" />
                </div>

                <div className="bottom flex flex-col items-start gap-[10px] flex-[1_1_0] self-stretch justify-between animate-pulse">
                    <div className="item-info flex flex-col items-start gap-[7px] self-stretch">
                        <div className="h-6 bg-gray-300 rounded mb-2" />
                        <div className="h-4 bg-gray-300 rounded" />
                    </div>
                    <div className="flex gap-[10px]">
                        <div className="h-4 w-24 bg-gray-300 rounded" />
                        <div className="h-6 w-6 bg-gray-300 rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link
            href={`/products?type=product&category=${slug}`}
            className="item-container relative flex flex-col items-start gap-[10px] p-[26px_37px] h-[325px] flex-[1_0_0] rounded-[25px] shadow-[0px_5px_40px_0px_rgba(0,0,0,0.10)]"
            style={{ backgroundColor }}
        >
            <div className="top">
                <img src={imageUrl} alt={name} width="70" height="70" />
            </div>

            <div className="bottom flex flex-col items-start gap-[10px] flex-[1_1_0] self-stretch justify-between">
                <div className="item-info flex flex-col items-start gap-[7px] self-stretch">
                    <h3 className="item-name font-bold text-[24px] leading-[33.6px] bg-gradient-to-r from-[#2C995E] to-[#36B555] bg-clip-text text-transparent">
                        {name}
                    </h3>
                    <p className="item-description text-[18px]">
                        {description}
                    </p>
                </div>
                <div className="flex gap-[10px]">
                    <p className="text-center text-[#F15959] font-bold text-[18px] leading-[28.8px]">
                        {t('seemore')}
                    </p>
                    <Image
                        src="/images/arrow-forward.1.svg"
                        alt="arrow-right"
                        width={24}
                        height={24}
                    />
                </div>
            </div>
            <div className={'absolute bottom-0 right-0'}>
                <img src="images/email-illus.svg" alt="" />
            </div>
        </Link>
    );
};

export default CategoryItem;
