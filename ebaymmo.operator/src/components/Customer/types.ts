// Định nghĩa đối tượng cửa hàng
export interface Store {
    storeId: string;
    storeName?: string | null;
    category?: {
        categoryName: string;
    };
    status?: string;
}

// Định nghĩa đối tượng liên kết reseller-seller
export interface ResellerConnection {
    sellerUserName: string;
    sellerName: string;
    storeId: string;
    storeName: string;
    commissionRate: number; // Tỷ lệ hoa hồng %
    startDate: string;
}

// Định nghĩa các kiểu khách hàng
export type CustomerType = 'user' | 'seller' | 'reseller';

export interface Customer {
    username: string;
    name: string;
    email: string;
    orders: number;
    totalSpent: number;
    sellerSince: string;
    status: 'active' | 'suspended' | 'banned';
    role: 'seller' | 'user';
    // Thông tin dành cho seller
    stores?: Store[];
    // Thông tin dành cho reseller
    resellerConnections?: ResellerConnection[];
}

// Add these type definitions after the existing interfaces
export type ActionType = 'activated' | 'suspended';
export type StoreAction = { type: ActionType; storeId: string };
export type CustomerAction = {
    type: ActionType;
    userId: string;
    storeAction?: StoreAction;
};

export type StatusFilter = 'all' | 'active' | 'suspended' | 'banned';
