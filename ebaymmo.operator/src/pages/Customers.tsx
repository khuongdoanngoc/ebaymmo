import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/formatDate';
import Pagination from '@/components/Pagination';
import usePagination from '@/hooks/usePagination';
import { AlertCircle } from 'lucide-react';
import {
    OrderBy,
    useGetTotalStoreSubscription,
    useGetUsersSubscription,
    UsersSelectColumn,
    useStasticUserSubscription,
    useUpdateUserMutation,
    useUpdateUserStoresMutation
} from '@/generated/graphql';

// Import các component con đã tách
import CustomerStatistics from '@/components/Customer/CustomerStastistics';
import CustomerFilters from '@/components/Customer/CustomerFilters';
import CustomerTable from '@/components/Customer/CustomerTable';
import {
    CustomerType,
    StatusFilter,
    CustomerAction
} from '@/components/Customer/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { useLocation, useNavigate } from 'react-router-dom';
// import { useLocation } from 'react-router-dom';
// import { fi } from 'date-fns/locale';

export default function Customers() {
    // const location = useLocation();

    const { page, limit, setPage, offset } = usePagination(
        '/admin/customers',
        10,
        1
    );

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        let changed = false;
        if (!params.get('page')) {
            params.set('page', '1');
            changed = true;
        }
        if (!params.get('limit')) {
            params.set('limit', '10');
            changed = true;
        }
        if (changed) {
            navigate(`${location.pathname}?${params.toString()}`, {
                replace: true
            });
        }
    }, [location, navigate]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<CustomerType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [expandedCustomers, setExpandedCustomers] = useState<
        Record<string, boolean>
    >({});

    const [updateUser] = useUpdateUserMutation();
    const [updateStores] = useUpdateUserStoresMutation();

    const handleKeyDown = (e: any) => {
        if (e.key === 'Enter') {
            setSearchQuery(searchTerm);
        }
    };

    const where = {
        role: {
            _eq: 'USER'
        },
        ...(statusFilter !== 'all' ? { status: { _eq: statusFilter } } : {}),
        ...(searchQuery
            ? {
                  _or: [
                      { username: { _ilike: `%${searchQuery}%` } },
                      { email: { _ilike: `%${searchQuery}%` } },
                      { fullName: { _ilike: `%${searchQuery}%` } }
                  ]
              }
            : {}),
        ...(activeTab !== 'all'
            ? activeTab === 'seller'
                ? { sellerSince: { _isNull: false } } // Là seller
                : activeTab === 'user'
                  ? {
                        role: { _eq: 'USER' },
                        sellerSince: { _isNull: true }
                    } // Là user thường
                  : { role: { _isNull: true } } // Mặc định: sellerSince null
            : {})
    };

    console.log('where', where);

    const { data, loading, error } = useGetUsersSubscription({
        variables: {
            limit,
            offset,
            orderBy: {
                username: OrderBy.Asc
            },
            where

            // where: {
            //     role: {
            //         _neq: 'OPERATOR'
            //     }
            // }
        },
        fetchPolicy: 'network-only'
    });

    const dataTotalSeller = useStasticUserSubscription({
        variables: {
            columns: UsersSelectColumn.SellerSince as UsersSelectColumn
        }
    });

    const dataTotalActive = useStasticUserSubscription({
        variables: {
            columns: UsersSelectColumn.Status as UsersSelectColumn,
            where: {
                status: {
                    _eq: 'active'
                },
                role: {
                    _eq: 'USER'
                }
            }
        }
    });

    const dataTotalUser = useStasticUserSubscription({
        variables: {
            columns: UsersSelectColumn.UserId as UsersSelectColumn,
            where: {
                role: {
                    _eq: 'USER'
                },
                sellerSince: {
                    _isNull: true
                }
            }
        }
    });

    const dataTotalStore = useGetTotalStoreSubscription({});

    const dataTotalPagination = useStasticUserSubscription({
        variables: {
            columns: UsersSelectColumn.UserId as UsersSelectColumn,
            where
        }
    });

    // Xử lý lỗi và loading
    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold">
                        Error loading customers
                    </h2>
                    <p className="text-muted-foreground">{error.message}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                        Loading customers...
                    </p>
                </div>
            </div>
        );
    }

    // Hàm chuyển đổi trạng thái mở rộng
    const toggleCustomerExpand = (customerId: string) => {
        setExpandedCustomers((prev) => ({
            ...prev,
            [customerId]: !prev[customerId]
        }));
    };

    // Chuyển đổi dữ liệu từ API sang mảng khách hàng
    const customers =
        (data?.users &&
            data?.users.map((user: any) => ({
                userId: user.userId ?? '',
                username: user.username ?? '',
                name: user.fullName ?? '',
                email: user.email ?? '',
                orders: user.ordersAggregate?.aggregate?.count ?? 0,
                totalSpent: parseInt(
                    user.ordersAggregate?.aggregate?.sum?.totalAmount ?? 0
                ),
                type: 'user' as CustomerType,
                status: user.status ?? 'active',
                role: (user.sellerSince ? 'seller' : 'user') as
                    | 'user'
                    | 'seller',
                sellerSince: user.sellerSince ?? '',
                stores:
                    user.stores?.map((store: any) => ({
                        storeId: store.storeId,
                        storeName: store.storeName ?? '',
                        status: store.status,
                        category: store.category
                            ? {
                                  categoryName:
                                      store.category.categoryName ?? ''
                              }
                            : undefined
                    })) ?? []
            }))) ||
        [];

    // Tính toán số liệu thống kê
    const stats = {
        total:
            (dataTotalUser?.data?.usersAggregate.aggregate?.count ?? 0) +
            (dataTotalSeller.data?.usersAggregate.aggregate?.count ?? 0),
        users: dataTotalUser?.data?.usersAggregate.aggregate?.count ?? 0,
        sellers: dataTotalSeller.data?.usersAggregate.aggregate?.count ?? 0,
        active: dataTotalActive.data?.usersAggregate.aggregate?.count ?? 0,
        totalStores: dataTotalStore?.data?.storesAggregate.aggregate?.count ?? 0
    };

    const handleBanned = async (username: string, status: string) => {
        try {
            const result = await updateUser({
                variables: {
                    where: {
                        username: {
                            _eq: username
                        }
                    },
                    _set: {
                        status: status
                    }
                }
            });
            console.log(result.data);

            if (status === 'banned') {
                const userToUpdate = customers.find(
                    (c) => c.username === username
                );
                if (
                    userToUpdate &&
                    userToUpdate.role === 'seller' &&
                    userToUpdate.stores?.length > 0 &&
                    userToUpdate.userId
                ) {
                    try {
                        const storeResult = await updateStores({
                            variables: {
                                _eq: userToUpdate.userId,
                                status: 'inactive'
                            }
                        });
                        console.log('Stores updated:', storeResult.data);
                    } catch (storeErr) {
                        console.error('Error updating stores:', storeErr);
                    }
                }
            }
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    const handleCustomerAction = async (action: CustomerAction) => {
        const actionText = action.type === 'activated' ? 'active' : 'suspended';

        try {
            const result = await updateUser({
                variables: {
                    where: {
                        username: {
                            _eq: action.userId
                        }
                    },
                    _set: {
                        status: actionText
                    }
                }
            });
            console.log(result);

            if (action.type === 'activated' && actionText === 'active') {
                const userToUpdate = customers.find(
                    (c) => c.username === action.userId
                );
                if (
                    userToUpdate &&
                    userToUpdate.role === 'seller' &&
                    userToUpdate.stores?.length > 0 &&
                    userToUpdate.userId // Kiểm tra userId tồn tại
                ) {
                    try {
                        const storeResult = await updateStores({
                            variables: {
                                _eq: userToUpdate.userId,
                                status: 'active'
                            }
                        });
                        console.log('Stores reactivated:', storeResult.data);
                    } catch (storeErr) {
                        console.error('Error updating stores:', storeErr);
                    }
                }
            }
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Customers
                    </h1>
                    <p className="text-muted-foreground">
                        Manage customers from different categories
                    </p>
                </div>
            </div>

            {/* Component thống kê */}
            <CustomerStatistics stats={stats} />

            {/* Component lọc và tìm kiếm */}
            <CustomerFilters
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleKeyDown={handleKeyDown}
                customerCount={customers.length}
                setPage={setPage}
            />

            {/* Component bảng khách hàng */}
            <CustomerTable
                customers={customers}
                activeTab={activeTab}
                expandedCustomers={expandedCustomers}
                toggleCustomerExpand={toggleCustomerExpand}
                handleCustomerAction={handleCustomerAction}
                handleBanned={handleBanned}
                formatCurrency={formatCurrency}
                formatDateTime={formatDateTime}
            />

            {/* Phân trang */}
            {(dataTotalPagination.data?.usersAggregate.aggregate?.count ?? 0) >
                0 && (
                <Pagination
                    total={
                        dataTotalPagination.data?.usersAggregate.aggregate
                            ?.count
                    }
                    limit={limit}
                    page={page}
                    setPage={setPage}
                />
            )}
        </div>
    );
}
