import React from 'react';
import CategoryItem from './CategoryItem';
import { Categories } from '@/generated/graphql-request';

const CategoryList: React.FC<{
    categories: Categories[];
    loading: boolean;
}> = ({ categories, loading }) => {
    if (loading) {
        return (
            <div className="min-w-full max-w-[940px] grid grid-cols-1 md:grid-cols-2 gap-x-[20px] gap-y-[30px]">
                {[...Array(4)].map((_, index) => (
                    <CategoryItem
                        key={index}
                        loading={true} // Pass loading prop as true
                        name=""
                        description=""
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="min-w-full max-w-[940px] grid grid-cols-1 md:grid-cols-2 gap-x-[20px] gap-y-[30px]">
            {categories.map((category) => (
                <CategoryItem
                    key={category.categoryId}
                    name={category.categoryName ?? ''}
                    imageUrl={category.imagesUrl ?? undefined}
                    description={category.description ?? ''}
                    slug={category.slug ?? ''}
                    loading={false}
                />
            ))}
        </div>
    );
};

export default CategoryList;
