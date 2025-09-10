import { useGetCategoriesQuery } from '@/generated/graphql';
import { useMemo } from 'react';

export const useCategoriesData = () => {
    const {
        data,
        loading: categoryLoading,
        error: categoryError
    } = useGetCategoriesQuery({
        variables: {
            limit: 1000
        },
        fetchPolicy: 'cache-first'
    });

    const categoryData = useMemo(() => data, [data]);

    return { categoryData, categoryLoading, categoryError };
};
