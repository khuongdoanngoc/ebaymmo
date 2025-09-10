import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
//import { FaHeart } from 'react-icons/fa';

interface StoreItemProps {
    title: string;
    price: string;
    rating?: number;
    reviews?: number;
    warehouse?: number;
    sold?: number;
    image?: string;
    category?: string;
    subCategory?: string;
    slug: string;
}

const StoreItem: React.FC<StoreItemProps> = ({
    title = 'New Gmail USA, high-quality. Registered on iOS and aged for 15 days, New Gmail USA, high-quality. Registered on iOS and aged for 15 days',
    price = '0.26$',
    rating = 4.5,
    reviews = 2,
    warehouse = 0,
    sold = 2,
    category,
    subCategory,
    image = '/images/gmail-logo.png',
    slug
}) => {
    const router = useRouter();
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setIsLiked(!isLiked);
    };

    return (
        <div className="flex gap-6 mb-8 border-b border-gray-200 pb-8">
            <div className="flex md:flex-row gap-4 md:w-full">
                {/* Product Image */}
                <div
                    className="relative w-[155px] h-[155px] bg-pink-100 rounded-lg overflow-hidden md:w-[250px] md:h-[250px] top-[15%] md:top-0 cursor-pointer"
                    onClick={() => router.push(`/products/${slug}`)}
                >
                    <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded md:text-sm z-20 text-[12px]">
                        No duplicates
                    </span>
                    <button
                        className="absolute top-2 right-2 bg-white/10 p-2 rounded-full z-20"
                        onClick={() => handleLike()}
                    >
                        <Image
                            src={
                                isLiked
                                    ? '/images/heart-checked.svg'
                                    : '/images/heart.svg'
                            }
                            alt="Like"
                            width={30}
                            height={30}
                        />
                    </button>
                    <div className="relative w-full h-full transition-transform duration-300 hover:scale-110">
                        <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Product Details */}
                <div className="flex-1 md:w-full">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-[#00A650] text-white px-3 py-1 rounded">
                            Product
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-[#F8E008]">★</span>
                            <span>{rating}</span>
                            <span className="text-gray-500">({reviews})</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h3
                        className="text-xl font-medium mb-4 line-clamp-2 cursor-pointer hover:text-[#00A650] transition-colors"
                        onClick={() => router.push(`/products/${slug}`)}
                    >
                        {title}
                    </h3>

                    {/* Product Info - Vertical Layout */}
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-center">
                            <span className="text-gray-500 w-[120px] flex items-center gap-2">
                                <Image
                                    src="/images/warehouse.svg"
                                    alt="Warehouse"
                                    width={16}
                                    height={16}
                                />
                                Warehouse:
                            </span>
                            <span className="ml-4">{warehouse}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-500 w-[120px] flex items-center gap-2">
                                <Image
                                    src="/images/sold.svg"
                                    alt="Sold"
                                    width={16}
                                    height={16}
                                />
                                Sold:
                            </span>
                            <span className="ml-4">{sold}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-500 w-[120px] flex items-center gap-2">
                                <Image
                                    src="/images/product.svg"
                                    alt="Product"
                                    width={16}
                                    height={16}
                                />
                                Product:
                            </span>
                            <a
                                className="ml-4 text-[#00A650] cursor-pointer"
                                href={`/products?type=${
                                    ['increase', 'service', 'blockchain'].some(
                                        (keyword) => category?.includes(keyword)
                                    )
                                        ? 'service'
                                        : 'product'
                                }&category=${category}&subCategory=${subCategory}`}
                            >
                                {subCategory ? subCategory : category}
                            </a>
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="flex flex-col md:flex-row items-start md:items-center md:w-full justify-between">
                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" />
                        <div className="flex md:items-center items-start gap-4 md:flex-row flex-col">
                            <div className="flex flex-row gap-[20px] justify-center items-center">
                                {/* Dieu kien dung o day la neu store khong co product thi moi khong cho hien nut BUYNOW */}
                                {parseFloat(price) !== 0 && (
                                    <div className="flex flex-row items-center gap-[20px] justify-center">
                                        <div className="text-2xl font-bold text-[red]">
                                            {price} USDT
                                        </div>
                                        <button
                                            className="bg-[#00A650] text-white px-6 py-2 rounded-lg hover:bg-[#008c44] transition-colors"
                                            onClick={() =>
                                                router.push(`/products/${slug}`)
                                            }
                                        >
                                            Buy now
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreItem;
