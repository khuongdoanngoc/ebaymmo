import Image from 'next/image';
import Avatar from '@images/avatar.svg';
// import HeartIcon from '@images/heart.svg';
import Link from 'next/link';

interface SponsorStoreProps {
    storeId: string;
    storeName: string;
    price: number;
    imageProductUrl?: string;
    imageSellerUrl?: string;
    rating?: number;
    soldCount?: number;
    remainTime?: string;
    sellerName?: string;
    totalRating?: number;
    loading?: boolean;
    slug?: string | null;
    sellerId?: string | null;
}

const SponsorStore: React.FC<SponsorStoreProps> = ({
    storeId,
    storeName,
    price,
    imageSellerUrl,
    imageProductUrl,
    slug,
    soldCount,
    rating,
    totalRating,
    sellerName,
    loading,
    sellerId
}) => {
    if (loading) {
        return (
            <div className="w-full lg:w-auto">
                <div className="w-full flex items-center gap-[12px] lg:pb-[25px] lg:w-[401px]">
                    <div className="relative w-[133.389px] md:w-[100px] lg:w-[133.389px] h-[104px] flex-shrink-0 rounded-[10px] bg-gray-200 animate-pulse" />
                    <div className="flex-1 min-w-0 w-auto md:w-full lg:w-auto">
                        <div className="flex flex-col h-[104px] justify-between flex-1 min-w-0">
                            <div className="flex flex-col gap-1">
                                <div className="h-[44px] bg-gray-200 animate-pulse rounded w-full" />
                                <div className="flex items-center gap-[12px] text-xs text-neutral-400">
                                    <div className="h-[14px] bg-gray-200 animate-pulse rounded w-[50px]" />
                                    <div className="h-[14px] bg-gray-200 animate-pulse rounded w-[50px]" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-[18.87px] h-[18.87px] bg-gray-200 animate-pulse rounded-full" />
                                    <div className="h-[14px] bg-gray-200 animate-pulse rounded w-[100px]" />
                                </div>
                                <div className="h-[14px] bg-gray-200 animate-pulse rounded w-[50px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link
            href={`/products/${slug}`}
            key={storeId}
            className="w-full lg:w-auto"
            onClick={() => {}}
        >
            <div className="w-full flex items-center gap-[12px] lg:pb-[25px] lg:w-[401px]">
                {/* Product Image */}
                <div className="relative w-[133.389px] md:w-[100px] lg:w-[133.389px] h-[104px] flex-shrink-0 rounded-[10px] p=[10px]">
                    <Image
                        src={imageProductUrl || '/images/facebookproduct.png'}
                        alt={storeName}
                        fill
                        className="object-cover rounded-[10px]"
                    />
                    <button className="absolute top-2 right-2 z-10 w-[16px] h-[17.155px]">
                        <Image
                            src={'/images/heart.svg'}
                            alt="Heart"
                            width={16}
                            height={17.155}
                        />
                    </button>
                    <button className="absolute inline-flex h-[31.093px] px-[10px] py-[5px] justify-center items-center gap-[10px] text-[12px] font-medium leading-[160%] text-white rounded-[7px] bg-[linear-gradient(266deg,#F1D959_-6.72%,#EAC608_89.03%)] ">
                        Sponsor
                    </button>
                </div>
                {/* Product Info */}
                <div className="flex-1 min-w-0 w-auto md:w-full lg:w-auto">
                    <div className="flex flex-col h-[104px] justify-between flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                            <span className="h-[44px] text-[14px] font-medium leading-[160%] text-[#3F3F3F]  line-clamp-2 break-words w-full cursor-pointer hover:text-[#47A8DF]">
                                {storeName}
                            </span>

                            {/* Rating & Sold Count */}
                            <div className="flex items-center gap-[12px] text-xs text-neutral-400">
                                <div className="flex items-center gap-[7px] text-[14px] font-normal leading-[160%] text-[#3F3F3F] ">
                                    <Image
                                        src={'/images/soldout-icon.svg'}
                                        alt="Soldout"
                                        width={14}
                                        height={14}
                                    />
                                    <span>Sold {soldCount}</span>
                                </div>

                                {rating && (
                                    <span className="flex items-center gap-1">
                                        <span className="text-[#F8E008] font-normal text-[14px] leading-[160%] ">
                                            ⭐ {rating?.toFixed(1) || 0}
                                        </span>
                                        <span className="text-[#6C6C6C] font-normal text-[14px] leading-[160%] ">
                                            ({totalRating})
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                                <Image
                                    src={imageSellerUrl || Avatar}
                                    alt=""
                                    width={18.87}
                                    height={18.87}
                                    className="rounded-full"
                                />
                                <span
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.location.href = `/user-details/${sellerId}`;
                                    }}
                                    className="text-[#47A8DF] font-normal text-[14px] leading-[160%] cursor-pointer hover:text-[#2d8abf]"
                                >
                                    {sellerName}
                                </span>
                            </div>
                            <span className="text-[#F15959] font-medium text-[14px] leading-[160%] ">
                                {price?.toLocaleString()} USDT
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default SponsorStore;
