'use client';
import SortableHeader from '@/components/Sort/SortableHeader';
import { useMemo, useState, useEffect } from 'react';
import Review from '@/components/Review/Review';
import Response from '@/components/Response/Response';
import {
    useGetStoreManagementListQuery,
    useGetStoreRatingsForSellerQuery
} from '@/generated/graphql';
import usePagination from '@/hooks/usePagination';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/BaseUI/Pagination';
import { TableSkeleton } from '@/components/BaseUI/SkeletonTable/SkeletonTable';
import { OrderBy } from '@/generated/graphql-request';
import { formatDate } from '@/utils/formatDate';
import { useTranslations } from 'next-intl';

interface Column {
    key: string;
    title: string;
}

interface StoreData {
    id: number;
    orderCode: string;
    store: string;
    creationDate: string;
    comment: string;
    reply: string;
    rating: number;
}

// Component Star riêng biệt
const Star = ({ filled }: { filled: boolean }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 576 512"
        className={`w-4 h-4 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
    >
        <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
    </svg>
);

// Component StarRating
const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex">
            {[...Array(5)].map((_, index) => (
                <Star key={index} filled={index < rating} />
            ))}
        </div>
    );
};

export default function Reviews() {
    const t = useTranslations('seller.reviews');
    const [isOpenModalReview, setIsOpenModalReview] = useState(false);
    const [isOpenModalResponse, setIsOpenModalResponse] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StoreData | null>(null);
    const [sortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc' | null;
    }>({ key: '', direction: null });

    // Add authentication check
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            setIsAuthenticated(true);
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Add pagination
    const { limit, setPage, page } = usePagination('/seller/reviews', 5, 1);

    const { data: storeData, loading: storeLoading } =
        useGetStoreManagementListQuery({
            variables: {
                sellerId: userId
            },
            skip: !userId
        });

    const storeIds = useMemo(() => {
        if (!storeData?.stores || storeData.stores.length === 0) return [];
        return storeData.stores.map((store) => store.storeId);
    }, [storeData]);

    const { data, loading, error, refetch } = useGetStoreRatingsForSellerQuery({
        variables: {
            storeIds: storeIds,
            limit,
            offset: (page - 1) * limit,
            orderBy: [
                {
                    ratingDate: OrderBy.Desc
                }
            ]
        },
        skip: storeIds.length === 0 || storeLoading
    });

    const totalCount = useMemo(
        () => data?.storeRatingsAggregate?.aggregate?.count || 0,
        [data?.storeRatingsAggregate?.aggregate?.count]
    );

    const handleResponseSuccess = () => {
        refetch();
        setIsOpenModalResponse(false);
        setSelectedItem(null);
    };
    // Transform the data
    const storeRatings: StoreData[] =
        data?.storeRatings.map((rating) => ({
            id: rating.ratingId,
            ratingId: rating.ratingId,
            fullName: rating.user?.fullName ?? '',
            username: rating.user?.username ?? '',
            orderCode: `#${rating.ratingId}`,
            storeId: rating.storeId,
            store: rating.store?.storeName ?? '',
            creationDate: formatDate(new Date(rating.ratingDate)),
            comment: t('table.viewComment'),
            reply: t('table.reply'),
            rating: rating.rating ?? 0,
            review: rating.review ?? 'No review'
        })) || [];

    const columns: Column[] = [
        { key: 'OrderCode', title: t('table.orderCode') },
        { key: 'Store', title: t('table.store') },
        { key: 'CreationDate', title: t('table.creationDate') },
        { key: 'Comment', title: t('table.comment') },
        { key: 'Reply', title: t('table.reply') },
        { key: 'Rating', title: t('table.rating') }
    ];

    const handleSort = () => {};

    if (loading) return <TableSkeleton />;
    if (error) return <div>{t('error', { message: error.message })}</div>;

    return (
        <div className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px] w-full md:max-w-[55vw] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="flex-1 sm:text-[24px] text-[16px] font-[700] font-beausans">
                    {t('title')}
                </h1>
            </div>
            <div className="flex justify-center w-full">
                <div className="w-full overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green max-h-[600px]">
                    <table className="w-full min-w-[1000px] border-collapse bg-white shadow-md rounded-lg">
                        <thead className="bg-[#F7F7F7]">
                            <tr className="flex">
                                {columns.map((column) => (
                                    <SortableHeader
                                        key={column.key}
                                        column={column}
                                        sortConfig={sortConfig}
                                        onSort={handleSort}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {storeRatings.length > 0 ? (
                                storeRatings.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-gray-200 flex"
                                    >
                                        <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                            {item.orderCode}
                                        </td>
                                        <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                            {item.store}
                                        </td>
                                        <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                            {item.creationDate}
                                        </td>
                                        <td className="py-[16px] px-[16px] text-[14px] font-[400] text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                            <button
                                                className="text-green-600 hover:underline cursor-pointer"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsOpenModalReview(true);
                                                }}
                                            >
                                                {item.comment}
                                            </button>
                                        </td>
                                        <td className="py-[16px] px-[16px] text-[14px] font-[400] text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                            <button
                                                className="text-green-600 hover:underline cursor-pointer"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsOpenModalResponse(
                                                        true
                                                    );
                                                }}
                                            >
                                                {item.reply}
                                            </button>
                                        </td>
                                        <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                            <StarRating rating={item.rating} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={11}>
                                        <div className="text-center text-[18px] font-[400] text-gray-700 py-[20px]">
                                            {t('noReviews')}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                page={page}
                limit={limit}
                setPage={setPage}
                total={totalCount}
            />

            {isOpenModalReview && selectedItem && (
                <Review
                    onClose={() => {
                        setIsOpenModalReview(false);
                        setSelectedItem(null);
                    }}
                    onResponseClick={() => {
                        setIsOpenModalReview(false);
                        setIsOpenModalResponse(true);
                    }}
                    onResponseSuccess={handleResponseSuccess}
                    reviewData={{
                        ...selectedItem,
                        ratingDate: selectedItem.creationDate
                    }}
                />
            )}

            {isOpenModalResponse && selectedItem && (
                <Response
                    onClose={() => {
                        setIsOpenModalResponse(false);
                        setSelectedItem(null);
                    }}
                    responseData={selectedItem as any}
                    onSuccess={handleResponseSuccess}
                />
            )}
        </div>
    );
}
