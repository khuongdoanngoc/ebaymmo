import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { useState } from 'react';
import Pagination from '../Pagination';

type StoreStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface ProductData {
    productName?: string | null;
    createAt?: string;
    price?: number;
    soldCount?: number | null;
    stockCount?: number;
    status?: string | null;
    hasDiscount?: number | boolean | null;
}

export interface StoreData {
    id: string;
    name: string;
    sellerName: string;
    sellerId: string;
    email: string;
    productsCount: number;
    ordersCount: number;
    revenue: number;
    rating: number | string;
    dateCreated: string;
    lastActive: string;
    status: StoreStatus;
    verificationStatus: 'verified' | 'unverified';
    address?: string;
    phone?: string;
    category?: string;
    categoryId?: string;
    description?: string;
    logo?: string;
    products?: ProductData[];
}

interface StoreTableProps {
    stores: StoreData[];
    selectedStores: string[];
    onSelectStore: (id: string) => void;
    onSelectAll: () => void;
    onViewDetails: (store: StoreData) => void;
    onUpdateStatus: (id: string, status: StoreStatus) => void;
    getNextStatus: (status: StoreStatus) => StoreStatus;
    currentPage: number;
    pageSize: number;
    totalStores: number;
    onPageChange: (page: number) => void;
    onViewProductDetails: (product: ProductData) => void;
    highlightedStoreId?: string | null;
}

export function StoreTable({
    stores,
    selectedStores,
    onSelectStore,
    onSelectAll,
    onViewDetails,
    onUpdateStatus,
    getNextStatus,
    currentPage,
    pageSize,
    totalStores,
    onPageChange,
    onViewProductDetails,
    highlightedStoreId
}: StoreTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Create a wrapper for onPageChange to match the expected Dispatch<SetStateAction<number>> type
    const setPageWrapper: React.Dispatch<React.SetStateAction<number>> = (
        value
    ) => {
        if (typeof value === 'function') {
            // If it's a function like (prev) => prev + 1
            const newPage = value(currentPage);
            onPageChange(newPage);
        } else {
            // If it's a direct value
            onPageChange(value);
        }
    };

    const toggleRow = (storeId: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(storeId)) {
            newExpandedRows.delete(storeId);
        } else {
            newExpandedRows.add(storeId);
        }
        setExpandedRows(newExpandedRows);
    };

    return (
        <Card className="pb-8">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedStores.length ===
                                            stores.length && stores.length > 0
                                    }
                                    onChange={onSelectAll}
                                    className="h-4 w-4"
                                />
                            </TableHead>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stores.length > 0 ? (
                            stores.map((store) => (
                                <>
                                    <TableRow
                                        key={store.id}
                                        id={`store-${store.id}`}
                                        className={
                                            highlightedStoreId === store.id
                                                ? 'bg-yellow-50 transition-colors duration-1000'
                                                : ''
                                        }
                                    >
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedStores.includes(
                                                    store.id
                                                )}
                                                onChange={() =>
                                                    onSelectStore(store.id)
                                                }
                                                className="h-4 w-4"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() =>
                                                    toggleRow(store.id)
                                                }
                                            >
                                                {expandedRows.has(store.id) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                {store.logo && (
                                                    <img
                                                        src={store.logo}
                                                        alt={store.name}
                                                        className="w-10 h-10 rounded-md object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-medium">
                                                        {store.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {store.sellerName}
                                                    </div>
                                                    {store.verificationStatus ===
                                                        'verified' && (
                                                        <Badge
                                                            variant="outline"
                                                            className="mt-1 bg-blue-50 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {store.sellerName}
                                        </TableCell>
                                        <TableCell>
                                            {store.productsCount}
                                        </TableCell>
                                        <TableCell>
                                            {store.ordersCount}
                                        </TableCell>
                                        <TableCell>
                                            {store.revenue.toLocaleString() +
                                                ' '}{' '}
                                            USDT
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`cursor-pointer transition-colors ${
                                                    store.status === 'active'
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : store.status ===
                                                            'inactive'
                                                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                          : store.status ===
                                                              'pending'
                                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                }`}
                                                onClick={() =>
                                                    onUpdateStatus(
                                                        store.id,
                                                        getNextStatus(
                                                            store.status as StoreStatus
                                                        )
                                                    )
                                                }
                                            >
                                                {store.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                store.dateCreated
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                store.lastActive
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        onViewDetails(store)
                                                    }
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant={
                                                        store.status ===
                                                        'active'
                                                            ? 'destructive'
                                                            : 'default'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        onUpdateStatus(
                                                            store.id,
                                                            getNextStatus(
                                                                store.status as StoreStatus
                                                            )
                                                        )
                                                    }
                                                >
                                                    {store.status === 'active'
                                                        ? 'Deactivate'
                                                        : 'Activate'}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(store.id) && (
                                        <TableRow key={`${store.id}-products`}>
                                            <TableCell
                                                colSpan={11}
                                                className="bg-gray-50"
                                            >
                                                <div className="p-4">
                                                    <h4 className="font-medium mb-2">
                                                        Products List
                                                    </h4>
                                                    {store.products &&
                                                    store.products.length >
                                                        0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {store.products.map(
                                                                (
                                                                    product: ProductData,
                                                                    index: number
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="border rounded-lg p-3 flex flex-col justify-between"
                                                                    >
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {
                                                                                    product.productName
                                                                                }
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                Price:
                                                                                $
                                                                                {product.price !=
                                                                                null
                                                                                    ? parseFloat(
                                                                                          String(
                                                                                              product.price
                                                                                          )
                                                                                      ).toFixed(
                                                                                          2
                                                                                      )
                                                                                    : 'N/A'}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                Sold:{' '}
                                                                                {product.soldCount ??
                                                                                    0}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                Status:{' '}
                                                                                {product.status ||
                                                                                    'N/A'}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                Discount:{' '}
                                                                                {product.hasDiscount
                                                                                    ? 'Yes'
                                                                                    : 'No'}
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="mt-2 self-end p-1 h-auto"
                                                                            onClick={() =>
                                                                                onViewProductDetails(
                                                                                    product
                                                                                )
                                                                            }
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            No products found
                                                            for this store.
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={11}
                                    className="text-center py-8"
                                >
                                    No stores found matching your filters
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <Pagination
                page={currentPage}
                total={totalStores}
                limit={pageSize}
                setPage={setPageWrapper}
            />
        </Card>
    );
}
