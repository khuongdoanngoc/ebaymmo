import React, { memo } from 'react';
import Checkbox from '@/components/BaseUI/Checkbox';
import { IFilter } from '@/hooks/useFilter';

interface FilterSectionProps {
    filters: IFilter;
    setFilters: React.Dispatch<React.SetStateAction<IFilter>>;
    updateFilter: (name: string, value: any) => void;
    subCategoryData?: string[];
    setPage: (page: number) => void;
}

function FilterSectionSearch({
    filters,
    setFilters,
    updateFilter,
    subCategoryData,
    setPage
}: FilterSectionProps) {
    const handleSubCategoryChange = (subCategory: string) => {
        if (!subCategory) return;
        setFilters((prevFilters) => {
            const formattedSubCategories =
                typeof prevFilters.subCategory === 'string'
                    ? prevFilters.subCategory.split(',')
                    : prevFilters.subCategory;
            const newSubCategories = formattedSubCategories.includes(
                subCategory
            )
                ? formattedSubCategories.filter((sc: any) => sc !== subCategory)
                : [...formattedSubCategories, subCategory];
            return { ...prevFilters, subCategory: newSubCategories };
        });
    };
    const formatString = (input: string) => {
        return input
            .replace(/-/g, ' ')
            .split(/[_\s]+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="left-wrapper w-full flex flex-col lg:items-start lg:w-[20%] shrink-0">
            <div className="mt-[40px] py-[20px] pr-[50px]">
                <div className="mid flex flex-col gap-[15px] items-start">
                    <span className="text-neutral-500 text-[20px] font-medium leading-[32px]">
                        Sub Categories
                    </span>
                    {subCategoryData?.map(
                        (subCategory: string, index: number) => {
                            return (
                                <Checkbox
                                    key={index}
                                    content={formatString(subCategory) || ''}
                                    checked={filters.subCategory.includes(
                                        subCategory
                                    )}
                                    onChange={() =>
                                        handleSubCategoryChange(
                                            subCategory || ''
                                        )
                                    }
                                />
                            );
                        }
                    )}
                </div>
                <hr className="my-[30px] border-t border-gray-200 w-full" />
                <div className="bottom flex flex-col gap-[15px] items-start">
                    <span className="text-neutral-500 text-[20px] font-medium leading-[32px]">
                        Classify
                    </span>
                    <Checkbox
                        onChange={() => {
                            if (filters.classify === 'Duplicate') {
                                updateFilter('classify', '');
                            } else {
                                updateFilter('classify', 'Duplicate');
                            }
                        }}
                        checked={filters.classify === 'Duplicate'}
                        content="Duplicate Type"
                    />
                    <Checkbox
                        onChange={() => {
                            if (filters.classify === 'Unique') {
                                updateFilter('classify', '');
                            } else {
                                updateFilter('classify', 'Unique');
                            }
                        }}
                        checked={filters.classify === 'Unique'}
                        content="Unique Type"
                    />
                </div>
            </div>
        </div>
    );
}

export default memo(FilterSectionSearch);
