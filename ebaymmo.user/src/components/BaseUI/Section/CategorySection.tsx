'use client';

import React, { useMemo } from 'react';
import CategoryList from '@/components/Category/CategoryList';
import SponsorStore from '@/components/SponsorStoreItem/SponsorStoreItem';
import { useDispatch } from 'react-redux';
import {
    Categories,
    useGetCategoriesQuery,
    useGetStoreViewQuery,
    useGetWinnerStoresSubscription
} from '@/generated/graphql';
import ServiceCategoryItem from '@/components/ServiceItem/ServiceItem';
import { CategoryType } from '@/constants/enum';
import { useTranslations } from 'next-intl';

interface ProductSectionProps {
    className?: string;
}

const ProductSection: React.FC<ProductSectionProps> = ({ className }) => {
    const t = useTranslations('categorysection');
    const dispatch = useDispatch();

    // Fetch data
    const {
        data: storeData,
        loading: storeLoading,
        error: storeError
    } = useGetStoreViewQuery({
        variables: {
            where: {
                status: { _eq: 'active' }
            },
            limit: 5
        }
    });

    const { data: categoryData, loading: categoryLoading } =
        useGetCategoriesQuery({
            variables: {
                where: {
                    parentCategoryId: {
                        _isNull: true
                    }
                }
            },
            fetchPolicy: 'cache-first'
        });

    const { data: winnerStoresData, loading: winnerStoresLoading } =
        useGetWinnerStoresSubscription();
    //console.log('Winner Stores', winnerStoresData);
    // Ensure default values
    const stores = useMemo(() => storeData?.listingStores ?? [], [storeData]);

    const serviceCategories = useMemo(
        () =>
            (categoryData?.categories?.filter(
                (category) => category.type === CategoryType.Service
            ) as Categories[]) ?? [],
        [categoryData]
    );
    const productCategories = useMemo(
        () =>
            (categoryData?.categories?.filter(
                (category) => category.type === CategoryType.Product
            ) as Categories[]) ?? [],
        [categoryData]
    );

    //console.log('store data', storeData);
    // Lấy danh sách stores đã được sắp xếp theo winner_stores
    const sortedStores = useMemo(() => {
        const normalStores = [...(storeData?.listingStores || [])];
        //console.log('normal stores', normalStores);
        const positionStores = winnerStoresData?.winnerStores || [];
        //console.log('position stores', positionStores);

        // Lọc các vị trí có winner_stores
        const winnerStores = positionStores
            .filter((pos: any) => pos.winnerStores && pos.storeId)
            .map((pos: any) => {
                // Tạo đối tượng store từ dữ liệu winner store
                return {
                    storeId: pos.storeId,
                    storeName: pos.storeName,
                    avatar: pos.avatar,
                    slug: pos.slug,
                    storePrice: pos.storePrice,
                    description: pos.description,
                    averageRating: pos.averageRating,
                    ratingTotal: pos.ratingTotal,
                    totalSoldCount: pos.totalSoldCount,
                    totalStockCount: pos.totalStockCount,
                    storeTag: pos.storeTag,
                    subTitle: pos.subTitle,
                    lowestPrice: pos.lowestPrice,
                    storedPrice: pos.storedPrice,
                    categoryId: pos.categoryId,
                    subCategoryIds: pos.subCategoryIds,
                    sellerId: pos.sellerId,
                    sellerName: pos.sellerName,
                    sellerAvatar: pos.sellerAvatar
                };
            })
            .filter(Boolean);

        //console.log('winner store', winnerStores);

        // Lọc các store không phải winner
        const remainingStores = normalStores.filter(
            (store) =>
                !positionStores.some(
                    (pos: any) => pos.storeId === store.storeId
                )
        );

        // Kết hợp winners và remaining stores
        return [...winnerStores, ...remainingStores].slice(0, 5);
    }, [storeData?.listingStores, winnerStoresData?.winnerStores]);

    //console.log('store finall', sortedStores);
    return (
        <section className={className}>
            <div className="container w-full max-w-[1420px] mx-auto">
                <div className="content-wrap flex flex-wrap gap-[79px]">
                    <div className="item inline-flex flex-col items-start gap-y-[40px] lg:w-[940px] w-full">
                        <h1 className="text-[#3F3F3F] text-center font-bold text-[30px] leading-[42px] uppercase">
                            {t('category')}
                        </h1>
                        <CategoryList
                            categories={productCategories.filter(
                                (category) =>
                                    category.type === CategoryType.Product ||
                                    CategoryType.product
                            )}
                            loading={categoryLoading}
                        />
                    </div>

                    {/* Store List */}
                    <div className="item flex flex-col gap-y-[40px]">
                        <h2 className="text-title-small text-uppercase text-neutral-400 text-[24px] font-semibold">
                            {t('store')}
                        </h2>
                        {storeLoading
                            ? Array.from({ length: 4 }).map((_, index) => (
                                  <SponsorStore
                                      key={index}
                                      loading={true}
                                      storeId={''}
                                      storeName={''}
                                      price={0}
                                  />
                              ))
                            : sortedStores.map((store, index) => (
                                  <SponsorStore
                                      key={
                                          store?.storeId
                                              ? `${store.storeId}-${index}`
                                              : `no-store-id-${index}`
                                      }
                                      loading={false}
                                      storeId={store?.storeId ?? ''}
                                      price={store?.lowestPrice ?? 0}
                                      storeName={
                                          store?.storeName ?? 'No store name'
                                      }
                                      sellerId={store?.sellerId ?? ''}
                                      slug={store?.slug ?? ''}
                                      imageProductUrl={
                                          store?.avatar ??
                                          '/images/facebookproduct.png'
                                      }
                                      imageSellerUrl={
                                          store?.sellerAvatar ??
                                          '/images/avatar.svg'
                                      }
                                      rating={store?.averageRating ?? 0}
                                      totalRating={store?.ratingTotal ?? 0}
                                      //soldCount={store?.totalSoldCount ?? (store?.sold ?? 0)}
                                      remainTime={'N/A'}
                                      sellerName={
                                          store?.sellerName ?? 'No name'
                                      }
                                  />
                              ))}
                    </div>
                </div>

                {/* Service List */}
                <div className="content-wrap-2 mt-[60px]">
                    <h2 className="text-title-small text-uppercase text-neutral-400 text-[24px] font-semibold">
                        {t('service')}
                    </h2>
                    <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[20px]">
                        {categoryLoading
                            ? // Render skeletons when loading
                              Array.from({ length: 4 }).map((_, index) => (
                                  <ServiceCategoryItem
                                      key={index}
                                      service={{
                                          productId: '',
                                          productImage: '',
                                          productName: '',
                                          quantity: 0,
                                          status: 'active',
                                          description: '',
                                          slug: ''
                                      }}
                                      isLoading={true}
                                  />
                              ))
                            : serviceCategories.map((category) => (
                                  <ServiceCategoryItem
                                      key={category.categoryId}
                                      service={{
                                          ...category,
                                          productId: category.categoryId,
                                          productImage:
                                              category.imagesUrl ?? '',
                                          isService:
                                              category.type === 'service',
                                          productName:
                                              category.categoryName ?? '',
                                          quantity: 0,
                                          status: 'active',
                                          description:
                                              category.description ?? '',
                                          slug: category.slug ?? ''
                                      }}
                                      isLoading={false}
                                  />
                              ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductSection;
