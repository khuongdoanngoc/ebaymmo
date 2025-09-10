import { X } from 'lucide-react';
import { format } from 'date-fns';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/utils/formatCurrency';

interface OrderDetailsModalProps {
    order: Order | null;
    onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Order Details</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Order Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Order Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Order Code
                                    </p>
                                    <p className="font-medium">
                                        {order.orderCode}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Order Date
                                    </p>
                                    <p className="font-medium">
                                        {format(
                                            new Date(order.orderDate),
                                            'dd/MM/yyyy HH:mm'
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Total Amount
                                    </p>
                                    <p className="font-medium">
                                        {formatCurrency(order.totalAmount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Status
                                    </p>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            order.orderStatus === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : order.orderStatus ===
                                                    'successed'
                                                  ? 'bg-green-100 text-green-800'
                                                  : order.orderStatus ===
                                                      'complained'
                                                    ? 'bg-red-100 text-red-800'
                                                    : order.orderStatus ===
                                                        'refunded'
                                                      ? 'bg-purple-100 text-purple-800'
                                                      : 'bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        {order.orderStatus
                                            .charAt(0)
                                            .toUpperCase() +
                                            order.orderStatus.slice(1)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Pre-order
                                    </p>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            order.isPreOrder
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        {order.isPreOrder ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Customer Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Full Name
                                    </p>
                                    <p className="font-medium">
                                        {order.user.fullName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Username
                                    </p>
                                    <p className="font-medium">
                                        {order.user.username}
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
