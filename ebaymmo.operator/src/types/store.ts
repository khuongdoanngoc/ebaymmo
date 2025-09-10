export type FavoriteStore = {
    storeId: string;
    storeName?: string | null;
    shortDescription?: string | null;
    averageRating?: number | null;
    avatar?: string | null;
    productsAggregate?: {
        aggregate?: {
            count: number;
        } | null;
    } | null;
    wishlistsAggregate?: {
        aggregate?: {
            count: number;
        } | null;
    } | null;
};

export interface StoreRequest {
    storeId: string;
    userId: string;
    storeName: string;
    description: string;
    status: 'pending' | 'active' | 'inactive';
    createAt: string;
    phone: string;
    idCardImage: string;
    portraitPhoto: string;
    adminNotes: string;
    email: string;
    sellerName: string;
    shortDescription: string;
}
