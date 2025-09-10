import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useGetCategoriesQuery,
    OrderBy,
    useCreatePositionMutation,
    useGetPositionQuery,
    useCreateBidMutation
} from '@/generated/graphql';
import StatusModal from '@/components/StatusModal/StatusModal';
import PositionList from './BidComponent/PositionList';
import BidsList from './BidComponent/BidsList';
import AddItemDialog from './BidComponent/AddItemDialog';

export default function BidPositions() {
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: '',
        message: ''
    });

    const [activeTab, setActiveTab] = useState('positions');
    const [reloadKey, setReloadKey] = useState(0);

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Reset page to 1 when changing tabs
        const url = new URL(window.location.href);
        url.searchParams.set('page', '1');
        window.history.replaceState({}, '', url);
        // Force re-render by updating reloadKey
        setReloadKey((prev) => prev + 1);
    };

    // Query các dữ liệu cần thiết cho cả hai tab
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

    const { data: positionsData } = useGetPositionQuery({
        variables: {
            limit: 1000,
            offset: 0,
            orderBy: [{ positionName: OrderBy.Asc }],
            where: {
                status: {
                    _eq: 'active'
                }
            }
        }
    });
    // create position
    const [createPosition] = useCreatePositionMutation({
        onCompleted: () => {
            setStatusModal({
                isOpen: true,
                type: 'success',
                message: 'New position created successfully'
            });
        },
        onError: (error) => {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: error.message || 'Failed to create new position'
            });
        }
    });
    // create bid
    const [createBid] = useCreateBidMutation({
        onCompleted: () => {
            setStatusModal({
                isOpen: true,
                type: 'success',
                message: 'Bid created successfully'
            });
        },
        onError: (error) => {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: error.message || 'Failed to create bid'
            });
        }
    });
    // Handle create position
    const handleCreatePosition = (data: {
        positionName: string;
        description: string;
        bidAmount: number;
        startDate: string;
        endDate: string;
        status: 'active' | 'pending' | 'completed';
        categoryId?: string;
        storeId?: string;
    }) => {
        createPosition({
            variables: {
                object: {
                    positionName: data.positionName,
                    description: data.description,
                    bidAmount: data.bidAmount,
                    startDate: new Date(data.startDate).toISOString(),
                    endDate: new Date(data.endDate).toISOString(),
                    status: data.status,
                    categoryId: data.categoryId,
                    createAt: new Date().toISOString(),
                    updateAt: new Date().toISOString()
                }
            }
        });
    };
    // Handle create bid
    const handleCreateBid = (data: {
        positionId: string;
        bidAmount: number;
        bidStatus: 'active' | 'outbid' | 'won' | 'rejected';
        bidDate: string;
    }) => {
        createBid({
            variables: {
                object: {
                    positionId: data.positionId,
                    bidAmount: data.bidAmount,
                    bidStatus: data.bidStatus,
                    bidDate: data.bidDate,
                    createAt: new Date(data.bidDate).toISOString(),
                    updateAt: new Date().toISOString()
                }
            }
        });
    };

    const closeStatusModal = () => {
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
    };

    // Handle status changes from child components
    const handleStatusChange = (status: {
        isOpen: boolean;
        type: string;
        message: string;
    }) => {
        setStatusModal(status);
    };

    // Chuẩn bị dữ liệu cho AddItemDialog
    const positions = positionsData?.positions
        ? positionsData.positions.map((p) => ({
              positionId: p.positionId || '',
              description: p.description || 'Unnamed Position',
              bidAmount: p.bidAmount || 0
          }))
        : [];

    return (
        <div className="p-6">
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Bid Management</h1>
                <AddItemDialog
                    type={activeTab === 'positions' ? 'position' : 'bid'}
                    onSave={(data) => {
                        if (activeTab === 'positions') {
                            handleCreatePosition(data as any);
                        } else {
                            handleCreateBid(data as any);
                        }
                    }}
                    buttonText={
                        activeTab === 'positions' ? 'Add Position' : 'Add Bid'
                    }
                    categories={(categoriesData?.categories || []).map(
                        (cat) => ({
                            categoryId: String(cat.categoryId || ''),
                            categoryName: cat.categoryName || 'Unnamed Category'
                        })
                    )}
                    positions={positions}
                />
            </div>

            {/* Tabs */}
            <Tabs
                defaultValue="positions"
                value={activeTab}
                onValueChange={handleTabChange}
                className="mb-6"
            >
                <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                    <TabsTrigger value="bids">Bids</TabsTrigger>
                </TabsList>

                {/* Tab Positions */}
                <TabsContent value="positions">
                    <PositionList
                        key={`positions-${reloadKey}`}
                        onStatusChange={handleStatusChange}
                        activeTab={activeTab}
                    />
                </TabsContent>

                {/* Tab Bids */}
                <TabsContent value="bids">
                    <BidsList
                        key={`bids-${reloadKey}`}
                        onStatusChange={handleStatusChange}
                        activeTab={activeTab}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
