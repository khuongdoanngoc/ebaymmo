import { Search, Filter, ArrowUpDown, Eye } from 'lucide-react';
import { useState } from 'react';
import { useGetOrderInfoQuery } from '@/generated/graphql';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { format } from 'date-fns';
import { OrderDetailsModal } from '@/components/Order/OrderDetailsModal';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/utils/formatCurrency';

export default function Orders() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Add pagination
    const { page, limit, setPage, offset } = usePagination(
        '/admin/orders',
        10,
        1
    );

    // Get orders from GraphQL
    const { data, loading, error } = useGetOrderInfoQuery();

    // Get orders from query
    const orders = data?.orders || [];

    // Filter orders
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            false ||
            order.user?.fullName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            false ||
            order.user?.username
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            false;

        const matchesFilter =
            statusFilter === 'all' || order.orderStatus === statusFilter;

        return matchesSearch && matchesFilter;
    });

    // Paginate the orders
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);

    // Function to get status badge styles
    const getStatusBadgeStyles = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'successed':
                return 'bg-green-100 text-green-800';
            case 'complained':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    // Function to get pre-order badge styles
    const getPreOrderBadgeStyles = (isPreOrder: boolean) => {
        return isPreOrder
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-50 text-gray-700';
    };

    // Format date
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="pl-10 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="successed">Successed</option>
                        <option value="complained">Complained</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <p>Loading orders...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center p-8">
                    <h3 className="text-lg font-semibold text-red-500">
                        Error loading orders
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        {error.message}
                    </p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                    <div className="rounded-full p-3 bg-muted mb-4">
                        <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No orders found</h3>
                    <p className="text-muted-foreground text-sm">
                        Try adjusting your filters or search term
                    </p>
                </div>
            ) : (
                <>
                    <div className="rounded-xl border shadow">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                Order Code{' '}
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                Customer{' '}
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                Date{' '}
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                Total{' '}
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            Pre-order
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {paginatedOrders.map((order) => (
                                        <tr
                                            key={order.orderId}
                                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                        >
                                            <td className="p-4 align-middle">
                                                {order.orderCode || 'N/A'}
                                            </td>
                                            <td className="p-4 align-middle font-medium">
                                                <div>
                                                    <div>
                                                        {order.user?.fullName ||
                                                            'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {order.user?.username ||
                                                            'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                {order.orderDate
                                                    ? formatDate(
                                                          order.orderDate
                                                      )
                                                    : 'N/A'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {formatCurrency(
                                                    order.totalAmount || 0
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeStyles(order.orderStatus || 'unknown')}`}
                                                >
                                                    {(
                                                        order.orderStatus ||
                                                        'Unknown'
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        (
                                                            order.orderStatus ||
                                                            'Unknown'
                                                        ).slice(1)}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPreOrderBadgeStyles(order.isPreOrder || false)}`}
                                                >
                                                    {order.isPreOrder
                                                        ? 'Yes'
                                                        : 'No'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <button
                                                    onClick={() => {
                                                        if (
                                                            order.orderCode &&
                                                            order.orderDate &&
                                                            order.totalAmount &&
                                                            order.orderStatus &&
                                                            order.user
                                                                ?.fullName &&
                                                            order.user?.username
                                                        ) {
                                                            setSelectedOrder({
                                                                orderId:
                                                                    order.orderId,
                                                                orderCode:
                                                                    order.orderCode,
                                                                orderDate:
                                                                    order.orderDate,
                                                                totalAmount:
                                                                    order.totalAmount,
                                                                orderStatus:
                                                                    order.orderStatus,
                                                                isPreOrder:
                                                                    order.isPreOrder ||
                                                                    false,
                                                                user: {
                                                                    fullName:
                                                                        order
                                                                            .user
                                                                            .fullName,
                                                                    username:
                                                                        order
                                                                            .user
                                                                            .username
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        View
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add pagination component */}
                    <div className="mt-8">
                        <Pagination
                            total={filteredOrders.length}
                            limit={limit}
                            page={page}
                            setPage={setPage}
                        />
                    </div>
                </>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}
