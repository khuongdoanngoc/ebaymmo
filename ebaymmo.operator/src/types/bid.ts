export interface BidPosition {
    id: string;
    name: string;
    currentBid: number;
    currentWinner: string | null;
    winnerStoreId: string | null;
    store: {
        storeName: string;
        storeId: string;
    };
    startTime: string;
    endTime: string;
    status: 'active' | 'completed' | 'pending';
    bids: {
        id: string;
        storeId: string;
        storeName: string;
        bidAmount: number;
        bidDate: string;
        status: string;
    }[];
    category?: {
        categoryName: string;
    };
}

export interface Store {
    id: string;
    name: string;
}

export interface Bid {
    bidId: string;
    positionId: string;
    bidAmount: number;
    bidDate: string;
    bidStatus: 'active' | 'completed';
    createAt: string;
    position?: {
        positionName?: string;
        bidAmount?: number;
        description?: string;
    };
    store?: {
        storeName?: string;
    };
}
