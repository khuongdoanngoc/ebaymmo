import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Service } from '@/types/service';
import { formatCurrency } from '@/utils/formatCurrency';
interface ServiceDetailsModalProps {
    service: Service | null;
    onClose: () => void;
}

export function ServiceDetailsModal({
    service,
    onClose
}: ServiceDetailsModalProps) {
    if (!service) return null;

    // Format date
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Service Details</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Service Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Service Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Service Name
                                    </p>
                                    <p className="font-medium">
                                        {service.productName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Price
                                    </p>
                                    <p className="font-medium">
                                        {formatCurrency(service.price || 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Created At
                                    </p>
                                    <p className="font-medium">
                                        {service.createAt
                                            ? formatDate(service.createAt)
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Last Updated
                                    </p>
                                    <p className="font-medium">
                                        {service.updateAt
                                            ? formatDate(service.updateAt)
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Store Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Store Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Store Name
                                    </p>
                                    <p className="font-medium">
                                        {service.store?.storeName || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Store ID
                                    </p>
                                    <p className="font-medium">
                                        {service.store?.storeId || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Store Owner Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Store Owner
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Username
                                    </p>
                                    <p className="font-medium">
                                        {service.store?.user?.username || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Email
                                    </p>
                                    <p className="font-medium">
                                        {service.store?.user?.email || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        User ID
                                    </p>
                                    <p className="font-medium">
                                        {service.store?.user?.userId || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Performance Metrics
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Total Orders
                                    </p>
                                    <p className="font-medium">
                                        {service.ordersAggregate?.aggregate
                                            ?.count || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Total Revenue
                                    </p>
                                    <p className="font-medium">
                                        {formatCurrency(
                                            service.ordersAggregate?.aggregate
                                                ?.sum?.totalAmount || 0
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Product Items
                                    </p>
                                    <p className="font-medium">
                                        {service.productItemsAggregate
                                            ?.aggregate?.count || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
