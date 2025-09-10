// components/AuctionWaitingRoom.tsx
import Image from 'next/image';
import { CountdownTimer } from '@/components/CountdownTimer';
import ChatItem from '@/components/HammerIcon/ChatItem';
import { useTranslations } from 'next-intl';

interface AuctionWaitingRoomProps {
    positionName: string;
    categoryName: string;
    categoryImage: string;
    bidDate: string;
    onTimeUp: () => void;
    currentBidId: string;
    accessToken: string;
}

export const AuctionWaitingRoom: React.FC<AuctionWaitingRoomProps> = ({
    positionName,
    categoryName,
    categoryImage,
    bidDate,
    onTimeUp,
    currentBidId,
    accessToken
}) => {
    const t = useTranslations('auction');
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
            <div className=" md:w-[1400px] mx-auto px-4 py-8 md:mt-[50px] mt-[20px]">
                <h1 className="md:text-[40px] text-[30px] font-bold text-center mb-8">
                    {t('roonwaiting')}
                    <div className="text-center mb-[30px]">
                        <div className="flex flex-col gap-[5px] items-center justify-center">
                            <p className="text-green_main mb-4 md:text-[30px] text-[16px]">
                                {t('currentWaiting')}
                            </p>
                            <span className="md:text-[30px] text-[16px] text-green_main font-bold">
                                {positionName}
                            </span>
                        </div>
                        {categoryImage != null && categoryName != null ? (
                            <div className="flex flex-col justify-center items-center gap-2">
                                <Image
                                    src={
                                        categoryImage ||
                                        '/images/default-image.png'
                                    }
                                    alt="Auction Category"
                                    width={100}
                                    height={100}
                                    className="object-contain my-4"
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
                        <div className="px-[35px] py-[30px] mb-6 relative">
                            <div className="flex flex-col items-center">
                                <Image
                                    src="/images/auction.svg"
                                    alt="Auction"
                                    width={500}
                                    height={500}
                                    className="mb-8"
                                />
                                <p className="text-gray-600 mb-4 text-[20px] text-center">
                                    {t('waitingTime')}
                                </p>
                                <CountdownTimer
                                    bidDate={bidDate}
                                    showStatus={false}
                                    className="md:text-[40px] text-[20px] font-bold text-[rgb(255,114,114)]"
                                    onTimeUp={onTimeUp}
                                    isAuctionRoom={false}
                                />
                            </div>
                        </div>
                    </div>
                    <ChatItem
                        categoryName={
                            categoryName === null
                                ? `The auction ${categoryName} category will be start!`
                                : `The auction ${positionName} in store list will be start!`
                        }
                        currentBidId={currentBidId}
                        accessToken={accessToken}
                    />
                </div>
            </div>
        </div>
    );
};
