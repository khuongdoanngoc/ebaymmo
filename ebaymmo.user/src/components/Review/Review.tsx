'use client';

import Modal from '@/components/BaseUI/Modal';
import { useGetRatingByIdQuery } from '@/generated/graphql';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import Response from '../Response/Response';
import { formatDate } from '@/utils/formatDate';
import { useTranslations } from 'next-intl';

interface StoreData {
    id: number | string;
    orderCode?: string;
    ratingId?: string;
    store?: string;
    comment?: string;
    reply?: string;
    rating?: number;
    storeId?: string;
    ratingDate?: string;
}

interface ReviewProps {
    onClose: () => void;
    reviewData: StoreData;
    onResponseClick: () => void;
    onResponseSuccess?: () => void;
}

const Review = ({
    onClose,
    reviewData,
    onResponseClick,
    onResponseSuccess
}: ReviewProps) => {
    const t = useTranslations('review');
    const [showResponse, setShowResponse] = useState(false);
    const { data, loading, error } = useGetRatingByIdQuery({
        variables: {
            ratingId: reviewData.ratingId
        },
        skip: !reviewData.ratingId
    });

    const review = useMemo(() => data?.storeRatingsByPk, [data]);

    const handleResponseSuccess = () => {
        setShowResponse(false);
        onResponseSuccess?.();
    };

    if (loading)
        return (
            <div className="animate-pulse">
                <div className="flex items-center justify-start">
                    {/* Avatar skeleton */}
                    <div className="w-[78px] h-[78px] bg-gray-200 rounded-full" />

                    {/* User info skeleton */}
                    <div className="flex flex-col justify-center items-start ml-6">
                        <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                </div>

                {/* Rating skeleton */}
                <div className="flex gap-x-[6px] mt-5">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-[25px] h-[25px] bg-gray-200 rounded"
                        />
                    ))}
                </div>

                {/* Review text skeleton */}
                <div className="mt-3 w-[477px]">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
            </div>
        );

    if (error) return <div>{t('error', { message: error.message })}</div>;
    if (!review) return <div>{t('notFound')}</div>;

    return (
        <div>
            <Modal
                isOpen={!showResponse}
                onClose={onClose}
                title={t('title')}
                buttonTitle={t('response')}
                onButtonClick={onResponseClick}
            >
                <div className="">
                    <div className="flex items-center justify-start">
                        <Image
                            src={
                                review?.user?.images || '/images/avatar-02.svg'
                            }
                            alt="review"
                            width={78}
                            height={78}
                            className="rounded-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/avatar-02.svg';
                            }}
                        />
                        <div className="flex flex-col justify-center items-start ml-6 ">
                            <h4 className="text-base font-medium">
                                {review?.user?.username}
                            </h4>
                            <p className="text-[#7B7B7B] text-[14px] font-normal leading-[228%]">
                                {review?.ratingDate
                                    ? formatDate(review.ratingDate)
                                    : t('noDate')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-x-[6px] mt-5">
                        {[...Array(5)].map((_, i) => (
                            <Image
                                key={i}
                                src="/images/star.svg"
                                width={25}
                                height={25}
                                alt="star"
                                className={
                                    i < (review?.rating || 0)
                                        ? 'brightness-100'
                                        : 'brightness-[0.5] opacity-50'
                                }
                            />
                        ))}
                    </div>
                    <p className="text-black text-[16px] font-normal leading-[160%] mt-3 w-[477px] text-left mb-10">
                        " {review?.review || t('noReview')} "
                    </p>
                </div>
            </Modal>
            {showResponse && (
                <Response
                    onClose={() => setShowResponse(false)}
                    responseData={{
                        id: review.ratingId,
                        ratingId: review.ratingId,
                        rating: review.rating || 0,
                        review: review.review || '',
                        ratingDate: review.ratingDate || '',
                        store: review.store?.storeName || '',
                        user: {
                            fullName: review.user?.fullName || '',
                            images: review.user?.images || ''
                        }
                    }}
                    onSuccess={handleResponseSuccess}
                />
            )}
        </div>
    );
};

export default Review;
