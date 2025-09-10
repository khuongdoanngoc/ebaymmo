'use client';
import React from 'react';
import RelatedProductItem from './RelatedProductItem';
import { useGetRelatedStoresQuery } from '@/generated/graphql';

interface RelatedProductsProps {
    categoryId?: string;
    storeId?: string;
}

const RelatedProductSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((item) => (
                <div
                    key={item}
                    className="flex flex-col gap-4 p-4 border border-neutral-100 rounded-2xl"
                >
                    {/* Image skeleton */}
                    <div className="rounded-xl aspect-[270/200] w-full bg-gray-200 animate-pulse" />

                    {/* Title and rating skeleton */}
                    <div className="space-y-2">
                        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>

                    {/* Price skeleton */}
                    <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />

                    {/* Seller info skeleton */}
                    <div className="flex items-center gap-2 mt-auto">
                        <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function RelatedProducts({
    categoryId,
    storeId
}: RelatedProductsProps) {
    const { data, loading, error } = useGetRelatedStoresQuery({
        variables: {
            where: {
                status: {
                    _eq: 'active'
                },
                categoryId: {
                    _eq: categoryId
                },
                storeId: {
                    _neq: storeId
                }
            },
            limit: 4,
            offset: 0
        }
    });

    if (loading) return <RelatedProductSkeleton />;
    if (error) return <div>Error: {error.message}</div>;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {data?.relatedStores?.map((store) => (
                <RelatedProductItem
                    key={store.storeId}
                    id={store.storeId}
                    title={store.storeName || ''}
                    imageProductUrl={store.avatar || ''}
                    rating={store.averageRating || 0}
                    ratingTotal={store.totalRating || 0}
                    ProductCategory={store.categoryId?.categoryName || 'Email'}
                    price={store.lowestPrice || 0}
                    sellerName={store.sellerName || 'Unknown Seller'}
                    sellerAvatar={store.sellerAvatar || ''}
                    stockCount={store.stockCount || 0}
                    soldCount={store.sold || 0}
                    isService={true}
                    storeTag={store.duplicateStatus || ''}
                    slug={store.slug || `service-${store.storeId}`}
                    subTitle={store.shortDescription || ''}
                    sellerId={store.sellerId}
                />
            ))}
        </div>
    );
}
