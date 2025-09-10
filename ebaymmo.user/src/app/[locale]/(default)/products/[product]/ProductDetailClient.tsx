'use client';

import Breadcrumb from '../../_components/Breadcrumb';
import Image from 'next/image';
import ProductStore from '@/components/ProductStore';
import ProductStoreTitle from '@/components/ProductStore/ProductStoreTitle';
import RelatedProducts from '@/components/RelatedProduct/RelatedProduct';
import StoreDetailTab from '@/components/ProductStore/StoreDetailTab';
import { convertToSlug } from '@/utils/convertToSlug';
import ImageDefault from '@images/telegram-green.svg';

interface ProductDetailClientProps {
    store: any; // Replace with proper type from your GraphQL schema
}

export default function ProductDetailClient({
    store
}: ProductDetailClientProps) {
    const storeData = {
        id: store?.storeId,
        sellerId: store?.sellerId,
        name: store?.storeName || '',
        imageStoreUrl: store?.avatar || '',
        imageSellerUrl: store?.sellerAvatar || '',
        rating: store?.averageRating || 0,
        subTitle: store?.subTitle,
        sellerName: store?.sellerUsername,
        totalRate: store?.ratingTotal || 0,
        tag: store?.categoryName || '',
        description: store?.description || '',
        type: store?.categoryType || '',
        categoryName: store?.categoryName || '',
        categorySlug: store?.slug || '',
        categoryId: store?.categoryId || '',
        allowPreOrder: store?.allowPreOrder || false
    };

    const productsData = store?.products || [];
    const sellerId = store?.sellerId;

    return (
        <section className="relative">
            <div className="mt-[70px]">
                <div className="w-full max-w-[1420px] m-auto px-4 md:px-6 lg:px-8">
                    <Breadcrumb
                        forUrl="products"
                        type={
                            storeData.type.charAt(0).toUpperCase() +
                            storeData.type.slice(1)
                        }
                        category={{
                            categoryName: storeData.categoryName,
                            categorySlug: convertToSlug(storeData.categoryName)
                        }}
                        store=""
                    />
                    <div className="mt-[54px] flex flex-col lg:flex-row gap-[30px] justify-between relative">
                        {/* Product Image Section */}
                        <div className="w-full lg:max-w-[600px] relative">
                            <div className="sticky top-0">
                                <Image
                                    src={
                                        storeData.imageStoreUrl ||
                                        ImageDefault.src
                                    }
                                    alt="imageStore"
                                    className="rounded-[30px] aspect-[60/43] object-cover w-full h-auto"
                                    width={600}
                                    height={430}
                                />
                                <span className="absolute top-0 left-0 min-w-[141px] p-[10px_15px] flex items-center justify-center bg-sub-gradio rounded-[7px] text-neutral-50 text-[18px] font-[500] line-height-[160%]">
                                    Not Duplicate
                                </span>
                            </div>
                        </div>
                        {/* Product Info Section */}
                        <div className="w-full lg:max-w-[700px] flex flex-col gap-[35px]">
                            <ProductStoreTitle
                                title={storeData.name}
                                subTitle={storeData.subTitle}
                                rating={storeData.rating}
                                totalRate={storeData.totalRate}
                            />
                            <hr className="w-full min-h-[1px] h-[1px] bg-neutral-100 border-none" />
                            <ProductStore
                                products={
                                    productsData?.map(
                                        (p: {
                                            productId: string;
                                            productName: string | null;
                                            price: number | null;
                                            stockCount: number | null;
                                            soldCount: number | null;
                                        }) => ({
                                            productId: p.productId,
                                            productName: p.productName || '',
                                            price: p.price || 0,
                                            stockCount: p.stockCount || 0,
                                            soldCount: p.soldCount || 0,
                                            imageUrl:
                                                storeData.imageStoreUrl || ' '
                                        })
                                    ) || []
                                }
                                storeId={storeData.id}
                                tag={storeData.tag}
                                sellerId={storeData.sellerId}
                                storeName={storeData.name}
                                isService={storeData.type === 'service'}
                                allowPreOrder={storeData.allowPreOrder}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Store Details Tab */}
            <div className="mt-[100px]">
                <div className="w-full max-w-[1420px] m-auto px-4 md:px-6 lg:px-8">
                    <StoreDetailTab
                        description={storeData.description}
                        storeId={storeData?.id}
                        slug={store?.slug}
                        sellerId={sellerId}
                        averageRating={storeData.rating}
                        totalRate={storeData.totalRate}
                    />
                </div>
            </div>

            {/* Related Products Section */}
            <div className="mt-[100px] mb-[100px]">
                <div className="w-full max-w-[1420px] m-auto px-4 md:px-6 lg:px-8">
                    <h2 className="text-neutral-400 text-[24px] md:text-[30px] font-[700] uppercase">
                        RELATED PRODUCTS
                    </h2>
                    <RelatedProducts
                        categoryId={storeData.categoryId}
                        storeId={storeData.id}
                    />
                </div>
            </div>
        </section>
    );
}
