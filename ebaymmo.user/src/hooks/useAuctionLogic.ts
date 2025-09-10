// hooks/useAuctionLogic.ts (hoàn chỉnh)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    useFinalizeBidAuctionMutation,
    useHoldBidAmountMutation,
    useOnBidFinalizedSubscription
} from '@/generated/graphql';
import { useStatusModal } from '@/contexts/StatusModalContext';

export const useAuctionLogic = (bidId: string) => {
    const router = useRouter();
    const { showModal } = useStatusModal();
    const [isTimeUpHandled, setIsTimeUpHandled] = useState(false);
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [showWaitingModal, setShowWaitingModal] = useState(false); // Thêm trạng thái cho Modal chờ
    const [bidAmount, setBidAmount] = useState<string>('');
    const [error, setError] = useState<string>('');

    const { data: bidStatusData } = useOnBidFinalizedSubscription({
        variables: { bidId }
    });
    const [finalizeBidAuction] = useFinalizeBidAuctionMutation();
    const [holdBidAmount] = useHoldBidAmountMutation();

    useEffect(() => {
        if (bidStatusData?.bidsByPk?.bidStatus === 'completed') {
            setShowWaitingModal(false); // Tắt Modal chờ khi có kết quả
            if (bidStatusData?.bidsByPk?.bidAmount === 0) {
                window.location.href = '/';
            } else {
                setShowWinnerModal(true);
            }
        }
    }, [
        bidStatusData?.bidsByPk?.bidStatus,
        bidStatusData?.bidsByPk?.bidAmount,
        router
    ]);

    const handleFinishAuction = async () => {
        try {
            await finalizeBidAuction({ variables: { input: { bidId } } });
        } catch (error) {
            console.error('Error finalizing auction:', error);
            showModal('error', 'An error occurred while ending the auction.');
        }
    };

    const bidStep = 50; // USDT, bước giá tối thiểu

    const validateAndSetBidAmount = (
        value: string,
        highestBidAmount: number,
        bidAmount: number
    ) => {
        const numericValue = Number(value); // Chuyển thành số
        const numericBidAmount = Number(bidAmount); // chuyen thnah so
        let numberTotalAount = 0;
        if (highestBidAmount == 0) {
            numberTotalAount = highestBidAmount + numericBidAmount;
        } else if (highestBidAmount != 0) {
            numberTotalAount = highestBidAmount;
        }

        if (isNaN(numericValue) || numericValue <= 0) {
            setError('Please enter a valid number greater than 0');
            setBidAmount(value); // Vẫn cập nhật để hiển thị
        } else if (numericValue < numberTotalAount + bidStep) {
            setError(`Bid must be at least ${numberTotalAount + bidStep} USDT`);
            setBidAmount(value); // Vẫn cập nhật để hiển thị
        } else {
            setError('');
            setBidAmount(value); // Giá trị hợp lệ
        }
    };

    const handlePlaceBid = async (
        selectedStoreId: string,
        positionId: string,
        currentHighestBid: number
    ) => {
        if (!selectedStoreId || !bidAmount || !positionId) {
            showModal(
                'error',
                'Please select a store and enter a valid bid amount.'
            );
            return;
        }
        const numericValue = Number(bidAmount); // Chuyển thành số
        if (isNaN(numericValue) || numericValue < currentHighestBid + bidStep) {
            setError(
                `Bid must be at least ${currentHighestBid + bidStep} USDT`
            );
            return;
        }

        try {
            const result = await holdBidAmount({
                variables: {
                    input: {
                        storeId: selectedStoreId,
                        positionId,
                        bidAmount: numericValue,
                        bidId
                    }
                }
            });

            if (result.data?.holdBidAmountAction?.status === 'failed') {
                showModal(
                    'error',
                    result.data.holdBidAmountAction.description ||
                        'Insufficient balance to place bid'
                );
                return;
            }
            setBidAmount('');
            setError('');
        } catch (error) {
            showModal(
                'error',
                'An error occurred while placing the bid. Please try again later.'
            );
        }
    };

    const handleTimeUp = async () => {
        if (!isTimeUpHandled) {
            setIsTimeUpHandled(true);
            await handleFinishAuction();
        }
    };

    const handleTimeUpIcon = async () => {
        await handleFinishAuction();
    };

    return {
        showWinnerModal,
        setShowWinnerModal,
        bidAmount,
        showWaitingModal, // Thêm vào return
        setBidAmount, // Thêm setBidAmount vào return
        error,
        handleTimeUp,
        handleTimeUpIcon, // Thêm handleTimeUpIcon vào return
        handlePlaceBid,
        validateAndSetBidAmount,
        bidStatusData
    };
};
