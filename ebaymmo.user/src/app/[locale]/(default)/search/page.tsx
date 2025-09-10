'use client';

import Breadcrumb from '../_components/Breadcrumb';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Pagination from '@/components/BaseUI/Pagination';
import { useSearchStoreData } from '../products/_hooks/useSearchStoreData';
import { AdvertisementSection } from '../products/_components/AdvertisementSection';
import ProductGrid from '../products/_components/ProductGrid';
import Sorter from '../products/_components/Sorter';
import { sortStores } from '../products/_utils/sortStores';
import FilterSectionSearch from '../products/_components/FilterSectionSearch';

function SearchComponent() {
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    const searchQuery = searchParams.get('query') || '';
    const subCategory = searchParams.get('subCategory');

    const {
        storesData,
        storesLoading,
        page,
        setPage,
        limit,
        filters,
        updateFilter,
        setFilters
    } = useSearchStoreData('/search');

    // Đặt tất cả useState hooks ở đầu component
    const [activeTab, setActiveTab] = useState(searchParams.get('type'));
    const [selectedOption, setSelectedOption] = useState('Sort');

    const sortedStores = useMemo(
        () => sortStores(storesData?.results || [], selectedOption),
        [storesData?.results, selectedOption]
    );

    const totalStores = useMemo(
        () => storesData?.pagination?.total || 0,
        [storesData?.pagination?.total]
    );

    // lắng nghe sự thay đổi của params để thay đổi hiện thị checkbox
    useEffect(() => {
        const type = searchParams.get('type');
        if (filters.type !== type && type !== null) {
            setActiveTab(type);
            updateFilter('type', type || activeTab || '');
        }

        // Cập nhật filters khi search params thay đổi
        setFilters((prevFilters) => ({
            ...prevFilters,
            category,
            subCategory: subCategory ? subCategory.split(',') : [],
            query: searchQuery
        }));

        if (filters.category !== category) {
            setSelectedOption('Sort');
        }

        setActiveTab(filters.type || type || '');
    }, [
        searchQuery,
        category,
        subCategory,
        filters.type,
        filters.category,
        searchParams,
        activeTab
    ]);

    return (
        <section className="w-full flex flex-col items-center">
            <div className="w-full max-w-[1800px] py-[50px] px-6 lg:px-32 2xl:px-36 flex flex-col justify-center">
                <Breadcrumb
                    forUrl="search"
                    type={`Search : ${searchParams.get('query')}`}
                />
                <div className="mt-[10px] flex items-center">
                    <span className="text-[30px] font-bold leading-[40px]">
                        SEARCH
                    </span>
                </div>

                <div className="flex flex-col lg:flex-row">
                    <FilterSectionSearch
                        filters={filters}
                        setFilters={setFilters}
                        updateFilter={updateFilter}
                        subCategoryData={storesData?.subCategories}
                        setPage={setPage}
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
                            {totalStores !== 0 && (
                                <Pagination
                                    page={page}
                                    setPage={setPage}
                                    limit={limit}
                                    total={totalStores}
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

export default function Search() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchComponent />
        </Suspense>
    );
}
