import { IFilter } from '@/hooks/useFilter';

export interface Category {
    type?: string | null;
    categoryId: any;
    parentCategoryId?: any;
    categoryName?: string | null;
    slug?: string | null;
    [key: string]: any;
}

export const filterCategories = (
    categories: Category[] = [],
    filters: IFilter
) => {
    if (!categories) return [];

    return categories
        .filter((category) => {
            const matchesType = filters.type
                ? category.type === filters.type
                : true;
            const hasNoParent = category.parentCategoryId === null;
            return matchesType && hasNoParent;
        })
        .map((category) => ({
            ...category,
            subCategories: categories.filter(
                (subCategory) =>
                    subCategory.parentCategoryId === category.categoryId
            )
        }));
};
