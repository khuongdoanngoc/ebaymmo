import { useState, useEffect, useCallback, useRef } from 'react';
import { useSubscription, gql } from '@apollo/client';

const BID_CONFIG_SUBSCRIPTION = gql`
    subscription GetBidConfig {
        configs(where: { name: { _eq: "BID_DURATION" } }) {
            value
        }
    }
`;

const BID_SUBSCRIPTION = gql`
    subscription GetBid($bidId: uuid!) {
        bidsByPk(bidId: $bidId) {
            bidDate
            bidStatus
        }
    }
`;

export const useAuctionTimer = (bidId: string, onTimeUp?: () => void) => {
    const [timeLeft, setTimeLeft] = useState({
        hours: 1,
        minutes: 0,
        seconds: 0
    });
    const [isTimeUpCalled, setIsTimeUpCalled] = useState(false);
    const prevTimeLeftRef = useRef<typeof timeLeft | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const loggedOnceRef = useRef(false);

    const { data: configData } = useSubscription(BID_CONFIG_SUBSCRIPTION);
    const bidDuration = configData?.configs?.[0]?.value
        ? parseInt(configData.configs[0].value) * 60 * 60 * 1000
        : 60 * 60 * 1000;

    const {
        data: bidData,
        loading: bidLoading,
        error: bidError
    } = useSubscription(BID_SUBSCRIPTION, {
        variables: { bidId }
    });

    // Debug log khi dữ liệu đấu giá thay đổi
    useEffect(() => {
        if (!loggedOnceRef.current) {
            loggedOnceRef.current = true;
        }

        if (bidData?.bidsByPk) {

        }
    }, [bidData, bidId, bidDuration, configData, bidLoading, bidError]);

    const calculateTimeLeft = useCallback(() => {
        try {
            if (!bidData?.bidsByPk?.bidDate) {
                if (!bidLoading) {
                    console.warn('useAuctionTimer - No bid date available');
                }
                return;
            }

            const now = new Date().getTime();
            const bidStartTime = new Date(bidData.bidsByPk.bidDate).getTime();

            // Kiểm tra tính hợp lệ của ngày
            if (isNaN(bidStartTime)) {
                console.error(
                    'useAuctionTimer - Invalid bid date format:',
                    bidData.bidsByPk.bidDate
                );
                return;
            }

            const bidEndTime = bidStartTime + bidDuration;
            const remaining = bidEndTime - now;

            if (remaining > 0) {
                const newTimeLeft = {
                    hours: Math.floor((remaining / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((remaining / 1000 / 60) % 60),
                    seconds: Math.floor((remaining / 1000) % 60)
                };

                // Chỉ cập nhật timeLeft nếu giá trị thay đổi
                if (
                    !prevTimeLeftRef.current ||
                    prevTimeLeftRef.current.hours !== newTimeLeft.hours ||
                    prevTimeLeftRef.current.minutes !== newTimeLeft.minutes ||
                    prevTimeLeftRef.current.seconds !== newTimeLeft.seconds
                ) {
                    setTimeLeft(newTimeLeft);
                    prevTimeLeftRef.current = newTimeLeft;
                }
            } else {
                // Chỉ cập nhật về 0 nếu chưa ở trạng thái 0
                if (
                    !prevTimeLeftRef.current ||
                    prevTimeLeftRef.current.hours !== 0 ||
                    prevTimeLeftRef.current.minutes !== 0 ||
                    prevTimeLeftRef.current.seconds !== 0
                ) {
                    const zeroTime = { hours: 0, minutes: 0, seconds: 0 };
                    setTimeLeft(zeroTime);
                    prevTimeLeftRef.current = zeroTime;

                }

                if (!isTimeUpCalled && onTimeUp) {
                    if (timerRef.current !== null) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    setIsTimeUpCalled(true);
                    onTimeUp();
                }
            }
        } catch (error) {
            console.error('useAuctionTimer - Error calculating time:', error);
        }
    }, [
        bidData?.bidsByPk?.bidDate,
        bidDuration,
        onTimeUp,
        isTimeUpCalled,
        bidLoading
    ]);

    // Reset timer khi bidDate thay đổi
    useEffect(() => {
        if (!bidData?.bidsByPk?.bidDate) return;

        // Reset trạng thái khi bidDate thay đổi
        setIsTimeUpCalled(false);


        // Xóa timer cũ nếu có
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Tạo timer mới
        calculateTimeLeft(); // Gọi lần đầu ngay lập tức
        timerRef.current = setInterval(calculateTimeLeft, 1000);

        return () => {
            if (timerRef.current !== null) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [bidData?.bidsByPk?.bidDate, calculateTimeLeft]);

    return { timeLeft, bidLoading, bidError, bidData };
};
