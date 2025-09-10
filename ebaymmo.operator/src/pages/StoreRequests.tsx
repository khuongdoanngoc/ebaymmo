import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { toast } from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    OrderBy,
    useGetStoreSubscription,
    useUpdateStoreMutation
} from '@/generated/graphql';
import { ReviewDialog } from '@/components/StoreRequest/ReviewDialog';
import { StoreRequest } from '@/types/store';
import SellerRequest from './SellerRequest';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';

export default function StoreRequests() {
    const [activeTab, setActiveTab] = React.useState('store-requests');
    const [updateStore] = useUpdateStoreMutation();

    const { page, limit, setPage, offset } = usePagination(
        '/admin/store-requests',
        7,
        1
    );

    const { data: pendingStoreRequests } = useGetStoreSubscription({
        variables: {
            limit: limit,
            offset: offset,
            orderBy: { status: OrderBy.Asc },
            where: { status: { _eq: 'pending' } }
        },
        fetchPolicy: 'network-only'
    });

    const totalOrders = Math.ceil(pendingStoreRequests?.stores.length || 0);

    const handleStoreApproval = async (id: string) => {
        try {
            await updateStore({
                variables: {
                    _set: { status: 'active' },
                    where: { storeId: { _eq: id } }
                }
            });
            toast.success('Store request has been approved');
        } catch (error) {
            console.error('Error processing store approval:', error);
            toast.error('Failed to process store approval');
        }
    };

    const handleStoreRejection = async (id: string) => {
        try {
            await updateStore({
                variables: {
                    _set: { status: 'inactive' },
                    where: { storeId: { _eq: id } }
                }
            });
            toast.success('Store request has been rejected');
        } catch (error) {
            console.error('Error processing store rejection:', error);
            toast.error('Failed to process store rejection');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Manage Requests</h1>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
            >
                <TabsList>
                    <TabsTrigger value="store-requests">
                        Store Requests
                    </TabsTrigger>
                    <TabsTrigger value="seller-requests">
                        Seller Requests
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="store-requests" className="mt-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Store Name</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingStoreRequests?.stores.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center py-4"
                                        >
                                            No store requests found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pendingStoreRequests?.stores.map(
                                        (request) => (
                                            <TableRow key={request.storeId}>
                                                <TableCell>
                                                    {request.storeName}
                                                </TableCell>
                                                <TableCell>
                                                    {request.seller?.username}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        {request.seller?.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        request.createAt
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            request.status ===
                                                            'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : request.status ===
                                                                    'approved'
                                                                  ? 'bg-green-100 text-green-800'
                                                                  : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {request.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {request.status ===
                                                    'pending' ? (
                                                        <ReviewDialog
                                                            request={
                                                                request as unknown as StoreRequest
                                                            }
                                                            onApprove={
                                                                handleStoreApproval
                                                            }
                                                            onReject={
                                                                handleStoreRejection
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-500">
                                                            {request.status ===
                                                            'approved'
                                                                ? 'Approved'
                                                                : 'Rejected'}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="seller-requests" className="mt-4">
                    <SellerRequest />
                </TabsContent>
            </Tabs>
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
