'use client';

import Breadcrumb from '../_components/Breadcrumb';
import { Suspense, useState, useMemo } from 'react';
import Pagination from '@/components/BaseUI/Pagination';
import { useCategoriesData } from '../products/_hooks/useCategoryData';
import { sortStores } from '../products/_utils/sortStores';
import { filterCategories } from '../products/_utils/filterCategories';
import ErrorState from '../products/_components/ErrorState';
import FilterSection from '../products/_components/FilterSection';
import Sorter from '../products/_components/Sorter';
import ProductGrid from '../products/_components/ProductGrid';
import { AdvertisementSection } from '../products/_components/AdvertisementSection';
import { useFavoriteStoreData } from '../products/_hooks/useFavoriteStoreData';

function FavoriteStores() {
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
        limit
    } = useFavoriteStoreData();
    const { categoryData, categoryError } = useCategoriesData();

    const [selectedOption, setSelectedOption] = useState('Filter');

    const sortedStores = useMemo(
        () => sortStores(storesData?.stores || [], selectedOption),
        [storesData?.stores, selectedOption]
    );

    const totalStores = useMemo(
        () => storesData?.storesAggregate?.aggregate?.count || 0,
        [storesData?.storesAggregate?.aggregate?.count]
    );

    const categoryFiltered = useMemo(
        () => filterCategories(categoryData?.categories || [], filters),
        [categoryData?.categories, filters]
    );

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
                        Product List
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
                                favorite
                            />
                            {totalStores !== 0 && (
                                <Pagination
                                    page={page}
                                    setPage={setPage}
                                    limit={limit}
                                    total={totalStores}
                                />
                            )}
                            <AdvertisementSection />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function FavoriteStoresPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FavoriteStores />
        </Suspense>
    );
}
