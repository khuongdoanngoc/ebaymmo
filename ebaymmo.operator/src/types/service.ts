export interface Service {
    __typename?: 'Products';
    productId: string;
    productName?: string | null;
    price?: number;
    createAt?: string;
    updateAt?: string;
    store?: {
        __typename?: 'Stores';
        storeId: string;
        storeName?: string | null;
        user?: {
            __typename?: 'Users';
            userId: string;
            username?: string | null;
            email?: string | null;
        } | null;
    } | null;
    ordersAggregate?: {
        aggregate?: {
            count?: number;
            sum?: {
                totalAmount?: number;
            } | null;
        } | null;
    } | null;
    productItemsAggregate?: {
        aggregate?: {
            count?: number;
        } | null;
    } | null;
}
