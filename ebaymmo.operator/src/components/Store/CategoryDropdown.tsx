import { useState } from 'react';
import { useGetCategoriesQuery } from '@/generated/graphql';
import { OrderBy } from '@/generated/graphql';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface CategoryDropdownProps {
    onSelectCategory: (categoryId: string) => void;
    selectedCategoryId?: string;
}

export function CategoryDropdown({
    onSelectCategory,
    selectedCategoryId
}: CategoryDropdownProps) {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Fetch all categories
    const { data: categoriesData } = useGetCategoriesQuery({
        variables: {
            offset: 0,
            limit: 1000,
            orderBy: [{ categoryName: OrderBy.Asc }]
        }
    });

    const categories = categoriesData?.categories || [];

    // Get parent categories (categories without parent)
    const parentCategories = categories.filter(
        (category) => !category.parentCategoryId
    );

    // Get child categories for a specific parent
    const getChildCategories = (parentId: string) => {
        return categories.filter(
            (category) => category.parentCategoryId === parentId
        );
    };

    const handleSelect = (categoryId: string) => {
        onSelectCategory(categoryId);
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    {selectedCategoryId
                        ? categories.find(
                              (c) => c.categoryId === selectedCategoryId
                          )?.categoryName || 'All Categories'
                        : 'All Categories'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[220px] p-2 overflow-visible">
                <div className="space-y-1">
                    <Button
                        variant={!selectedCategoryId ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => handleSelect('all')}
                        className="w-full justify-start"
                    >
                        All Categories
                    </Button>
                    {parentCategories.map((category) => (
                        <div
                            key={category.categoryId}
                            className="group relative"
                            onMouseEnter={() =>
                                setHoveredCategory(category.categoryId)
                            }
                            onMouseLeave={() => setHoveredCategory(null)}
                        >
                            <Button
                                variant={
                                    selectedCategoryId === category.categoryId
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                size="sm"
                                onClick={() =>
                                    handleSelect(category.categoryId)
                                }
                                className="w-full justify-between relative z-20"
                            >
                                {category.categoryName}
                                {getChildCategories(category.categoryId)
                                    .length > 0 && (
                                    <ChevronRight className="h-4 w-4 opacity-50" />
                                )}
                            </Button>
                            {hoveredCategory === category.categoryId &&
                                getChildCategories(category.categoryId).length >
                                    0 && (
                                    <div
                                        className="absolute left-full top-0 z-[9999]"
                                        style={{
                                            transform: 'translateX(-1px)'
                                        }}
                                    >
                                        <div className="relative">
                                            {/* Invisible bridge for smooth hover */}
                                            <div className="absolute right-[calc(100%-8px)] w-2 h-full" />

                                            <div className="bg-popover rounded-md border shadow-md py-2">
                                                {getChildCategories(
                                                    category.categoryId
                                                ).map((childCategory) => (
                                                    <Button
                                                        key={
                                                            childCategory.categoryId
                                                        }
                                                        variant={
                                                            selectedCategoryId ===
                                                            childCategory.categoryId
                                                                ? 'secondary'
                                                                : 'ghost'
                                                        }
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSelect(
                                                                childCategory.categoryId
                                                            )
                                                        }
                                                        className="w-[200px] justify-start hover:bg-accent"
                                                    >
                                                        {
                                                            childCategory.categoryName
                                                        }
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
