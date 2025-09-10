import { Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { CustomerType, StatusFilter } from './types';
import { UserCheck, Store } from 'lucide-react';

interface CustomerFiltersProps {
    activeTab: CustomerType | 'all';
    setActiveTab: (tab: CustomerType | 'all') => void;
    statusFilter: StatusFilter;
    setStatusFilter: (status: StatusFilter) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    customerCount: number;
    setPage: (page: number) => void;
}

export default function CustomerFilters({
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    handleKeyDown,
    customerCount,
    setPage
}: CustomerFiltersProps) {
    return (
        <>
            <Tabs
                value={activeTab}
                onValueChange={(value) => {
                    setActiveTab(value as typeof activeTab);
                    setPage(1);
                }}
            >
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="all">All Customers</TabsTrigger>
                        <TabsTrigger
                            value="user"
                            className="flex items-center gap-1"
                        >
                            <UserCheck className="h-3.5 w-3.5" /> Users
                        </TabsTrigger>
                        <TabsTrigger
                            value="seller"
                            className="flex items-center gap-1"
                        >
                            <Store className="h-3.5 w-3.5" /> Sellers
                        </TabsTrigger>
                    </TabsList>

                    <div className="text-sm text-muted-foreground">
                        Showing <strong>{customerCount}</strong> customers
                    </div>
                </div>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="pl-10 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value as StatusFilter);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </>
    );
}
