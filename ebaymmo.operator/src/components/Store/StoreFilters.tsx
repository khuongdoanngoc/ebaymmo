import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { CategoryDropdown } from './CategoryDropdown';
import { Button } from '../ui/button';
import { memo, useRef, useEffect } from 'react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
}

const SearchInput = memo(function SearchInput({
    value,
    onChange
}: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Restore focus after debounce
    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            inputRef.current?.focus();
        }
    }, [value]);

    return (
        <div className="relative w-[800px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                ref={inputRef}
                placeholder="Search stores, sellers or emails..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-8"
            />
        </div>
    );
});

interface Category {
    categoryId: string;
    categoryName: string;
}

interface StoreFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filterStatus: string;
    onFilterStatusChange: (value: string) => void;
    sortBy: string;
    onSortByChange: (value: string) => void;
    filterCategory?: string;
    onFilterCategoryChange?: (value: string) => void;
    categories: Category[];
    onClearAll?: () => void;
}

export function StoreFilters({
    searchTerm,
    onSearchChange,
    filterStatus,
    onFilterStatusChange,
    sortBy,
    onSortByChange,
    filterCategory = 'all',
    onFilterCategoryChange,
    onClearAll
}: StoreFiltersProps) {
    const hasActiveFilters =
        searchTerm ||
        filterStatus !== 'all' ||
        filterCategory !== 'all' ||
        sortBy !== 'name';

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                    <SearchInput value={searchTerm} onChange={onSearchChange} />
                    <div className="w-[180px]">
                        <Select
                            value={filterStatus}
                            onValueChange={onFilterStatusChange}
                        >
                            <SelectTrigger>
                                <Filter size={16} className="mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {onFilterCategoryChange && (
                        <div className="w-[350px]">
                            <CategoryDropdown
                                selectedCategoryId={
                                    filterCategory === 'all'
                                        ? undefined
                                        : filterCategory
                                }
                                onSelectCategory={onFilterCategoryChange}
                            />
                        </div>
                    )}
                    <div className="w-[180px]">
                        <Select value={sortBy} onValueChange={onSortByChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name (A-Z)</SelectItem>
                                <SelectItem value="revenue">
                                    Revenue (High-Low)
                                </SelectItem>
                                <SelectItem value="products">
                                    Products (High-Low)
                                </SelectItem>
                                <SelectItem value="orders">
                                    Orders (High-Low)
                                </SelectItem>
                                <SelectItem value="date">
                                    Date Created (New-Old)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onClearAll?.()}
                            className="h-10"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
