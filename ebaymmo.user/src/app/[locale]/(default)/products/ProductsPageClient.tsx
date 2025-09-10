'use client'; // Nếu dùng Next.js 13+ với App Router

import Breadcrumb from '../_components/Breadcrumb';
import { Suspense, useState, useMemo } from 'react';
import Pagination from '@/components/BaseUI/Pagination';
import { sortStores } from './_utils/sortStores';
import { AdvertisementSection } from './_components/AdvertisementSection';
import { filterCategories } from './_utils/filterCategories';
import { useProductsData } from './_hooks/useProductsData';
import { useCategoriesData } from './_hooks/useCategoryData';
import FilterSection from './_components/FilterSection';
import Sorter from './_components/Sorter';
import ProductGrid from './_components/ProductGrid';
import ErrorState from './_components/ErrorState';
import { useTranslations } from 'next-intl';

function Products() {
    const t = useTranslations('product');
    // hooks use query
    const {
        storesData,
        storesLoading,
        storesError,
        filters,
        setFilters,
        updateFilter,
        page,
        setPage,
        limit,
        totalCount
    } = useProductsData();
    const { categoryData, categoryError } = useCategoriesData();

    // option state filter
    const [selectedOption, setSelectedOption] = useState('Sort');

    // sort stores
    const sortedStores = useMemo(() => {
        const stores = storesData?.listingStores || [];
        // Make sure we preserve the isSponsor property when sorting
        return sortStores(stores, selectedOption);
    }, [storesData?.listingStores, selectedOption]);

    // filter categories
    const categoryFiltered = useMemo(
        () => filterCategories(categoryData?.categories || [], filters),
        [categoryData?.categories, filters]
    );

    // Early returns for loading and error states
    if (storesError) {
        return <ErrorState message={storesError.message} />;
    }
    if (categoryError) {
        return <ErrorState message={categoryError.message} />;
    }

    return (
        <section className="w-full flex flex-col items-center">
            <div className="w-full max-w-[1800px] py-[50px] px-6 lg:px-32 2xl:px-36 flex flex-col justify-center">
                <Breadcrumb
                    forUrl="products"
                    type={
                        filters.type.charAt(0).toUpperCase() +
                        filters.type.slice(1)
                    }
                    category={{
                        categoryName:
                            categoryFiltered?.find(
                                (categoryItem) =>
                                    categoryItem.slug == filters.category
                            )?.categoryName || '',
                        categorySlug: filters.category
                    }}
                />
                <div className="mt-[22px] flex items-center">
                    <span className="text-[30px] font-bold leading-[40px]">
                        {t('details.productList')}
                    </span>
                </div>
                <div className="mt-[40px] flex flex-col lg:flex-row">
                    <FilterSection
                        filters={filters}
                        setFilters={setFilters}
                        updateFilter={updateFilter}
                        categoryFiltered={categoryFiltered}
                        setPage={setPage}
                        categoryData={categoryData}
                    />
                    <div className="w-full lg:w-[80%]">
                        <Sorter
                            selectedOption={selectedOption}
                            setSelectedOption={setSelectedOption}
                            updateFilter={updateFilter}
                        />

                        <div className="right-wrapper flex-1">
                            <ProductGrid
                                storesLoading={storesLoading}
                                sortedStores={sortedStores}
                            />
                            {totalCount > 0 && (
                                <Pagination
                                    page={page}
                                    setPage={setPage}
                                    limit={limit}
                                    total={totalCount}
                                />
                            )}
                            {/* Advertisement Section */}
                            <AdvertisementSection />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function ProductsPageClient() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Products />
        </Suspense>
    );
}
