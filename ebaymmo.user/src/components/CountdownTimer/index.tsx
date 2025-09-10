import { useEffect, useState, useRef, useCallback } from 'react';
import { useGetBidConfigSubscription } from '@/generated/graphql';
import { AuctionStatus } from '../AuctionStatus/AuctionStatus';

interface CountdownProps {
    bidDate?: string;
    className?: string;
    showStatus?: boolean;
    showText?: boolean;
    onTimeUp?: () => void;
    isAuctionRoom?: boolean;
}

export const CountdownTimer = ({
    bidDate,
    className,
    showStatus = false,
    showText = true,
    onTimeUp,
    isAuctionRoom = false
}: CountdownProps) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [isAuctionTime, setIsAuctionTime] = useState(false);
    const isTimeUpCalledRef = useRef(false);
    const [validBidDate, setValidBidDate] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const prevTimeLeftRef = useRef<typeof timeLeft | null>(null);
    const isCurrentlyAuctionTimeRef = useRef<boolean>(false);
    const hasInitializedRef = useRef(false);

    const { data: configData } = useGetBidConfigSubscription();
    const bidDuration = configData?.configs?.[0]?.value
        ? parseInt(configData.configs[0].value) * 60 * 60 * 1000
        : 60 * 60 * 1000;

    // Xác thực và chuẩn hóa bidDate
    useEffect(() => {
        try {
            // Nếu bidDate không tồn tại, sử dụng thời gian hiện tại + 2 giờ
            if (!bidDate) {
                const futureDate = new Date();
                futureDate.setHours(futureDate.getHours() + 2); // Thêm 2 giờ thay vì 30 phút
                setValidBidDate(futureDate.toISOString());
                return;
            }

            // Kiểm tra tính hợp lệ của bidDate
            const dateObj = new Date(bidDate);
            if (isNaN(dateObj.getTime())) {
                const futureDate = new Date();
                futureDate.setHours(futureDate.getHours() + 2); // Thêm 2 giờ thay vì 30 phút
                setValidBidDate(futureDate.toISOString());
            } else {
                setValidBidDate(bidDate);
            }
        } catch (error) {
            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 2); // Thêm 2 giờ thay vì 30 phút
            setValidBidDate(futureDate.toISOString());
        }
    }, [bidDate]);

    // Tách riêng hàm kiểm tra auction time để sử dụng trong cả useEffect và callback
    const checkIsAuctionTime = useCallback(() => {
        if (!validBidDate) return false;
        
        try {
            const now = new Date().getTime();
            const auctionDate = new Date(validBidDate).getTime();
            
            if (isNaN(auctionDate)) return false;
            
            return now >= auctionDate && now < auctionDate + bidDuration;
        } catch (error) {
            console.error('Error checking auction time:', error);
            return false;
        }
    }, [validBidDate, bidDuration]);

    // Cập nhật isAuctionTime trong một useEffect riêng biệt
    useEffect(() => {
        // Hàm này chỉ cập nhật ref, không cập nhật state
        const currentAuctionTime = checkIsAuctionTime();
        isCurrentlyAuctionTimeRef.current = currentAuctionTime;
        
        // Cập nhật state nếu cần thiết
        setIsAuctionTime(currentAuctionTime);
        
        // Dependency array chỉ bao gồm hàm kiểm tra và validBidDate
    }, [checkIsAuctionTime, validBidDate]);

    const calculateTimeLeft = useCallback(() => {
        try {
            if (!validBidDate) {
                return;
            }

            const now = new Date().getTime();
            const auctionDate = new Date(validBidDate).getTime();

            // Kiểm tra ngày hợp lệ
            if (isNaN(auctionDate)) {
                return;
            }

            const targetTime = isAuctionRoom
                ? auctionDate + bidDuration
                : auctionDate;
                
            // Chỉ cập nhật ref, không cập nhật state trực tiếp
            isCurrentlyAuctionTimeRef.current = now >= auctionDate && now < auctionDate + bidDuration;

            const difference = targetTime - now;

            if (difference > 0) {
                const newTimeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };

                // Chỉ cập nhật timeLeft nếu giá trị thay đổi
                if (
                    !prevTimeLeftRef.current ||
                    prevTimeLeftRef.current.days !== newTimeLeft.days ||
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
                    prevTimeLeftRef.current.days !== 0 ||
                    prevTimeLeftRef.current.hours !== 0 ||
                    prevTimeLeftRef.current.minutes !== 0 ||
                    prevTimeLeftRef.current.seconds !== 0
                ) {
                    const zeroTime = {
                        days: 0,
                        hours: 0,
                        minutes: 0,
                        seconds: 0
                    };
                    setTimeLeft(zeroTime);
                    prevTimeLeftRef.current = zeroTime;
                }

                // Sử dụng ref để tránh vòng lặp vô hạn
                if (onTimeUp && !isTimeUpCalledRef.current) {
                    if (timerRef.current !== null) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    isTimeUpCalledRef.current = true;
                    onTimeUp();
                }
            }
        } catch (error) {
            // Xử lý lỗi im lặng
            console.error('Error in calculateTimeLeft:', error);
        }
    }, [validBidDate, bidDuration, isAuctionRoom, onTimeUp]);

    // Reset timer khi validBidDate thay đổi
    useEffect(() => {
        if (!validBidDate) {
            return;
        }

        // Khi validBidDate thay đổi, reset trạng thái
        hasInitializedRef.current = true;
        // Reset ref thay vì setState để tránh vòng lặp vô hạn
        isTimeUpCalledRef.current = false;
        isCurrentlyAuctionTimeRef.current = checkIsAuctionTime();
        prevTimeLeftRef.current = null;

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
    }, [validBidDate, calculateTimeLeft, checkIsAuctionTime]);

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    const formatTimeDisplay = (timeLeft: {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }) => {
        const { days, hours, minutes, seconds } = timeLeft;
        const parts: string[] = [];

        if (days > 0) {
            parts.push(`${formatNumber(days)}d`);
        }
        if (days > 0 || hours > 0) {
            parts.push(`${formatNumber(hours)}h`);
        }
        if (days > 0 || hours > 0 || minutes > 0) {
            parts.push(`${formatNumber(minutes)}m`);
        }
        parts.push(`${formatNumber(seconds)}s`);

        return parts.join(' : ');
    };

    return (
        <div className="flex flex-col items-center gap-1">
            {showStatus && showText && (
                <AuctionStatus isAuctionTime={isAuctionTime} />
            )}
            <div className={className}>{formatTimeDisplay(timeLeft)}</div>
        </div>
    );
};
