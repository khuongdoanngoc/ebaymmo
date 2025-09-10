import { useSubscription, useMutation, gql } from '@apollo/client';

// Types
interface Store {
    store_id: string;
    store_name: string;
}

interface Bid {
    bid_id: string;
    bid_amount: number;
    store: Store;
    create_at: string;
    bid_status: string;
}

interface Position {
    position_id: string;
    position_name: string;
    status: string;
    start_date: string;
    end_date: string;
    winner_stores: string | null;
    highest_bid?: Bid; // Bid cao nhất hiện tại
    bids: Bid[]; // Lịch sử các bid
}

// GraphQL Subscriptions
const POSITION_WITH_BIDS_SUBSCRIPTION = gql`
    subscription WatchPositionWithBids($positionId: uuid!) {
        positionsByPk(positionId: $positionId) {
            positionId
            positionName
            status
            startDate
            endDate
            winnerStores
            # Lấy bid cao nhất (active)
            bids(
                where: { bidStatus: { _eq: "active" } }
                orderBy: { bidAmount: DESC }
                limit: 1
            ) {
                bidId
                bidAmount
                bidStatus
                createAt
                store {
                    storeId
                    storeName
                }
            }
            # Lấy lịch sử bid gần đây
            recent_bids: bids(orderBy: { createAt: DESC }, limit: 10) {
                bidId
                bidAmount
                bidStatus
                createAt
                store {
                    storeId
                    storeName
                }
            }
        }
    }
`;

// Mutation để đặt bid
const PLACE_BID_MUTATION = gql`
    mutation PlaceBid($input: PlaceBidInput!) {
        placeBid(input: $input) {
            bid_id
            bid_amount
            bid_status
        }
    }
`;

export const useAuctionSDK = (positionId: string) => {
    // Subscribe to position and bids
    const { data, loading, error } = useSubscription<{
        positions_by_pk: Position & {
            bids: Bid[]; // Highest bid
            recent_bids: Bid[]; // Recent bids history
        };
    }>(POSITION_WITH_BIDS_SUBSCRIPTION, {
        variables: { positionId },
        // Có thể thêm shouldResubscribe nếu cần
        shouldResubscribe: true
    });

    // Place bid mutation
    const [placeBidMutation] = useMutation(PLACE_BID_MUTATION);

    // Transform data
    const position = data?.positions_by_pk
        ? {
              ...data.positions_by_pk,
              highest_bid: data.positions_by_pk.bids[0], // Bid cao nhất (active)
              bids: data.positions_by_pk.recent_bids // Lịch sử bid
          }
        : null;

    // Kiểm tra xem đấu giá đã kết thúc chưa
    const isExpired = position?.end_date
        ? new Date(position.end_date) <= new Date()
        : false;

    // Handle place bid
    const placeBid = async (storeId: string, bidAmount: number) => {
        if (!position) throw new Error('Position not found');
        if (isExpired) throw new Error('Auction has ended');

        // Validate bid amount
        const minBidAmount = position.highest_bid
            ? position.highest_bid.bid_amount * 1.1 // Tăng ít nhất 10%
            : 0;

        if (bidAmount <= minBidAmount) {
            throw new Error(`Bid amount must be at least ${minBidAmount}`);
        }

        try {
            const result = await placeBidMutation({
                variables: {
                    input: {
                        position_id: positionId,
                        store_id: storeId,
                        bid_amount: bidAmount
                    }
                }
            });

            return result.data.placeBid;
        } catch (error) {
            console.error('Error placing bid:', error);
            throw error;
        }
    };

    return {
        position,
        isLoading: loading,
        error,
        isExpired,
        placeBid,
        // Computed values
        highestBid: position?.highest_bid,
        recentBids: position?.bids || [],
        canBid: !isExpired && position?.status === 'active'
    };
};
