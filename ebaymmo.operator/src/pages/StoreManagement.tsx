import { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from '@/components/ui/toast';
import {
    OrderBy,
    useUpdateStoreMutation,
    useGetStoreSubscription,
    useGetFilteredStoreCountSubscription,
    useUpdateStoresManyMutation,
    useGetProductsQuery,
    useGetOrderStoreQuery,
    useGetCategoriesQuery
} from '@/generated/graphql';
import type { ProductData } from '@/components/Store/StoreTable';
import { useLocation } from 'react-router-dom';
import useDebounced from '@/hooks/useDebounced';

// Add types back
type StoreStatus = 'active' | 'inactive' | 'pending' | 'suspended';
interface StoreData {
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
    products?: ProductData[]; // Use ProductData here
}

// Import các component đã tạo
import { StoreStats } from '@/components/Store/StoreStats';
import { StoreFilters } from '@/components/Store/StoreFilters';
import { BulkActions } from '@/components/Store/BulkActions';
import { StoreTable } from '@/components/Store/StoreTable';
import { StoreDetailDialog } from '@/components/Store/StoreDetailDialog';
import { DeleteConfirmDialog } from '@/components/Store/DeleteConfirmDialog';
import { ProductDetailDialog } from '@/components/Store/ProductDetailDiaLog';
import usePagination from '@/hooks/usePagination';

export default function StoreManagement() {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState(() => {
        const state = location.state as { searchTerm?: string } | null;
        return state?.searchTerm || '';
    });

    // Clear location state after using it
    useEffect(() => {
        if (location.state) {
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    const debouncedSearchTerm = useDebounced(searchTerm, 800);
    const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(
        null
    );
    const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('name');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { limit, page, setPage, offset } = usePagination(
        '/admin/stores',
        10,
        1
    );
    const storeTableRef = useRef<HTMLDivElement>(null);

    const [updateStore] = useUpdateStoreMutation();
    const [updateStoresMany] = useUpdateStoresManyMutation();

    // Fetch categories
    const { data: categoriesData } = useGetCategoriesQuery({
        variables: {
            offset: 0,
            limit: 1000,
            where: {
                parentCategoryId: {
                    _isNull: true
                }
            },
            orderBy: [{ categoryName: OrderBy.Asc }]
        }
    });

    // Hàm trực tiếp để cập nhật filter status
    const handleStatusChange = (status: string) => {
        console.log('Changing filter status to:', status);
        setFilterStatus(status);
        // Quan trọng: Reset về trang 1 ngay lập tức khi thay đổi filter
        setPage(1);
    };

    // Hàm trực tiếp để cập nhật filter category
    const handleCategoryChange = (category: string) => {
        setFilterCategory(category);
        // Quan trọng: Reset về trang 1 ngay lập tức khi thay đổi filter
        setPage(1);
    };

    // Tạo điều kiện lọc cho GraphQL query
    const whereFilter = useMemo(() => {
        const filters: Record<string, unknown> = {};

        console.log('Building filter with status:', filterStatus);

        // Lọc theo status
        if (filterStatus !== 'all') {
            filters.status = { _eq: filterStatus };
        } else {
            filters.status = { _in: ['active', 'inactive'] };
        }

        // Lọc theo category
        if (filterCategory !== 'all') {
            filters.categoryId = { _eq: filterCategory };
        }

        // Lọc theo search term - use debouncedSearchTerm instead of searchTerm
        if (debouncedSearchTerm) {
            filters._or = [
                { storeName: { _ilike: `%${debouncedSearchTerm}%` } },
                { user: { username: { _ilike: `%${debouncedSearchTerm}%` } } },
                { user: { email: { _ilike: `%${debouncedSearchTerm}%` } } }
            ];
        }

        console.log('Final filter:', filters);
        return filters;
    }, [debouncedSearchTerm, filterStatus, filterCategory]);

    // Tạo biến variables cho store subscription
    const storeVariables = useMemo(() => {
        console.log('Store variables updated:', {
            offset,
            limit,
            page,
            filterStatus
        });
        return {
            offset,
            limit,
            orderBy: {
                productsAggregate: {
                    count: OrderBy.Desc
                }
            },
            where: whereFilter
        };
    }, [offset, limit, whereFilter]);

    // Tạo biến variables cho count subscription
    const countVariables = useMemo(
        () => ({
            where: whereFilter
        }),
        [whereFilter]
    );

    // Subscription lấy danh sách stores với điều kiện lọc
    const { data, loading } = useGetStoreSubscription({
        variables: storeVariables,
        fetchPolicy: 'no-cache' // Đảm bảo luôn lấy dữ liệu mới
    });

    // Subscription lấy tổng số stores với điều kiện lọc
    const { data: countData, loading: countLoading } =
        useGetFilteredStoreCountSubscription({
            variables: countVariables,
            fetchPolicy: 'no-cache' // Đảm bảo luôn lấy dữ liệu mới
        });

    // Thêm useEffect đặc biệt để lắng nghe thay đổi URL
    useEffect(() => {
        // Lấy tham số page từ URL
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');

        // Chỉ cập nhật nếu có pageParam và khác với page hiện tại
        if (pageParam && parseInt(pageParam) !== page) {
            console.log('URL page changed:', pageParam, 'current:', page);
            setPage(parseInt(pageParam));
        }
    }, [window.location.search, page, setPage]);

    // Chuyển đổi dữ liệu từ subscription
    const stores = useMemo(() => {
        if (!data?.stores) return [];

        return data.stores.map((store) => {
            // Calculate total orders and revenue from all products
            const totalOrders =
                store.products?.reduce(
                    (sum: number, product) =>
                        sum + (product.ordersAggregate?.aggregate?.count || 0),
                    0
                ) || 0;

            const totalRevenue =
                store.products?.reduce(
                    (sum: number, product) =>
                        sum +
                        (product.ordersAggregate?.aggregate?.sum?.totalAmount ||
                            0),
                    0
                ) || 0;

            return {
                id: store.storeId,
                name: store.storeName || 'Store Null',
                sellerId: store.seller?.userId || '',
                sellerName: store.seller?.username || 'No name',
                email: store.seller?.email || 'No email',
                productsCount: store.productsAggregate?.aggregate?.count || 0,
                ordersCount: totalOrders,
                revenue: totalRevenue,
                rating:
                    store.storeRatingsAggregate?.aggregate?.avg?.rating || 0,
                dateCreated: store.createAt,
                lastActive: store.seller?.lastLogin,
                status: store.status as StoreStatus,
                verificationStatus:
                    store.status === 'active'
                        ? ('verified' as const)
                        : ('unverified' as const),
                address: '',
                phone: '',
                category: store.category?.categoryName || undefined,
                categoryId: store.category?.categoryId || undefined,
                description: store.shortDescription || undefined,
                logo: store.avatar || '/logo.svg',
                products: store.products
            };
        });
    }, [data?.stores]);

    // Lấy tổng số stores từ subscription đếm
    const totalFilteredStores =
        countData?.storesAggregate?.aggregate?.count || 0;

    // Log để debug
    useEffect(() => {
        console.log(
            'Total stores:',
            totalFilteredStores,
            'Current filter:',
            filterStatus
        );
    }, [totalFilteredStores, filterStatus]);

    // Đảm bảo không có trang trống khi lọc làm giảm số lượng trang
    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalFilteredStores / limit));
        if (page > maxPage && maxPage > 0) {
            setPage(maxPage);
        }
    }, [totalFilteredStores, limit, page, setPage]);

    // Chỉ reset page về 1 khi filter đổi
    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterStatus, filterCategory, sortBy]);

    // Debug offset, page, storeVariables
    useEffect(() => {
        console.log(
            'Current page:',
            page,
            'Offset:',
            offset,
            'Variables:',
            storeVariables
        );
    }, [page, offset, storeVariables]);

    // Thống kê stores
    const stats = useMemo(
        () => ({
            total: totalFilteredStores,
            active: stores.filter((s) => s.status === 'active').length,
            inactive: stores.filter((s) => s.status !== 'active').length,
            totalRevenue: stores.reduce((sum, store) => sum + store.revenue, 0),
            totalProducts: stores.reduce(
                (sum, store) => sum + store.productsCount,
                0
            ),
            totalOrders: stores.reduce(
                (sum, store) => sum + store.ordersCount,
                0
            )
        }),
        [stores, totalFilteredStores]
    );

    const handleUpdateStatus = (id: string, status: StoreStatus) => {
        updateStore({
            variables: {
                _set: {
                    status: status
                },
                where: {
                    storeId: { _eq: id }
                }
            }
        })
            .then(() => {
                toast({
                    title: 'Success',
                    description: `Store status updated to ${status} successfully`
                });
            })
            .catch((error) => {
                console.error(error);
                toast({
                    title: 'Error',
                    description: 'Failed to update store status',
                    variant: 'destructive'
                });
            });
    };

    const getNextStatus = (currentStatus: StoreStatus): StoreStatus => {
        if (currentStatus === 'active') return 'inactive';
        if (currentStatus === 'inactive') return 'active';
        return 'active';
    };

    const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
        if (selectedStores.length === 0) {
            toast({
                title: 'Warning',
                description: 'Please select at least one store',
                variant: 'destructive'
            });
            return;
        }

        if (action === 'delete') {
            setIsDeleteModalOpen(true);
            return;
        }

        const newStatus: StoreStatus =
            action === 'activate' ? 'active' : 'inactive';

        updateStoresMany({
            variables: {
                _set: { status: newStatus },
                where: { storeId: { _in: selectedStores } }
            }
        })
            .then(() => {
                toast({
                    title: 'Success',
                    description: `${selectedStores.length} stores have been ${action === 'activate' ? 'activated' : 'deactivated'}`
                });
                setSelectedStores([]);
            })
            .catch((error) => {
                console.error(error);
                toast({
                    title: 'Error',
                    description: `Failed to ${action} stores`,
                    variant: 'destructive'
                });
            });
    };

    const confirmDelete = () => {
        updateStoresMany({
            variables: {
                _set: { deleted: true },
                where: { storeId: { _in: selectedStores } }
            }
        })
            .then(() => {
                toast({
                    title: 'Success',
                    description: `${selectedStores.length} stores have been deleted`
                });
                setSelectedStores([]);
                setIsDeleteModalOpen(false);
            })
            .catch((error) => {
                console.error(error);
                toast({
                    title: 'Error',
                    description: 'Failed to delete stores',
                    variant: 'destructive'
                });
            });
    };

    const handleViewDetails = (store: StoreData) => {
        setSelectedStore(store);
        setIsDetailsOpen(true);
    };

    const handleViewProductDetails = (product: ProductData) => {
        setSelectedProduct(product);
        setIsProductDetailOpen(true);
    };

    const handleSelectStore = (id: string) => {
        setSelectedStores((prev) =>
            prev.includes(id)
                ? prev.filter((storeId) => storeId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedStores((prev) =>
            prev.length === stores.length ? [] : stores.map((store) => store.id)
        );
    };

    const handleClearAllFilters = () => {
        console.log('Clearing all filters and resetting pagination');
        setSearchTerm('');
        setFilterStatus('all');
        setFilterCategory('all');
        setSortBy('name');

        // Đảm bảo trang về 1 sau khi clear filter
        setPage(1);
    };

    const { data: productsData, loading: productsLoading } =
        useGetProductsQuery({
            variables: {
                limit: 10,
                where: selectedStore
                    ? { storeId: { _eq: selectedStore.id } }
                    : undefined
            },
            skip: !selectedStore || !isDetailsOpen
        });

    const { data: ordersData, loading: ordersLoading } = useGetOrderStoreQuery({
        variables: {
            limit: 100,
            where: selectedStore
                ? {
                      product: {
                          store: {
                              storeId: { _eq: selectedStore.id }
                          }
                      }
                  }
                : undefined
        },
        skip: !selectedStore || !isDetailsOpen
    });

    if (loading || countLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Store Management</h1>
            </div>

            {/* Stats Dashboard */}
            <StoreStats
                totalStores={stats.total}
                activeStores={stats.active}
                inactiveStores={stats.inactive}
                totalProducts={stats.totalProducts}
                totalOrders={stats.totalOrders}
                totalRevenue={stats.totalRevenue}
            />

            {/* Filters and search */}
            <StoreFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterStatus={filterStatus}
                onFilterStatusChange={handleStatusChange}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                filterCategory={filterCategory}
                onFilterCategoryChange={handleCategoryChange}
                categories={
                    categoriesData?.categories?.map((category) => ({
                        categoryId: category.categoryId,
                        categoryName: category.categoryName || ''
                    })) || []
                }
                onClearAll={handleClearAllFilters}
            />

            {/* Bulk actions */}
            <BulkActions
                selectedCount={selectedStores.length}
                onActivate={() => handleBulkAction('activate')}
                onDeactivate={() => handleBulkAction('deactivate')}
                onDelete={() => handleBulkAction('delete')}
            />

            {/* Stores Table */}
            <div ref={storeTableRef}>
                <StoreTable
                    stores={stores}
                    selectedStores={selectedStores}
                    onSelectStore={handleSelectStore}
                    onSelectAll={handleSelectAll}
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={handleUpdateStatus}
                    getNextStatus={getNextStatus}
                    currentPage={page}
                    pageSize={limit}
                    totalStores={totalFilteredStores}
                    onPageChange={setPage}
                    onViewProductDetails={handleViewProductDetails}
                />
            </div>

            {/* Store Details Dialog */}
            <StoreDetailDialog
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                store={selectedStore}
                onUpdateStatus={handleUpdateStatus}
                products={productsData?.products || []}
                getNextStatus={getNextStatus}
                productsLoading={productsLoading}
                orders={ordersData?.orders || []}
                ordersLoading={ordersLoading}
            />

            {/* Product Details Dialog */}
            <ProductDetailDialog
                isOpen={isProductDetailOpen}
                onOpenChange={setIsProductDetailOpen}
                product={selectedProduct}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                selectedCount={selectedStores.length}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
