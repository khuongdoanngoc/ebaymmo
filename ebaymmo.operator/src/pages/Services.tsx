import {
    Search,
    Eye,
    Package,
    Store,
    DollarSign,
    ShoppingCart,
    Calendar
} from 'lucide-react';
import { useState } from 'react';
import { useGetServicesListSubscription } from '@/generated/graphql';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { format } from 'date-fns';
import { ServiceDetailsModal } from '@/components/Service/ServiceDetailsModal';
import { Service } from '@/types/service';
import { formatCurrency } from '@/utils/formatCurrency';

export default function Services() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedService, setSelectedService] = useState<Service | null>(
        null
    );

    // Add pagination
    const { page, limit, setPage, offset } = usePagination(
        '/admin/services',
        10,
        1
    );

    // Get services from GraphQL subscription
    const { data, loading, error } = useGetServicesListSubscription();

    // Get services from subscription
    const services = data?.products || [];

    // Calculate statistics
    const totalServices = services.length;
    const totalOrders = services.reduce(
        (sum, service) =>
            sum + (service.ordersAggregate?.aggregate?.count || 0),
        0
    );
    const totalRevenue = services.reduce(
        (sum, service) =>
            sum + (service.ordersAggregate?.aggregate?.sum?.totalAmount || 0),
        0
    );
    const avgOrdersPerService = totalServices
        ? (totalOrders / totalServices).toFixed(1)
        : '0';
    const avgRevenuePerService = totalServices
        ? (totalRevenue / totalServices).toFixed(2)
        : '0';

    // Filter services
    const filteredServices = services.filter((service) => {
        const matchesSearch =
            service.productName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            service.store?.storeName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            service.store?.user?.username
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    // Paginate the services
    const paginatedServices = filteredServices.slice(offset, offset + limit);

    // Format date
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    };

    return (
        <div className="space-y-6">
            {/* Overview Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">
                            Total Services
                        </h3>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">
                            {totalServices}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active: {totalServices} · Inactive: 0
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">
                            Total Orders
                        </h3>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            Avg. {avgOrdersPerService} orders per service
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">
                            Total Revenue
                        </h3>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg. {formatCurrency(Number(avgRevenuePerService))}{' '}
                            per service
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">
                            Active Stores
                        </h3>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">
                            {
                                new Set(services.map((s) => s.store?.storeId))
                                    .size
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Providing services on the platform
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Services
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and monitor all services across the platform
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        className="pl-10 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center p-8">
                    <div className="rounded-full p-3 bg-red-100 mb-4">
                        <Package className="h-6 w-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-500">
                        Error loading services
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        {error.message}
                    </p>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                    <div className="rounded-full p-3 bg-muted mb-4">
                        <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No services found</h3>
                    <p className="text-muted-foreground text-sm">
                        Try adjusting your search term
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
                                                <Package className="h-4 w-4" />
                                                Service Name
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4" />
                                                Store
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Price
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4" />
                                                Orders
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Revenue
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Created At
                                            </div>
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {paginatedServices.map((service) => (
                                        <tr
                                            key={service.productId}
                                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                        >
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">
                                                    {service.productName}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div>
                                                    <div className="font-medium">
                                                        {service.store
                                                            ?.storeName ||
                                                            'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {service.store?.user
                                                            ?.username || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">
                                                    {formatCurrency(
                                                        service.price || 0
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">
                                                    {service.ordersAggregate
                                                        ?.aggregate?.count || 0}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">
                                                    {formatCurrency(
                                                        service.ordersAggregate
                                                            ?.aggregate?.sum
                                                            ?.totalAmount || 0
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="text-sm">
                                                    {service.createAt
                                                        ? formatDate(
                                                              service.createAt
                                                          )
                                                        : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <button
                                                    onClick={() =>
                                                        setSelectedService(
                                                            service
                                                        )
                                                    }
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
                            total={filteredServices.length}
                            limit={limit}
                            page={page}
                            setPage={setPage}
                        />
                    </div>
                </>
            )}

            {/* Service Details Modal */}
            {selectedService && (
                <ServiceDetailsModal
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
                />
            )}
        </div>
    );
}
