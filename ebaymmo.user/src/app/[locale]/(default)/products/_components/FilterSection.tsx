import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Checkbox from '@/components/BaseUI/Checkbox';
import { IFilter } from '@/hooks/useFilter';
import { initialFilters } from '../_constants';
import { Category } from '../_utils/filterCategories';

interface FilterSectionProps {
    filters: IFilter;
    setFilters: React.Dispatch<React.SetStateAction<IFilter>>;
    updateFilter: (name: string, value: any) => void;
    categoryFiltered: Category[];
    setPage: (page: number) => void;
    categoryData:
        | {
              categories: {
                  categoryName?: string | null;
                  slug?: string | null;
                  [key: string]: any;
              }[];
          }
        | null
        | undefined;
}

export default function FilterSection({
    filters,
    setFilters,
    updateFilter,
    categoryFiltered,
    setPage,
    categoryData
}: FilterSectionProps) {
    const t = useTranslations('product');
    // hooks use
    const searchParams = useSearchParams();

    // Đặt tất cả useState hooks ở đầu component
    const [activeTab, setActiveTab] = useState(searchParams.get('type'));
    const [selectedOption, setSelectedOption] = useState('Sort');

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

    useEffect(() => {
        const type = searchParams.get('type');
        if (filters.type !== type && type !== null) {
            setActiveTab(type);
            updateFilter('type', type || activeTab || '');
        }
        const category = searchParams.get('category') || '';

        if (filters.category !== category) {
            setFilters((prevFilters) => ({
                ...prevFilters,
                category,
                subCategory: [],
                classify: '',
                filter: ''
            }));
            setSelectedOption('Sort');
        } else {
            setActiveTab(filters.type);
        }
    }, [searchParams.toString().replace(/[?&](page|limit)=[^&]*/g, '')]);

    useEffect(() => {
        setPage(1);
    }, [searchParams.get('category'), searchParams.get('type')]);

    return (
        <div className="left-wrapper w-full flex flex-col lg:items-start lg:w-[20%] shrink-0">
            <div className="tab flex items-center bg-gray-100 p-[20px] rounded-[72px] w-full justify-center md:w-fit gap-[10px]">
                <button
                    className={`px-[23px] py-[13px] rounded-[45px] transition-colors duration-200 ease-in-out text-[18px] font-medium leading-[28.8px] ${
                        activeTab === 'product'
                            ? 'bg-white text-primary-500 border border-primary-500'
                            : 'bg-white text-gray-500 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                        setActiveTab('product');
                        setFilters(initialFilters);
                        setSelectedOption('Sort');
                        updateFilter('type', 'product');
                    }}
                >
                    Product
                </button>
                <button
                    className={`px-[23px] py-[13px] rounded-[45px] ml-[10px] transition-colors duration-200 ease-in-out text-[18px] font-medium leading-[28.8px] ${
                        activeTab === 'service'
                            ? 'bg-white text-primary-500 border border-primary-500'
                            : 'bg-white text-gray-500 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                        setActiveTab('service');
                        setFilters(initialFilters);
                        setSelectedOption('Sort');
                        updateFilter('type', 'service');
                    }}
                >
                    Service
                </button>
            </div>
            <div className="mt-[40px] py-[20px] pr-[50px]">
                <div className="top flex flex-col gap-[15px] items-start">
                    <Checkbox
                        content="All"
                        checked={filters.category === ''}
                        onChange={() => {
                            updateFilter('category', '');
                            updateFilter('subCategory', []);
                        }}
                    />

                    {categoryFiltered?.map((category, index) => (
                        <Checkbox
                            key={index}
                            content={category.categoryName || ''}
                            checked={filters.category === category.slug}
                            onChange={() => {
                                setFilters(initialFilters);
                                updateFilter('type', filters.type);
                                updateFilter('category', category.slug || '');
                            }}
                        />
                    ))}
                </div>
                <hr className="my-[30px] border-t border-gray-200 w-full " />
                {filters.category !== '' && (
                    <div className="mid flex flex-col gap-[15px] items-start">
                        <span className="text-neutral-500 text-[20px] font-medium leading-[32px]">
                            {categoryData?.categories.find(
                                (category) => category.slug === filters.category
                            )?.categoryName || ''}
                        </span>
                        {categoryFiltered
                            ?.find(
                                (category) => category.slug === filters.category
                            )
                            ?.subCategories.map(
                                (subCategory: any, index: number) => (
                                    <Checkbox
                                        key={index}
                                        content={subCategory.categoryName || ''}
                                        checked={filters.subCategory.includes(
                                            subCategory.slug
                                        )}
                                        onChange={() =>
                                            handleSubCategoryChange(
                                                subCategory.slug || ''
                                            )
                                        }
                                    />
                                )
                            )}
                    </div>
                )}
                <hr className="my-[30px] border-t border-gray-200 w-full" />
                <div className="bottom flex flex-col gap-[15px] items-start">
                    <span className="text-neutral-500 text-[20px] font-medium leading-[32px]">
                        {t('details.classify')}
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
