import { useGetStoreReviewQuery } from '@/generated/graphql';
import usePagination from '@/hooks/usePagination';
import Rating from '../Rating';
import Pagination from '../BaseUI/Pagination/Pagination';

interface StoreReviewProps {
    storeId: string;
    slug?: string;
}

export default function StoreReview({ storeId, slug }: StoreReviewProps) {
    const { page, limit, setPage, offset } = usePagination(
        `/products/${slug}`,
        5
    );
    const { data: reviewData } = useGetStoreReviewQuery({
        variables: {
            limit,
            offset,
            where: {
                storeId: { _eq: storeId }
            }
        }
    });
    const storeReviews =
        reviewData?.storeRatings?.map((review) => ({
            rating_id: review.ratingId,
            full_name: review.user?.username || '',
            avatar: review.user?.images || '',
            rating: review.rating || 0,
            review: review.review || '',
            images: [],
            update_at: review.updateAt,
            ratingDate: review.createAt,
            response: review.response,
            storeName: review.store?.user?.username || '',
            storeAvatar: review.store?.user?.images || ''
        })) || [];
    const totalReviews =
        reviewData?.storeRatingsAggregate?.aggregate?.count || 0;

    return (
        <div className="p-[20px] md:p-[40px] rounded-[16px] bg-neutral-75 backdrop-blur-[2px]">
            {storeReviews.map((rate) => (
                <Rating
                    key={rate.rating_id}
                    rating_id={rate.rating_id}
                    full_name={rate.full_name}
                    rating={rate.rating}
                    avatar={rate.avatar}
                    review={rate.review}
                    images={rate.images}
                    update_at={new Date(rate.update_at).toLocaleDateString(
                        'en-US'
                    )}
                    ratingDate={new Date(rate.ratingDate).toLocaleDateString(
                        'en-US'
                    )}
                    response={rate.response}
                    storeName={rate.storeName}
                    storeAvatar={rate.storeAvatar}
                />
            ))}
            {totalReviews > 0 && (
                <Pagination
                    page={page}
                    limit={limit}
                    setPage={setPage}
                    total={totalReviews}
                />
            )}
        </div>
    );
}
