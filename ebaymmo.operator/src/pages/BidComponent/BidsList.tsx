import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';
import usePagination from '@/hooks/usePagination';
import {
    useGetBidsQuery,
    useUpdateBidMutation,
    useDeleteBidMutation
} from '@/generated/graphql';
import StatusModal from '@/components/StatusModal/StatusModal';
import EditBidDialog from './EditBidDialog';
import { Eye, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

type BidsListProps = {
    onStatusChange?: (status: {
        isOpen: boolean;
        type: string;
        message: string;
    }) => void;
    activeTab: string;
};

export default function BidsList({ onStatusChange, activeTab }: BidsListProps) {
    const pageParam = new URLSearchParams(window.location.search).get('page');

    // Local state for when parent doesn't handle status
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: '',
        message: ''
    });

    // State for viewing bid details
    const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    // Pagination for bids
    const {
        page: bidPage,
        limit: bidLimit,
        setPage: setBidPage
    } = usePagination(
        '/admin/bid-positions',
        7,
        pageParam ? parseInt(pageParam) : 1
    );

    // Reset pagination when tab changes
    useEffect(() => {
        if (activeTab === 'bids') {
            const url = new URL(window.location.href);
            url.searchParams.set('page', '1');
            window.history.replaceState({}, '', url);
            setBidPage(1);
        }
    }, [activeTab]);

    // Query danh sách đặt giá
    const { data: bidsData, refetch: refetchBids } = useGetBidsQuery({
        variables: {
            limit: bidLimit,
            offset: (bidPage - 1) * bidLimit
        }
    });

    useEffect(() => {
        refetchBids();
    }, [bidPage, bidLimit, refetchBids]);

    const totalBids = bidsData?.bidsAggregate.aggregate?.count || 0;
    //console.log('totalBids', totalBids);

    // Hiển thị status - dùng callback từ cha hoặc state nội bộ
    const updateStatus = (status: {
        isOpen: boolean;
        type: string;
        message: string;
    }) => {
        if (onStatusChange) {
            onStatusChange(status);
        } else {
            setStatusModal(status);
        }
    };

    const closeStatusModal = () => {
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
    };

    // Function to handle viewing bid details
    const handleViewBidDetails = (bidId: string) => {
        setSelectedBidId(bidId);
        setViewDialogOpen(true);
    };

    // Find the selected bid
    const selectedBid = selectedBidId
        ? bidsData?.bids.find((bid) => bid.bidId === selectedBidId)
        : null;

    // Update bid mutation
    const [updateBid] = useUpdateBidMutation({
        onCompleted: () => {
            refetchBids();
            updateStatus({
                isOpen: true,
                type: 'success',
                message: 'Bid updated successfully'
            });
        },
        onError: (error) => {
            updateStatus({
                isOpen: true,
                type: 'error',
                message: error.message || 'Failed to update bid'
            });
        }
    });

    // Handle update bid
    const handleUpdateBid = (data: {
        bidId: string;
        bidAmount: number;
        bidStatus: 'active' | 'completed';
        bidDate: string;
        description?: string;
    }) => {
        // Format lại ngày tháng theo định dạng PostgreSQL timestamptz
        // Format: '2025-04-07T01:30:00.01691+00:00'
        const date = new Date(data.bidDate);
        const isoString = date.toISOString();
        const formattedBidDate = isoString.replace('Z', '+00:00');

        console.log('Updating bidDate:', formattedBidDate); // Debug log

        updateBid({
            variables: {
                bidId: data.bidId,
                updates: {
                    bidAmount: data.bidAmount,
                    bidStatus: data.bidStatus,
                    bidDate: formattedBidDate,
                    updateAt: new Date().toISOString()
                }
            }
        });
    };

    // Delete bid mutation
    const [deleteBid] = useDeleteBidMutation({
        onCompleted: () => {
            refetchBids();
            updateStatus({
                isOpen: true,
                type: 'success',
                message: 'Bid deleted successfully'
            });
        },
        onError: (error) => {
            updateStatus({
                isOpen: true,
                type: 'error',
                message: error.message || 'Failed to delete bid'
            });
        }
    });

    // Handle delete bid
    const handleDeleteBid = (bidId: string) => {
        if (window.confirm('Are you sure you want to delete this bid?')) {
            deleteBid({
                variables: {
                    bidId
                }
            });
        }
    };

    return (
        <>
            {/* Hiển thị StatusModal nếu không có onStatusChange */}
            {!onStatusChange && (
                <StatusModal
                    isOpen={statusModal.isOpen}
                    type={
                        statusModal.type as
                            | 'success'
                            | 'error'
                            | 'loading'
                            | 'warning'
                    }
                    message={statusModal.message}
                    onClose={closeStatusModal}
                />
            )}

            {/* View Bid Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bid Details</DialogTitle>
                    </DialogHeader>
                    {selectedBid && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Bid ID
                                    </p>
                                    <p>{selectedBid.bidId}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Position
                                    </p>
                                    <p>
                                        {selectedBid.position?.positionName ||
                                            'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Bid Amount
                                    </p>
                                    <p>{selectedBid.bidAmount} USDT</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Status
                                    </p>
                                    <p
                                        className={`${
                                            selectedBid.bidStatus === 'active'
                                                ? 'text-green-600'
                                                : selectedBid.bidStatus ===
                                                    'outbid'
                                                  ? 'text-yellow-600'
                                                  : selectedBid.bidStatus ===
                                                      'won'
                                                    ? 'text-blue-600'
                                                    : 'text-gray-600'
                                        }`}
                                    >
                                        {selectedBid.bidStatus}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Bid Date
                                </p>
                                <p>
                                    {new Date(
                                        selectedBid.bidDate
                                    ).toLocaleString('vi-VN', {
                                        timeZone: 'Asia/Ho_Chi_Minh',
                                        hour12: false,
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Description
                                </p>
                                <p>
                                    {selectedBid.position?.description ||
                                        'No description'}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button onClick={() => setViewDialogOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border mb-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Position</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Bid Amount (USDT)</TableHead>
                            <TableHead>Bid Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bidsData?.bids?.map((bid) => (
                            <TableRow key={bid.bidId}>
                                <TableCell>
                                    {bid.position?.positionName || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {bid.position?.description || 'N/A'}
                                </TableCell>
                                <TableCell>{bid.bidAmount}</TableCell>
                                <TableCell>
                                    {new Date(bid.bidDate).toLocaleString(
                                        'vi-VN',
                                        {
                                            timeZone: 'Asia/Ho_Chi_Minh',
                                            hour12: false,
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            bid.bidStatus === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : bid.bidStatus === 'outbid'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : bid.bidStatus === 'won'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {bid.bidStatus}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleViewBidDetails(bid.bidId)
                                            }
                                        >
                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                            View
                                        </Button>
                                        <EditBidDialog
                                            bid={{
                                                bidId: bid.bidId,
                                                positionId:
                                                    bid.positionId || '',
                                                bidDate: bid.bidDate,
                                                bidAmount: bid.bidAmount || 0,
                                                bidStatus:
                                                    (bid.bidStatus as
                                                        | 'active'
                                                        | 'completed') ||
                                                    'active',
                                                createAt:
                                                    bid.createAt ||
                                                    new Date().toISOString(),
                                                position: bid.position
                                                    ? {
                                                          description:
                                                              bid.position
                                                                  .description ||
                                                              undefined,
                                                          positionName:
                                                              bid.position
                                                                  .positionName ||
                                                              undefined,
                                                          bidAmount:
                                                              bid.position
                                                                  .bidAmount ||
                                                              undefined
                                                      }
                                                    : undefined
                                            }}
                                            onSave={handleUpdateBid}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                            onClick={() =>
                                                handleDeleteBid(bid.bidId)
                                            }
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination cho bids */}
            <div className="mt-4 flex justify-center">
                <Pagination
                    total={totalBids || 0}
                    limit={bidLimit}
                    page={bidPage}
                    setPage={(newPage) => {
                        setBidPage(newPage);
                        // Update URL with new page
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', newPage.toString());
                        window.history.pushState({}, '', url);
                    }}
                />
            </div>
        </>
    );
}
