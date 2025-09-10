import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import SellerProfile from '../SellerProfile/SellerProfile';
import Image from 'next/image';
import StoreReview from './StoreReview';
import ReadOnlyEditor from '@/components/BaseUI/Editor/ConvertEditorJS';

interface StoreDetailTabProps {
    description: string;
    sellerId: string;
    averageRating: number;
    totalRate: number;
    storeId: string;
    slug?: string;
}

const StoreDetailTabSkeleton = () => {
    const t = useTranslations();
    return (
        <div>
            {/* Tab buttons skeleton */}
            <div className="flex items-center gap-[30px] md:gap-[60px]">
                <div className="h-[40px] w-[180px] bg-gray-200 rounded animate-pulse" />
                <div className="h-[40px] w-[120px] bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="flex flex-col lg:flex-row mt-[20px] md:mt-[35px] gap-[20px]">
                {/* Description/Review content skeleton */}
                <div className="w-full lg:flex-[1] lg:max-w-[940px]">
                    <div className="p-[20px] md:p-[40px] rounded-[16px] bg-neutral-75">
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-6 w-full bg-gray-200 rounded animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Seller Profile skeleton */}
                <div className="w-full lg:w-[380px]">
                    <div className="p-5 bg-neutral-75 rounded-[16px] space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            {[1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="h-4 w-full bg-gray-200 rounded animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function StoreDetailTab({
    description,
    sellerId,
    averageRating,
    totalRate,
    storeId,
    slug
}: StoreDetailTabProps) {
    const t = useTranslations();
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>(
        'description'
    );
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSeeMoreBtn, setShowSeeMoreBtn] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'description' && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            const ref = url.searchParams.get('ref');
            url.searchParams.delete('page');
            url.searchParams.delete('limit');
            if (ref) {
                url.searchParams.set('ref', ref);
            }
            window.history.replaceState({}, '', url.toString());
        }
    }, [activeTab]);

    useEffect(() => {
        if (textRef.current && textRef.current.scrollHeight > 290) {
            setShowSeeMoreBtn(true);
        } else {
            setShowSeeMoreBtn(false);
        }
        setIsExpanded(false);
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'description' && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('page');
            url.searchParams.delete('limit');
            window.history.replaceState({}, '', url.toString());
        }
    }, [activeTab]);

    const baseButtonClass =
        'relative pb-[17px] text-[24px] font-[700] transition-colors';
    const activeButtonClass =
        "text-primary after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 after:w-[60%] after:h-[2px] after:bg-[var(--primary-500)] after:visible";
    const inactiveButtonClass = 'text-neutral-400 after:invisible';

    if (!sellerId) {
        return <StoreDetailTabSkeleton />;
    }

    return (
        <div>
            <div className="flex items-center gap-[30px] md:gap-[60px] overflow-x-auto">
                <button
                    onClick={() => setActiveTab('description')}
                    className={`${baseButtonClass} ${
                        activeTab === 'description'
                            ? activeButtonClass
                            : inactiveButtonClass
                    } text-[18px] md:text-[24px] whitespace-nowrap`}
                >
                    {t('product.details.productDescription')}
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`${baseButtonClass} ${
                        activeTab === 'reviews'
                            ? activeButtonClass
                            : inactiveButtonClass
                    } text-[18px] md:text-[24px] whitespace-nowrap`}
                >
                    {t('product.details.reviews')}
                </button>
            </div>
            <div className="flex flex-col lg:flex-row mt-[20px] md:mt-[35px] gap-[20px]">
                <div className="w-full lg:flex-[1] lg:max-w-[940px]">
                    {activeTab === 'description' && (
                        <div className="p-[20px] md:p-[40px] rounded-[16px] bg-neutral-75 backdrop-blur-[2px]">
                            <div className="flex flex-col relative gap-[15px] md:gap-[25px] pb-[40px]">
                                <div className="prose max-w-none">
                                    {description ? (
                                        <ReadOnlyEditor data={description} />
                                    ) : (
                                        <p className="text-gray-500">
                                            {t('product.details.noDescription')}
                                        </p>
                                    )}
                                </div>
                                {showSeeMoreBtn && (
                                    <button
                                        onClick={() =>
                                            setIsExpanded((prev) => !prev)
                                        }
                                        className="flex gap-[10px] items-center absolute left-0 bottom-0 cursor-pointer"
                                    >
                                        <span className="text-primary-500 text-[16px] md:text-[18px] font-[500]">
                                            {isExpanded
                                                ? t('product.details.hide')
                                                : t('product.details.seeMore')}
                                        </span>
                                        <Image
                                            src={'/images/drop-down.svg'}
                                            alt="arrowIcon"
                                            width={24}
                                            height={24}
                                            className={`w-[20px] h-[20px] md:w-[24px] md:h-[24px] ${
                                                isExpanded ? 'rotate-180' : ''
                                            } transition-transform duration-300`}
                                        />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'reviews' && (
                        <StoreReview storeId={storeId} slug={slug} />
                    )}
                </div>
                <div className="w-full lg:w-auto">
                    <SellerProfile
                        sellerId={sellerId}
                        averageRating={averageRating}
                        totalRate={totalRate}
                    />
                </div>
            </div>
        </div>
    );
}
