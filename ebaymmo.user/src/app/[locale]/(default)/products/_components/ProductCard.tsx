import Image from 'next/image';
import Link from 'next/link';
import Telegram from '@images/product.png';
import Avatar from '@images/avatar.svg';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/contexts/WishlistContext';
import Button from '@/components/BaseUI/Button/button';

interface ProductCardProps {
    product: {
        storeId: string;
        slug: string;
        avatar: string;
        storeTag?: string;
        averageRating?: number;
        ratingTotal?: number;
        storeName: string;
        subTitle?: string;
        stock?: number;
        sold?: number;
        categorySlug?: string;
        categoryName?: string;
        subCategorySlug?: string;
        subCategoryName?: string;
        sellerAvatar?: string;
        sellerName?: string;
        lowestPrice: number;
        [key: string]: any;
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const router = useRouter();
    const { isWishlisted, handleToggleWishlist } = useWishlist();

    return (
        <div className="card flex flex-col bg-gray-100 rounded-[20px]">
            <div className="px-[20px] pt-[20px]">
                <div className="relative aspect-[299/217]">
                    <Link href={`/products/${product.slug}`}>
                        <Image
                            src={product.avatar || Telegram}
                            alt="product-list-1"
                            className="rounded-[10px] w-full h-full object-cover transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            width={299}
                            height={217}
                        />
                    </Link>
                    <div className="absolute top-0 left-0 flex">
                        {product.isSponsor && (
                            <div className="text-white px-3 py-1 rounded-[4px] mr-2 text-sm bg-[linear-gradient(266deg,#F1D959_-6.72%,#EAC608_89.03%)]">
                                Sponsor
                            </div>
                        )}
                        {product.storeTag && (
                            <span className="bg-sub-gradio text-white px-3 py-1 rounded-[4px] text-sm">
                                {product?.storeTag}
                            </span>
                        )}
                    </div>

                    {isWishlisted(product.storeId) ? (
                        <button className="absolute top-[20px] right-[20px]">
                            <Image
                                src="/images/heart-checked.svg"
                                alt="favorite"
                                width={30}
                                height={30}
                                onClick={() =>
                                    handleToggleWishlist(product.storeId)
                                }
                            />
                        </button>
                    ) : (
                        <button className="absolute top-[20px] right-[20px]">
                            <Image
                                src="/images/heart.2.png"
                                alt="favorite"
                                width={30}
                                height={30}
                                onClick={() =>
                                    handleToggleWishlist(product.storeId)
                                }
                            />
                        </button>
                    )}
                </div>
            </div>
            <div className="px-[20px] pt-[25px] pb-[20px]">
                <div className="des flex flex-col gap-[10px]">
                    <div className="rate flex items-center">
                        <Image
                            src="/images/star.svg"
                            alt="star"
                            width={15.91}
                            height={15.91}
                        />
                        <span className="text-[14px] font-medium leading-[24px] text-[#F8E008]">
                            {product.averageRating?.toFixed(1) || 'No reviews'}
                        </span>
                        <span className="text-[14px] font-medium leading-[24px] ml-[3px] text-neutral-300">
                            ({product.ratingTotal ?? 0})
                        </span>
                    </div>
                    <div className="min-h-[87px]">
                        <span className="title text-[18px] font-medium leading-[28.8px] text-neutral-500 line-clamp-2 block min-h-[57.6px]">
                            {product.storeName || 'No title'}
                        </span>
                        <span className="sub-title text-[14px] font-medium leading-[22.4px] !line-clamp-2 text-neutral-400 block !min-h-[50px]">
                            {product.shortDescription || 'No subtitle'}
                        </span>
                    </div>
                    <div className="statistic flex">
                        <div className="stock flex flex-col gap-[8px]">
                            <div className="warehouse flex">
                                <div className="icon flex items-center">
                                    <div className="warehouse-icon mr-[10px]">
                                        <Image
                                            src="/images/warehouse.png"
                                            alt="warehouse"
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                    <span className="text-[14px] font-medium leading-[22.4px] text-neutral-400">
                                        Stock
                                    </span>
                                </div>
                            </div>
                            <div className="sold flex">
                                <div className="icon flex items-center">
                                    <div className="sold-icon mr-[10px]">
                                        <Image
                                            src="/images/sold.png"
                                            alt="sold"
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                    <span className="text-[14px] font-medium leading-[22.4px] text-neutral-400">
                                        Sold
                                    </span>
                                </div>
                            </div>
                            <div className="product flex">
                                <div className="icon flex items-center">
                                    <div className="product-icon mr-[10px]">
                                        <Image
                                            src="/images/producttag.png"
                                            alt="product"
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                    <span className="text-[14px] font-medium leading-[22.4px] text-neutral-400">
                                        Product
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="quantity flex flex-col gap-[8px] ml-auto">
                            <span className="text-[14px] font-normal leading-[22.4px] text-neutral-300">
                                {product.stock ?? 0}
                            </span>
                            <span className="text-[14px] font-normal leading-[22.4px] text-neutral-300">
                                {/* {product?.productsAggregate?.aggregate?.sum?.soldCount ?? 0} */}
                                {product.sold ?? 0}
                            </span>
                            <span className="text-[14px] font-normal leading-[22.4px] text-primary-500">
                                {product?.subCategoryName
                                    ? product?.subCategoryName
                                    : product?.categoryName}
                            </span>
                        </div>
                    </div>
                    <div
                        className="seller mt-[15px] mb-[20px] flex items-center cursor-pointer h-[36px]"
                        onClick={() =>
                            router.push(`/chatbox?chatto=${product.sellerName}`)
                        }
                    >
                        <div className="avatar mr-[5px]">
                            <Image
                                src={product.sellerAvatar || Avatar}
                                alt="avatar"
                                width={30}
                                height={30}
                            />
                        </div>
                        <div className="user-name mr-[8px]">
                            <span className="text-[#47A8DF] text-[14px] font-normal leading-[22.4px]">
                                {product?.sellerName}
                            </span>
                        </div>
                        <div className="tele">
                            <Image
                                src="/images/telegram-primary.svg"
                                alt="telegram"
                                width={20}
                                height={20}
                            />
                        </div>
                    </div>
                    <div className="action flex items-center justify-between">
                        <Button
                            width="120px"
                            onClick={() =>
                                router.push(`/products/${product?.slug}`)
                            }
                            className="text-[14px] font-normal leading-[22.4px]"
                        >
                            Buy Now
                        </Button>
                        <span className="text-[18px] font-bold leading-[28.8px] text-secondary-500">
                            {product.lowestPrice || 0} USDT
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
