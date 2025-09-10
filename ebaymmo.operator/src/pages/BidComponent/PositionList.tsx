import React, { useEffect } from 'react';
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
    useGetPositionQuery,
    OrderBy,
    useDeletePositionMutation,
    useUpdatePositionTimeMutation,
    useUpdatePositionMutation
} from '@/generated/graphql';
import { BidPosition } from '@/types/bid';
import BidHistoryDialog from './BidHistory';
import EditPositionDialog from './TimeDialog';
import ViewPositionDialog from './ViewPositionDialog';
import StatusModal from '@/components/StatusModal/StatusModal';

type PositionListProps = {
    onStatusChange?: (status: {
        isOpen: boolean;
        type: string;
        message: string;
    }) => void;
    activeTab: string;
};

export default function PositionList({
    onStatusChange,
    activeTab
}: PositionListProps) {
    // Local state for when parent doesn't handle status
    const [statusModal, setStatusModal] = React.useState({
        isOpen: false,
        type: '',
        message: ''
    });

    // Reset pagination when tab changes
    useEffect(() => {
        if (activeTab === 'positions') {
            const url = new URL(window.location.href);
            url.searchParams.set('page', '1');
            window.history.replaceState({}, '', url);
            setPositionPage(1);
        }
    }, [activeTab]);

    // Pagination cho positions
    const {
        page: positionPage,
        limit: positionLimit,
        setPage: setPositionPage,
        offset: positionOffset
    } = usePagination('/admin/bid-positions', 7, 1);

    // Query vị trí đấu giá
    const { data: positionsData, refetch: refetchPositions } =
        useGetPositionQuery({
            variables: {
                limit: positionLimit,
                offset: positionOffset,
                orderBy: [
                    { updateAt: OrderBy.Desc },
                    { positionName: OrderBy.Asc }
                ]
            }
        });

    useEffect(() => {
        refetchPositions();
    }, [positionPage, positionLimit, refetchPositions]);

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

    // delete position
    const [deletePosition] = useDeletePositionMutation({
        onCompleted: () => {
            refetchPositions();
            updateStatus({
                isOpen: true,
                type: 'success',
                message: 'Position deleted successfully'
            });
        },
        onError: (error) => {
            updateStatus({
                isOpen: true,
                type: 'error',
                message: error.message || 'Failed to delete position'
            });
        }
    });

    // handle delete position
    const handleDeletePosition = (id: string) => {
        if (window.confirm('Are you sure you want to delete this position?')) {
            deletePosition({
                variables: {
                    positionId: id
                }
            });
        }
    };

    const [updatePositionTime] = useUpdatePositionTimeMutation({
        onCompleted: () => {
            refetchPositions();
            updateStatus({
                isOpen: true,
                type: 'success',
                message: 'Position time updated successfully'
            });
        },
        onError: (error) => {
            updateStatus({
                isOpen: true,
                type: 'error',
                message: error.message || 'Failed to update position time'
            });
        }
    });

    const [updatePosition] = useUpdatePositionMutation({
        onCompleted: () => {
            refetchPositions();
            updateStatus({
                isOpen: true,
                type: 'success',
                message: 'Position updated successfully'
            });
        },
        onError: (error) => {
            updateStatus({
                isOpen: true,
                type: 'error',
                message: error.message || 'Failed to update position'
            });
        }
    });

    // handle update position
    const handleUpdatePosition = (data: {
        positionId: string;
        startDate: string;
        endDate: string;
        positionName: string;
        bidAmount: number;
        status: 'active' | 'pending' | 'completed';
        categoryId?: string;
    }) => {
        updatePosition({
            variables: {
                positionId: data.positionId,
                updates: {
                    startDate: new Date(data.startDate).toISOString(),
                    endDate: new Date(data.endDate).toISOString(),
                    positionName: data.positionName,
                    bidAmount: data.bidAmount,
                    status: data.status,
                    categoryId: data.categoryId,
                    updateAt: new Date().toISOString()
                }
            }
        });
    };

    const handleDialogSave = (
        id: string,
        startTime: string,
        endTime: string,
        updates: Partial<BidPosition>
    ) => {
        // Nếu chỉ cập nhật thời gian, sử dụng updatePositionTime
        if (
            Object.keys(updates).length === 0 ||
            (Object.keys(updates).length === 1 &&
                Object.prototype.hasOwnProperty.call(updates, 'startTime') &&
                Object.prototype.hasOwnProperty.call(updates, 'endTime'))
        ) {
            updatePositionTime({
                variables: {
                    positionId: id,
                    startDate: new Date(startTime).toISOString(),
                    endDate: new Date(endTime).toISOString()
                }
            });
        }
        // Nếu cập nhật nhiều thông tin, sử dụng updatePosition
        else {
            handleUpdatePosition({
                positionId: id,
                startDate: startTime,
                endDate: endTime,
                positionName: updates.name || '',
                bidAmount: updates.currentBid || 0,
                status: updates.status || 'pending'
            });
        }
    };

    const positions: BidPosition[] = React.useMemo(() => {
        if (positionsData?.positions && positionsData.positions.length > 0) {
            return positionsData.positions.map((position) => {
                const winnerStore = position.winnerStores
                    ? position.winnerStores[0]
                    : null;

                // Transform store to match the expected type - never return null
                const store = position.store
                    ? {
                          storeName:
                              position.store.storeName || 'Unnamed Store',
                          storeId: String(position.store.storeId || '')
                      }
                    : {
                          storeName: '-',
                          storeId: ''
                      };

                return {
                    id: position.positionId || '',
                    name: position.positionName || 'Unnamed Position',
                    currentBid: position.bidAmount || 0,
                    currentWinner: winnerStore ? winnerStore.toString() : null,
                    winnerStoreId: winnerStore,
                    store: store,
                    startTime: position.startDate || '',
                    endTime: position.endDate || '',
                    status:
                        (position.status as
                            | 'active'
                            | 'completed'
                            | 'pending') || 'pending',
                    bids: [],
                    category: position.category?.categoryName
                        ? { categoryName: position.category.categoryName }
                        : undefined
                };
            });
        }

        return [];
    }, [positionsData]);

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

            <div className="rounded-md border mb-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Position Name</TableHead>
                            <TableHead>Current Bid (USDT)</TableHead>
                            <TableHead>Stores Winner</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {positions?.map((position) => (
                            <TableRow key={position.id}>
                                <TableCell>
                                    {position.category?.categoryName || '-'}
                                </TableCell>
                                <TableCell>{position.name}</TableCell>
                                <TableCell>{position.currentBid}</TableCell>
                                <TableCell>
                                    {position.store.storeName || '-'}
                                </TableCell>
                                <TableCell>
                                    {new Date(
                                        position.startTime
                                    ).toLocaleString('vi-VN', {
                                        timeZone: 'Asia/Ho_Chi_Minh',
                                        hour12: false,
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </TableCell>
                                <TableCell>
                                    {new Date(position.endTime).toLocaleString(
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
                                            position.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : position.status === 'pending'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {position.status}
                                    </span>
                                </TableCell>

                                <TableCell>
                                    <div className="flex space-x-2">
                                        <ViewPositionDialog
                                            position={position}
                                        />
                                        <EditPositionDialog
                                            position={position}
                                            onSave={handleDialogSave}
                                        />
                                        <BidHistoryDialog
                                            positionId={position.id}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                            onClick={() =>
                                                handleDeletePosition(
                                                    position.id
                                                )
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination cho positions */}
            <div className="mt-4 flex justify-center">
                <Pagination
                    total={
                        positionsData?.positionsAggregate.aggregate?.count || 0
                    }
                    limit={positionLimit}
                    page={positionPage}
                    setPage={setPositionPage}
                />
            </div>
        </>
    );
}
