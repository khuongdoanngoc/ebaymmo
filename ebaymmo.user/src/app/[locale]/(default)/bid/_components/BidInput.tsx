import Input from '@/components/BaseUI/Input';
import { log } from 'console';
import { useState } from 'react';

interface BidInputProps {
    bidAmount: string; // Đảm bảo luôn là string, không undefined
    error: string;
    selectedStoreId: string;
    highestBidAmount: number;
    onBidChange: (value: string) => void;
    onPlaceBid: () => void;
    validateAndSetBidAmount: (
        value: string,
        highestBidAmount: number,
        bidAmount: number
    ) => void;
}

export const BidInput: React.FC<BidInputProps> = ({
    bidAmount,
    error,
    selectedStoreId,
    highestBidAmount,
    onBidChange,
    onPlaceBid,
    validateAndSetBidAmount
}) => {
    const [valueBid, setValueBid] = useState('');
    const bidStep = 50; // USDT, bước giá tối thiểu

    // Kiểm tra giá trị hợp lệ
    const isBidValid = () => {
        const numericBidAmount = Number(bidAmount);
        return (
            numericBidAmount >= highestBidAmount + bidStep &&
            !isNaN(numericBidAmount) &&
            numericBidAmount > 0
        );
    };

    // Xử lý khi nhấn Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onPlaceBid();
            setValueBid(''); // Reset input sau khi nhấn Enter
        }
    };

    // Xử lý khi nhấn nút
    const handleButtonClick = () => {
        onPlaceBid();
        setValueBid('');
    };

    return (
        <div className="flex flex-col gap-4 items-start border-t-[1px] border-gray-100 pt-4">
            <div className="flex justify-between w-full items-center">
                <div className="flex items-center gap-2">
                    <div className="text-gray-600 md:text-[20px] text-[16px] font-semibold">
                        Next bid step:
                    </div>
                    <span className="text-green-500 md:text-[20px] text-[16px]">
                        {bidStep} USDT
                    </span>
                </div>
            </div>
            <div className="flex flex-col w-full gap-2">
                <div className="flex items-center w-full gap-[18px]">
                    <Input
                        type="text"
                        // value={bidAmount} // Thêm value để đảm bảo đây là controlled component
                        placeHolder="Enter bid amount (USDT)"
                        onChange={(e) => {
                            onBidChange(e.target.value);
                            setValueBid(e.target.value);
                        }}
                        value={valueBid}
                        onKeyDown={handleKeyDown}
                        rounded="rounded-[90px]"
                        display="84%"
                    />
                    <button
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                        onClick={handleButtonClick}
                        disabled={!bidAmount || !selectedStoreId || !!error}
                    >
                        Place bid
                    </button>
                </div>
                {error && (
                    <div className="text-red-500 text-sm ml-4">{error}</div>
                )}
            </div>
        </div>
    );
};
