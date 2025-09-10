'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
    useGetHighestBidSubscription,
    useGetHighestBidderSubscription,
    useGetBidsByIdSubscription
} from '@/generated/graphql';
import { useAuctionTimer } from '@/hooks/useAuctionTimer';
import { useAuctionLogic } from '@/hooks/useAuctionLogic';
import { AuctionWaitingRoom } from '../_components/waitingRoom';
import { AuctionRoom } from '../_components/AuctionRoom';
import { BidInput } from '../_components/BidInput';
import SelectStoreModal from '../../../(default)/bid/_components/SelectStoreModal';
import Modal from '@/components/BaseUI/Modal';
import Image from 'next/image';
import { BidHistory } from '../_components/aution';

// Skeleton Components
const SkeletonBox = ({ className }: { className?: string }) => (
    <div className={`bg-gray-300 animate-pulse rounded ${className}`} />
);

const SkeletonWaitingRoom = () => (
    <div className="p-4 max-w-4xl mx-auto">
        <SkeletonBox className="h-8 w-3/4 mb-4" /> {/* Position Name */}
        <SkeletonBox className="h-6 w-1/2 mb-4" /> {/* Category Name */}
        <SkeletonBox className="h-64 w-full mb-4" /> {/* Category Image */}
        <SkeletonBox className="h-6 w-1/4 mb-4" /> {/* Bid Date */}
    </div>
);

const SkeletonAuctionRoom = () => (
    <div className="p-4 max-w-4xl mx-auto">
        <SkeletonBox className="h-6 w-1/2 mb-4" /> {/* Category Name */}
        <SkeletonBox className="h-64 w-full mb-4" /> {/* Category Image */}
        <SkeletonBox className="h-8 w-3/4 mb-4" /> {/* Position Name */}
        <SkeletonBox className="h-6 w-1/4 mb-4" /> {/* Bid Amount */}
        <SkeletonBox className="h-6 w-1/3 mb-4" /> {/* Bid Date */}
        <div className="flex items-center gap-3 mb-4">
            <SkeletonBox className="h-12 w-12 rounded-full" /> {/* Avatar */}
            <div className="space-y-2">
                <SkeletonBox className="h-4 w-24" /> {/* Username */}
                <SkeletonBox className="h-4 w-16" /> {/* Bid Amount */}
            </div>
        </div>
        <SkeletonBox className="h-10 w-64 mb-4" /> {/* Bid Input */}
    </div>
);

const SkeletonModal = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg w-96">
            <SkeletonBox className="h-8 w-3/4 mb-6 mx-auto" /> {/* Title */}
            <div className="flex items-center justify-center gap-3 mb-4">
                <SkeletonBox className="h-16 w-16 rounded-full" />{' '}
                {/* Avatar */}
                <div className="space-y-2">
                    <SkeletonBox className="h-6 w-32" /> {/* Store Name */}
                    <SkeletonBox className="h-4 w-24" /> {/* Full Name */}
                </div>
            </div>
            <SkeletonBox className="h-6 w-2/3 mx-auto mb-4" />{' '}
            {/* Position Name */}
            <SkeletonBox className="h-6 w-1/3 mx-auto mb-4" />{' '}
            {/* Winning Bid */}
            <SkeletonBox className="h-10 w-24 mx-auto" /> {/* Button */}
        </div>
    </div>
);

export default function BidPage() {
    const params = useParams();
    const bidId = params.id as string;
    const router = useRouter();
    const { data: session } = useSession();

    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [showStoreModal, setShowStoreModal] = useState(true);
    const [isAuctionStarted, setIsAuctionStarted] = useState(false);

    const { data: bidsData, loading: bidsLoading } = useGetBidsByIdSubscription(
        {
            variables: { bidId }
        }
    );
    const { data: highestBidData } = useGetHighestBidSubscription({
        variables: { bidId }
    });
    const { data: highestBidderData } = useGetHighestBidderSubscription({
        variables: { bidId }
    });
    const bid = bidsData?.bids[0];
    const bidDate = bid?.bidDate || '';
    const positionName = bid?.position?.positionName || '';
    const categoryName = bid?.position?.category?.categoryName || '';
    const categoryImage = bid?.position?.category?.imagesUrl || '';
    const categoryId = bid?.position?.category?.categoryId || '';


    const rawHighestBidder = highestBidderData?.bidsHistory[0];
    const highestBidder: BidHistory | undefined = rawHighestBidder
        ? {
              bidAmount: Number(rawHighestBidder.bidAmount) || 0,
              createAt: rawHighestBidder.createAt
          }
        : undefined;

    const bidHistory = (highestBidData?.listingBidHistories || []).map(
        (bid) => ({
            bidAmount: Number(bid.bidAmount) || 0,
            createAt: bid.createAt,
            avatar: bid.images,
            username: bid.username || ''
        })
    ) as BidHistory[];

    const bidAmount1 = bid?.bidAmount;

    const {
        showWinnerModal,
        setShowWinnerModal,
        showWaitingModal,
        bidAmount,
        setBidAmount,
        error,
        handleTimeUp,
        handlePlaceBid,
        validateAndSetBidAmount,
        bidStatusData
    } = useAuctionLogic(bidId);

    const { timeLeft } = useAuctionTimer(bidId, handleTimeUp);

    // Skeleton khi đang tải dữ liệu
    if (bidsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                {!isAuctionStarted ? (
                    <SkeletonWaitingRoom />
                ) : (
                    <SkeletonAuctionRoom />
                )}
            </div>
        );
    }

    if (!bid)
        return (
            <div className="text-center py-8">
                Auction information not found
            </div>
        );

    const handleWaitingTimeUp = () => setIsAuctionStarted(true);

    return (
        <>
            {!isAuctionStarted ? (
                <AuctionWaitingRoom
                    positionName={positionName}
                    categoryName={categoryName}
                    categoryImage={categoryImage}
                    bidDate={bidDate}
                    onTimeUp={handleWaitingTimeUp}
                    currentBidId={bidId}
                    accessToken={session?.user?.accessToken || ''}
                />
            ) : (
                <AuctionRoom
                    categoryName={categoryName}
                    categoryImage={categoryImage}
                    positionName={positionName}
                    bidAmount={Number(bidAmount1)}
                    bidDate={bidDate}
                    highestBidder={
                        highestBidder || {
                            bidAmount: 0,
                            createAt: '',
                            username: '',
                            avatar: ''
                        }
                    }
                    bidHistory={bidHistory}
                    onTimeUp={handleTimeUp}
                    currentBidId={bidId}
                    accessToken={session?.user?.accessToken || ''}
                    showWaitingModal={showWaitingModal} // Truyền trạng thái Modal chờs
                >
                    <BidInput
                        bidAmount={bidAmount1}
                        error={error}
                        selectedStoreId={selectedStoreId}
                        highestBidAmount={highestBidder?.bidAmount || 0}
                        onBidChange={(value) =>
                            value
                                ? validateAndSetBidAmount(
                                      value,
                                      highestBidder?.bidAmount || 0,
                                      bidAmount1
                                  )
                                : setBidAmount('')
                        }
                        onPlaceBid={() =>
                            handlePlaceBid(
                                selectedStoreId,
                                bid?.position?.positionId || '',
                                highestBidder?.bidAmount || 0
                            )
                        }
                        validateAndSetBidAmount={validateAndSetBidAmount}
                    />
                    {showStoreModal && session?.user?.id && (
                        <SelectStoreModal
                            userId={session.user.id}
                            categoryId={categoryId || ''}
                            onSelect={setSelectedStoreId}
                            onClose={() => setShowStoreModal(false)}
                        />
                    )}
                </AuctionRoom>
            )}
            {showWinnerModal && bidStatusData?.bidsByPk && (
                <Modal
                    isOpen={showWinnerModal}
                    onClose={() => {
                        setShowWinnerModal(false);
                        router.push('/');
                    }}
                    title="Auction ended"
                    buttonTitle="OK"
                    onSubmit={() => {
                        setShowWinnerModal(false);
                        router.push('/');
                    }}
                >
                    <div className="text-center">
                        <h3 className="text-2xl font-bold mb-6">
                            Auction has ended!
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Image
                                    src={
                                        bidStatusData.bidsByPk.position?.store
                                            ?.user?.images ||
                                        '/images/default-store.png'
                                    }
                                    alt="Winner"
                                    width={60}
                                    height={60}
                                    className="rounded-full"
                                />
                                <div className="text-left">
                                    <p className="font-semibold text-lg">
                                        {bidStatusData.bidsByPk.position?.store
                                            ?.storeName || 'Not found'}
                                    </p>
                                    <p className="text-gray-600">
                                        {bidStatusData.bidsByPk.position?.store
                                            ?.user?.fullName || 'Not found'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-600">
                                Won the auction position{' '}
                                <span className="font-semibold">
                                    {positionName}
                                </span>
                            </p>
                            <p className="text-xl font-bold text-green-500">
                                Winning bid:{' '}
                                {bidStatusData.bidsByPk.bidAmount?.toLocaleString() ||
                                    0}
                                đ
                            </p>
                        </div>
                    </div>
                </Modal>
            )}
            {showWinnerModal && !bidStatusData?.bidsByPk && <SkeletonModal />}
        </>
    );
}
