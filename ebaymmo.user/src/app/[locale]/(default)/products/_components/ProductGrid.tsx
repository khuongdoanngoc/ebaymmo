import ProductSkeleton from './ProductSkeleton';
import ProductCard from './ProductCard';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/BaseUI/Button';

interface ProductGridProps {
    storesLoading: boolean;
    sortedStores: {
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
        isSponsor?: boolean;
        [key: string]: any;
    }[];
    favorite?: boolean;
}

export default function ProductGrid({
    storesLoading,
    sortedStores,
    favorite
}: ProductGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[22px] mb-[40px]">
            {storesLoading ? (
                // Display 6 placeholder items while loading
                Array.from({ length: 6 }).map((_, index) => (
                    <ProductSkeleton key={index} />
                ))
            ) : sortedStores.length === 0 && favorite ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-16 px-4 bg-gray-100 rounded-[20px]">
                    <Image
                        src="/images/heart-icon2.svg"
                        alt="No favorites"
                        width={80}
                        height={80}
                        className="mb-6 opacity-70"
                    />
                    <h3 className="text-[22px] font-medium text-neutral-500 mb-3">
                        No favorite stores yet
                    </h3>
                    <p className="text-[16px] text-neutral-400 text-center max-w-md mb-8">
                        You haven't added any stores to your favorites list.
                        Browse products and click the heart icon to add items
                        you love!
                    </p>
                    <Link href="/products">
                        <Button
                            width="180px"
                            className="text-[16px] font-normal"
                        >
                            Explore Stores
                        </Button>
                    </Link>
                </div>
            ) : sortedStores.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-10">
                    <p className="text-lg text-gray-600 mb-4">
                        No stores found
                    </p>
                </div>
            ) : (
                // Stores Grid
                sortedStores.map((product, index) => (
                    <ProductCard key={index} product={product} />
                ))
            )}
        </div>
    );
}
