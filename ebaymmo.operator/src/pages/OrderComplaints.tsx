import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    OrderBy,
    useGetOrderComplaintSubscription,
    useUpdateOrderStatusMutation
} from '@/generated/graphql';
import { OrderComplaint } from '@/types/order';
import ComplaintDialog from '@/pages/OrderComplaintComponent/ComplaintDialog';
import Pagination from '@/components/Pagination';
import usePagination from '@/hooks/usePagination';
import showStatusModal from '@/components/StatusModal';
import ResolveChatModal from '@/pages/OrderComplaintComponent/ResolveChatModal';
import { useUpdateComplainMutation } from '@/generated/graphql';

export default function OrderComplaints() {
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'complained' | 'dispute'
    >('all');

    const { page, limit, setPage, offset } = usePagination(
        '/admin/order-complaints',
        7,
        1
    );

    const { data } = useGetOrderComplaintSubscription({
        variables: {
            limit: limit,
            offset: offset,
            orderBy: [{ updateAt: OrderBy.Desc }, { orderCode: OrderBy.Asc }],
            where: {
                _or: [
                    {
                        orderStatus: {
                            _eq: 'complained'
                        }
                    },
                    {
                        orderStatus: {
                            _eq: 'dispute'
                        }
                    }
                ]
            }
        }
    });

    const totalOrders = Math.ceil(data?.orders.length || 0);

    const [updateOrderStatus] = useUpdateOrderStatusMutation();
    const [updateComplain] = useUpdateComplainMutation();

    const handleResolve = (id: string) => {
        updateOrderStatus({
            variables: {
                orderId: id,
                status: 'completed'
            }
        })
            .then(() => {
                showStatusModal({
                    type: 'success',
                    message: 'Complaint has been resolved successfully',
                    isOpen: true
                });
            })
            .catch((error) => {
                showStatusModal({
                    type: 'error',
                    message: error.message || 'Failed to resolve complaint',
                    isOpen: true
                });
            });
        updateComplain({
            variables: {
                where: {
                    orderId: {
                        _eq: id
                    }
                },
                _set: {
                    status: 'resolved'
                }
            }
        });
    };

    const handleReject = (id: string) => {
        updateOrderStatus({
            variables: {
                orderId: id,
                status: 'cancel'
            }
        })
            .then(() => {
                showStatusModal({
                    type: 'success',
                    message: 'Complaint has been rejected successfully',
                    isOpen: true
                });
            })
            .catch((error) => {
                showStatusModal({
                    type: 'error',
                    message: error.message || 'Failed to reject complaint',
                    isOpen: true
                });
            });
        updateComplain({
            variables: {
                where: {
                    orderId: {
                        _eq: id
                    }
                },
                _set: {
                    status: 'resolved'
                }
            }
        });
    };

    const handleCreateChat = () => {
        showStatusModal({
            type: 'success',
            message: 'Group chat created successfully',
            isOpen: true
        });
    };

    const filteredComplaints = data?.orders?.filter(
        (order) => statusFilter === 'all' || order.orderStatus === statusFilter
    );

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Order Complaints</h1>

            <div className="flex mb-6">
                <Select
                    value={statusFilter}
                    onValueChange={(value: any) => setStatusFilter(value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Complaints</SelectItem>
                        <SelectItem value="complained">Complained</SelectItem>
                        <SelectItem value="dispute">Dispute</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order Code</TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredComplaints?.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-4"
                                >
                                    No complaints found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredComplaints?.map((complaint) => (
                                <TableRow key={complaint.orderId}>
                                    <TableCell>{complaint.orderCode}</TableCell>
                                    <TableCell>
                                        {complaint.user?.username}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {complaint.product?.productName}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            complaint.createAt
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                complaint.orderStatus ===
                                                'complained'
                                                    ? 'bg-green-100 text-green-800'
                                                    : complaint.orderStatus ===
                                                        'dispute'
                                                      ? 'bg-yellow-100 text-yellow-800'
                                                      : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {complaint.orderStatus}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {/* complained , dispute */}
                                        {complaint.orderStatus === 'dispute' ? (
                                            <div className="flex gap-2">
                                                <ComplaintDialog
                                                    complaint={
                                                        complaint as OrderComplaint
                                                    }
                                                    onResolve={handleResolve}
                                                    onReject={handleReject}
                                                />
                                                <ResolveChatModal
                                                    complaint={
                                                        complaint as OrderComplaint
                                                    }
                                                    onCreateChat={
                                                        handleCreateChat
                                                    }
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">
                                                {complaint.orderStatus ===
                                                'successed'
                                                    ? 'completed'
                                                    : 'pending'}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex justify-center">
                <Pagination
                    total={totalOrders}
                    limit={limit}
                    page={page}
                    setPage={setPage}
                />
            </div>
        </div>
    );
}
