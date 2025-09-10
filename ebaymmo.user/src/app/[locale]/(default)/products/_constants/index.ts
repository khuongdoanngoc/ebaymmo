import { IFilter } from '@/hooks/useFilter';

// src/app/(default)/products/constants/index.ts
export const initialFilters: IFilter = {
    type: '',
    category: '',
    subCategory: [],
    classify: '',
    query: '',
    filter: ''
};

export const options = [
    'Sort',
    'Price ascending',
    'Price descending',
    'Most viewed',
    'Best rated'
];
