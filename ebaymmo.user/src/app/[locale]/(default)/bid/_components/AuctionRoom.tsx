// components/AuctionRoom.tsx
import Image from 'next/image';
import { useRef, useEffect } from 'react'; // Thêm import useRef và useEffect
import { CountdownTimer } from '@/components/CountdownTimer';
import { BidHistory } from '../_components/aution';
import ChatItem from '@/components/HammerIcon/ChatItem';

interface AuctionRoomProps {
    positionName: string;
    bidDate: string;
    bidAmount: number;
    highestBidder: BidHistory;
    bidHistory: BidHistory[];
    onTimeUp: () => void;
    currentBidId: string;
    accessToken: string;
    children: React.ReactNode;
    categoryName?: string;
    categoryImage?: string;
    showWaitingModal?: boolean; // Thêm prop để hiển thị Modal chờ
}

export const AuctionRoom: React.FC<AuctionRoomProps> = ({
    categoryName,
    categoryImage,
    positionName,
    bidAmount,
    bidDate,
    highestBidder,
    bidHistory,
    onTimeUp,
    currentBidId,
    accessToken,
    children,
    showWaitingModal = false // Mặc định là false
}) => {
    const hasBids = bidHistory.length > 0;
    const latestBidder = hasBids
        ? bidHistory[bidHistory.length - 1].username
        : 'No one';
    const bidHistoryRef = useRef<HTMLDivElement>(null); // Tạo ref cho div chứa lịch sử đấu giá

    // Log thông tin bidDate khi component mount
    useEffect(() => {

        // Kiểm tra tính hợp lệ của bidDate
        const bidDateObj = new Date(bidDate);
        if (isNaN(bidDateObj.getTime())) {
            console.error('AuctionRoom - Invalid bidDate format:', bidDate);
        }
    }, [bidDate, positionName, hasBids, bidHistory.length]);

    // Tự động cuộn xuống dưới cùng khi bidHistory thay đổi
    useEffect(() => {
        if (bidHistoryRef.current) {
            bidHistoryRef.current.scrollTop =
                bidHistoryRef.current.scrollHeight;
        }
    }, [bidHistory]); // Chạy lại mỗi khi bidHistory thay đổi

    // Handler khi thời gian kết thúc
    const handleTimeUp = () => {
        onTimeUp();
    };

    return (
        <div className="relative overflow-hidden">
            <div
                className="absolute left-0 bottom-0 w-[500px] h-[500px] pointer-events-none -z-50"
                style={{
                    backgroundColor: '#C7FFD7',
                    opacity: 0.8,
                    filter: 'blur(125px)'
                }}
            />
            <div className="md:w-[1400px] mx-auto px-4 py-8 md:mt-[50px] mt-[20px]">
                <h1 className="md:text-[40px] text-[30px] font-bold text-center mb-8">
                    Auction
                    <div className="text-center mb-[30px]">
                        <div className="flex flex-col gap-[5px] items-center justify-center">
                            <p className="text-green_main mb-4 md:text-[30px] text-[16px]">
                                Currently auction position:
                            </p>
                            <span className="md:text-[30px] text-[16px] text-green_main font-bold">
                                {positionName}
                            </span>
                        </div>
                        {categoryImage && categoryName ? (
                            <div className="flex flex-col justify-center items-center gap-2">
                                <Image
                                    src={categoryImage}
                                    alt={categoryName}
                                    width={100}
                                    height={100}
                                    className="object-contain my-4"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            '/images/default-image.png';
                                    }}
                                />
                                <span className="md:text-[30px] text-[16px] text-green_main font-bold">
                                    {categoryName}
                                </span>
                            </div>
                        ) : (
                            <span className="md:text-[30px] text-[16px] text-green_main font-bold">
                                In Store List
                            </span>
                        )}
                    </div>
                </h1>
                <div className="flex gap-8 md:flex-row flex-col">
                    <div className="flex-1">
                        <div className="bg-white rounded-lg md:px-[35px] px-[20px] py-[30px] mb-6 relative shadow-[0px_5px_30px_0px_rgba(2,99,17,0.15)]">
                            <div className="flex md:flex-row flex-col items-center gap-2 mb-4 text-[20px] justify-center">
                                <div className="flex items-center gap-2">
                                    <Image
                                        src="/images/crown.svg"
                                        alt="Crown"
                                        width={24}
                                        height={24}
                                    />
                                    <span className="md:text-[20px] text-[16px]">
                                        Shop with the highest bid:
                                    </span>
                                </div>
                                <span className="text-blue-500 md:text-[20px] text-[16px]">
                                    {latestBidder}
                                </span>
                            </div>
                            <div className="mb-[20px] text-[30px] flex justify-center items-center">
                                <div className="flex md:flex-row flex-col items-center">
                                    <div className="md:text-[20px] text-[16px] font-semibold mr-2">
                                        Current highest bid:
                                    </div>
                                    <div className="text-2xl text-green-500 font-bold md:text-[20px] text-[16px]">
                                        {highestBidder.bidAmount > 0
                                            ? `${highestBidder.bidAmount} USDT`
                                            : `${bidAmount} USDT`}
                                    </div>
                                </div>
                            </div>
                            <div className="mb-[40px] flex flex-col justify-center items-center">
                                <div className="text-[18px] mb-2">
                                    Time left:
                                </div>
                                <CountdownTimer
                                    showText={false}
                                    bidDate={bidDate}
                                    showStatus={true}
                                    className="md:text-[40px] text-[20px] font-bold text-[rgb(255,114,114)]"
                                    onTimeUp={handleTimeUp}
                                    isAuctionRoom={true}
                                />
                            </div>
                            <div className="relative overflow-hidden">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage:
                                            'url("/images/auction.svg")',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition:
                                            'right 20px bottom -90px',
                                        backgroundSize: '45%',
                                        opacity: 0.08,
                                        transform: 'translate(-30px, -20px)'
                                    }}
                                />
                                <div
                                    ref={bidHistoryRef} // Gắn ref vào div chứa lịch sử đấu giá
                                    className="space-y-2 mb-6 h-[300px] overflow-y-auto scrollbar scrollbar-thin scrollbar-thumb-green_main relative"
                                >
                                    {hasBids ? (
                                        bidHistory.map((bid, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 mb-[10px] md:text-[16px] text-[10px]"
                                            >
                                                <Image
                                                    src={
                                                        bid.avatar ||
                                                        '/images/avatar.png'
                                                    }
                                                    alt={bid.username || 'User'}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full"
                                                />
                                                <span className="text-gray-600">
                                                    {bid.username ||
                                                        'Anonymous'}
                                                </span>
                                                <span>has bid</span>
                                                <span className="text-green-500">
                                                    {bid.bidAmount} USDT
                                                </span>
                                                <span>
                                                    for the position{' '}
                                                    {positionName}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 md:text-[16px] text-[10px]">
                                            No bids yet
                                        </div>
                                    )}
                                </div>
                            </div>
                            {children}
                        </div>
                    </div>
                    <ChatItem
                        categoryName={
                            categoryName
                                ? `The auction ${categoryName} category has started!`
                                : `The auction ${positionName} in store list has started!`
                        }
                        currentBidId={currentBidId}
                        accessToken={accessToken}
                    />
                </div>
            </div>
            {/* Modal thông báo chờ */}
            {showWaitingModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full text-center">
                        <h2 className="text-xl font-bold mb-4">Please Wait</h2>
                        <p className="text-gray-600 mb-4">
                            We are determining the winner of the auction. This
                            may take a moment...
                        </p>
                        <div className="flex justify-center">
                            <div className="w-8 h-8 border-4 border-t-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
