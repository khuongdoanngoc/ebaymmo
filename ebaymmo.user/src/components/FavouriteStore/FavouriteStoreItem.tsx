import FavouriteStoreImage from './FavouriteStoreImage';
import FavouriteStoreContent from './FavouriteStoreContent';

interface Store {
    __typename?: string; // Add this if needed
    avatar?: string;
    averageRating?: number;
    category: {
        type?: string;
    };
    slug?: string;
    ratingTotal?: number;
    storeId?: string;
    storeName?: string;
    storePrice?: string;
    totalStockCount: number;
    totalSoldCount: number;
    storeTag?: string;
    subTitle?: string;
    threeStar?: number;
    twoStar?: number;
}

interface FavouriteStoreItemProps {
    store?: Store;
    loading?: boolean;
}

export default function FavouriteStoreItem({
    store,
    loading
}: FavouriteStoreItemProps) {
    const onFavoriteClick = () => {
        alert('Favorite clicked');
    };

    if (!store) return null;
    if (loading) return <h2>loading</h2>;

    return (
        <div className="flex flex-col lg:flex-row items-start self-stretch gap-[20px] lg:w-auto h-auto">
            <FavouriteStoreImage
                avatar={store.avatar ?? '/images/facebookproduct.png'}
                type={store?.category?.type ?? 'Product'}
                storeName={store.storeName ?? 'Guest'}
                isFavorite={true}
                storeId={store.storeId ?? '0'}
                slug={store.slug}
                onFavoriteClick={onFavoriteClick}
                loading={loading}
            />
            <FavouriteStoreContent store={store} />
        </div>
    );
}
