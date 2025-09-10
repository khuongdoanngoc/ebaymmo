import Image from 'next/image';
import Button from '../BaseUI/Button/button';
import Link from 'next/link';

interface Store {
    avatar?: string;
    averageRating?: number;
    category?: {
        type?: string;
    };
    ratingTotal?: number;
    slug?: string;
    storeId?: string;
    storeName?: string;
    storePrice?: string;
    totalSoldCount?: number;
    totalStockCount?: number;
    storeTag?: string;
    subTitle?: string;
}

interface FavouriteStoreContentProps {
    store: Store;
}
export default function FavouriteStoreContent({
    store
}: FavouriteStoreContentProps) {
    // Kiểm tra điều kiện disable
    const isBuyDisabled =
        (typeof store.totalStockCount === 'number' &&
            store.totalStockCount <= 0) ||
        (typeof store.storePrice === 'string' &&
            parseFloat(store.storePrice) <= 0);

    return (
        <div className="content-favourite flex flex-col gap-[20px] w-full ">
            <div className="flex flex-col items-start gap-[8px] ">
                <div className="product-star flex items-start">
                    <div className="text-[#F8E008] flex items-center">
                        <Image
                            src="/images/star.svg"
                            alt="Rating star"
                            width={16}
                            height={16}
                        />
                        <span>{store.averageRating?.toFixed(1)}</span>
                        <span className="ml-1 text-[#6c6c6c]">
                            ({store.ratingTotal})
                        </span>
                    </div>
                </div>
                <Link
                    className="flex flex-col items-start self-stretch gap-[10px]"
                    href={`/products/${store.slug}`}
                >
                    <div className="product-title flex flex-col  w-full">
                        <p className="text-[#3F3F3F] text-[18px] font-medium leading-[28.8px]">
                            {store.storeName}
                        </p>
                    </div>

                    <div className="product-desc w-full">
                        <p className="text-[#3F3F3F] text-[14px] font-normal leading-[22.4px]">
                            {store.subTitle}
                        </p>
                    </div>
                </Link>
            </div>

            <div className="product-detail flex flex-col items-start gap-[15px] ">
                <div className="flex lg:flex-row flex-col sm:gap-[10px] w-full justify-between lg:items-end md:items-end sm:items-start self-stretch">
                    <div className="flex flex-col items-start gap-[8px]">
                        <div className="flex items-start gap-[24px]">
                            <div className="flex items-start gap-[10px] min-w-[120px]">
                                <Image
                                    src="/images/warehouse.svg"
                                    alt="Warehouse"
                                    width={20}
                                    height={20}
                                />
                                <span className="text-[#1C1C1C] text-[14px] font-normal leading-[22.4px]">
                                    Warehouse
                                </span>
                            </div>
                            <span className="text-[#6c6c6c] text-[14px] font-normal leading-[22.4px]">
                                {store.totalStockCount}
                            </span>
                        </div>

                        <div className="flex items-start gap-[24px]">
                            <div className="flex items-start gap-[10px] min-w-[120px] ">
                                <Image
                                    src="/images/sold.svg"
                                    alt="Sold"
                                    width={20}
                                    height={20}
                                />
                                <span className="text-[#1C1C1C] text-[14px] font-normal leading-[22.4px]">
                                    Sold
                                </span>
                            </div>
                            <span className="text-[#6c6c6c] text-[14px] font-normal leading-[22.4px]">
                                {store.totalSoldCount}
                            </span>
                        </div>

                        <div className="flex items-start gap-[24px]">
                            <div className="flex items-start gap-[10px] min-w-[120px]">
                                <Image
                                    src="/images/product.svg"
                                    alt="Product"
                                    width={20}
                                    height={20}
                                />
                                <span className="text-[#1C1C1C] text-[14px] font-normal leading-[22.4px]">
                                    {store.category?.type}
                                </span>
                            </div>
                            <Link
                                href={`/products?type=${store.category?.type}`}
                                className="text-[#33a959] text-[14px] font-normal truncate w-[80px] lg:w-full  leading-[22.4px]"
                            >
                                {store.category?.type}
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-row mt-[10px] justify-between  md:flex-col lg:flex-col items-center gap-[7px]">
                        <p className="product-price text-[#F15959] font-bold text-[14px] leading-[160%]">
                            {store.storePrice} USDT
                        </p>
                        <Link className="" href={`/products/${store.slug}`}>
                            <Button disabled={isBuyDisabled}>Buy</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
