import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react';
import {
    useGetBidsForUsersSubscription,
    useGetBidConfigSubscription,
    useFinalizeBidAuctionMutation
} from '@/generated/graphql';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useAuctionLogic } from '@/hooks/useAuctionLogic';

interface HammerProps {
    bidDate: string;
    bidId: string;
}

const HIDDEN_PATHS = ['/waiting-room', '/bid'];

export const Hammer = ({ bidDate, bidId }: HammerProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuctionPhase, setIsAuctionPhase] = useState(false);
    const [isTimeUpHandled, setIsTimeUpHandled] = useState(false);
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [validBidDate, setValidBidDate] = useState<string>(bidDate);
    const timeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Lấy mutation trực tiếp để có thể gọi ngay khi cần
    const [finalizeBidAuction] = useFinalizeBidAuctionMutation();

    const { data: configData, loading: configLoading } =
        useGetBidConfigSubscription();
    const { data: bidsData } = useGetBidsForUsersSubscription({});

    // Xác thực và chuẩn hóa bidDate
    useEffect(() => {
        try {
            // Nếu bidDate không tồn tại, sử dụng thời gian hiện tại
            if (!bidDate || bidDate === '') {
                // Tạo thời gian trong tương lai 30 phút để đảm bảo CountdownTimer hiển thị
                const futureDate = new Date();
                futureDate.setMinutes(futureDate.getMinutes() + 30);
                setValidBidDate(futureDate.toISOString());
                return;
            }

            // Kiểm tra tính hợp lệ của bidDate
            const dateObj = new Date(bidDate);
            if (isNaN(dateObj.getTime())) {
                const futureDate = new Date();
                futureDate.setMinutes(futureDate.getMinutes() + 30);
                setValidBidDate(futureDate.toISOString());
            } else {
                setValidBidDate(bidDate);
            }
        } catch (error) {
            const futureDate = new Date();
            futureDate.setMinutes(futureDate.getMinutes() + 30);
            setValidBidDate(futureDate.toISOString());
        }
    }, [bidDate]);

    // Sử dụng useAuctionLogic ngay trong Hammer
    const { bidStatusData } = useAuctionLogic(bidId);

    const bidDuration = useMemo(() => {
        if (configData?.configs?.[0]?.value) {
            return parseInt(configData.configs[0].value) * 60 * 60 * 1000;
        }
        return 60 * 60 * 1000; // Mặc định 1 giờ
    }, [configData?.configs]);

    const hasBids = useMemo(() => {
        return (bidsData?.bids?.[0]?.bidHistories?.length ?? 0) > 0;
    }, [bidsData]);

    // Kiểm tra trạng thái của phiên đấu giá
    const isAuctionCompleted = useMemo(() => {
        return bidStatusData?.bidsByPk?.bidStatus === 'completed';
    }, [bidStatusData]);

    // Gọi finalizeBidAuction khi đấu giá kết thúc - một lần duy nhất
    const handleAuctionFinalize = async () => {
        // Chỉ gọi nếu chưa xử lý trước đó và chưa hoàn thành
        if (!isTimeUpHandled && !isAuctionCompleted) {
            console.log('Finalizing auction:', bidId);
            
            try {
                setIsTimeUpHandled(true); // Đánh dấu đã xử lý để không gọi lại
                
                // Gọi trực tiếp mutation để kết thúc đấu giá
                await finalizeBidAuction({ 
                    variables: { 
                        input: { bidId } 
                    } 
                });
                
                console.log('Auction finalized successfully:', bidId);
            } catch (error) {
                console.error('Error finalizing auction:', error);
                // Không reset isTimeUpHandled để tránh gọi lại liên tục khi có lỗi
            }
        }
    };

    // Kiểm tra định kỳ nếu đấu giá đã hết thời gian nhưng chưa được finalize
    useEffect(() => {
        // Chỉ thiết lập interval nếu chưa xử lý và chưa hoàn thành
        if (!isTimeUpHandled && !isAuctionCompleted) {
            const checkTimeAndFinalize = () => {
                try {
                    const now = new Date().getTime();
                    const auctionDate = new Date(validBidDate).getTime();
                    const auctionEndTime = auctionDate + bidDuration;

                    // Nếu đã hết thời gian đấu giá và chưa được xử lý
                    if (now >= auctionEndTime && !isTimeUpHandled && !isAuctionCompleted) {
                        console.log('Auction expired, finalizing automatically:', bidId);
                        handleAuctionFinalize();
                    }
                } catch (error) {
                    console.error('Error checking auction time:', error);
                }
            };

            // Khởi tạo interval để kiểm tra mỗi phút
            timeCheckIntervalRef.current = setInterval(checkTimeAndFinalize, 60000);
            
            // Kiểm tra ngay lần đầu tiên
            checkTimeAndFinalize();
        }

        // Cleanup interval khi component unmount hoặc khi đấu giá đã được xử lý/hoàn thành
        return () => {
            if (timeCheckIntervalRef.current) {
                clearInterval(timeCheckIntervalRef.current);
                timeCheckIntervalRef.current = null;
            }
        };
    }, [validBidDate, bidDuration, isTimeUpHandled, isAuctionCompleted, bidId]);

    // Kiểm tra và thiết lập giai đoạn đấu giá
    useEffect(() => {
        if (configLoading) {
            return;
        }

        if (HIDDEN_PATHS.some((path) => pathname.includes(path))) {
            return;
        }

        const now = new Date().getTime();

        try {
            // Sử dụng validBidDate thay vì bidDate
            const auctionDate = new Date(validBidDate).getTime();

            if (isNaN(auctionDate)) {
                return;
            }

            const auctionEndTime = auctionDate + bidDuration;
            const difference = auctionEndTime - now;

            // Xác định đang ở giai đoạn đấu giá hay chưa
            setIsAuctionPhase(now >= auctionDate && now < auctionEndTime);

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else if (difference <= 0 && !isTimeUpHandled && !isAuctionCompleted) {
                // Nếu thời gian đã hết và chưa được xử lý, thực hiện finalize
                handleAuctionFinalize();
            }
        } catch (error) {
            // Xử lý lỗi im lặng
            console.error('Error in auction time calculation:', error);
        }
    }, [validBidDate, bidDuration, configLoading, pathname, isTimeUpHandled, isAuctionCompleted]);

    const handleClick = () => {
        router.push(`/bid/${bidId}`);
    };

    // Xử lý khi CountdownTimer bắn sự kiện onTimeUp
    const handleTimeUp = () => {
        if (!isTimeUpHandled && !isAuctionCompleted) {
            console.log('Time up from CountdownTimer, finalizing:', bidId);
            handleAuctionFinalize();
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <CountdownTimer
                bidDate={validBidDate}
                showStatus={true}
                className="text-[16px] font-bold text-[rgb(255,114,114)]"
                isAuctionRoom={isAuctionPhase}
                onTimeUp={handleTimeUp}
            />
            <button
                onClick={handleClick}
                className="rounded-[50%] w-10 h-10 md:w-[60px] md:h-[60px] flex items-center justify-center shadow-[0px_1px_20px_0px_#013E001A] bg-secondary-100"
            >
                <Image
                    src="/images/hammer.svg"
                    alt="hammer"
                    className="w-[20px] h-[20px] md:w-auto md:h-auto"
                    width={35}
                    height={35}
                />
            </button>
        </div>
    );
};

export default Hammer;
