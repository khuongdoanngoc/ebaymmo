'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
    useGetBidsForUsersSubscription,
    useGetBidConfigSubscription
} from '@/generated/graphql';
import { Hammer } from '@/components/HammerIcon/Hammer';
import { useSocketContext } from '@/contexts/SocketConnectionContext';
import { useUserInfo } from '@/contexts/UserInfoContext';

export default function BubbleIcons() {
    const { socket } = useSocketContext();
    const { userInfo } = useUserInfo();
    const [isVisible, setIsVisible] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();
    const pathname = usePathname();
    const retryCountRef = useRef(0);
    const [isMounted, setIsMounted] = useState(false);

    // Kiểm tra xem có đang ở trang đấu giá không
    const isAuctionPage =
        pathname?.includes('/auction') || pathname?.includes('/bid');

    // Lấy cấu hình thời gian đấu giá
    const { data: configData } = useGetBidConfigSubscription();
    const bidDuration = configData?.configs?.[0]?.value
        ? parseInt(configData.configs[0].value) * 60 * 60 * 1000
        : 60 * 60 * 1000; // Mặc định 1 giờ

    // Thực hiện query GraphQL
    const {
        data: bidsData,
        loading,
        error
    } = useGetBidsForUsersSubscription({
    });
    useEffect(() => {
        setIsMounted(true);
    }, []);
    //console.log('bidsData', bidsData);
    // Lọc và sắp xếp phiên đấu giá theo thời gian sắp diễn ra
    const sortedBids = useMemo(() => {
        if (!bidsData?.bids?.length) return [];

        const now = new Date().getTime();

        // Lọc những phiên đấu giá sắp diễn ra và đang diễn ra
        return [...bidsData.bids]
            .filter((bid) => {
                if (!bid.bidDate) return false;

                const auctionDate = new Date(bid.bidDate).getTime();
                const auctionEndTime = auctionDate + bidDuration;

                // Chỉ lấy những phiên đấu giá chưa kết thúc
                return now <= auctionEndTime;
            })
            .sort((a, b) => {
                // Sắp xếp theo thời gian, gần nhất lên đầu
                return (
                    new Date(a.bidDate).getTime() -
                    new Date(b.bidDate).getTime()
                );
            });
    }, [bidsData, bidDuration]);

    const bidDate = sortedBids[0]?.bidDate;
    const bidId = sortedBids[0]?.bidId;

    // Kiểm tra thời gian đấu giá để xác định có nên ẩn Hammer hay không
    const shouldHideHammer = useMemo(() => {
        // Nếu đang ở trang đấu giá hoặc bid, luôn ẩn Hammer
        if (isAuctionPage) return true;
        
        // Nếu không có ngày đấu giá hoặc không có phiên đấu giá nào, ẩn Hammer
        if (!bidDate || !sortedBids.length) return true;
        
        try {
            const now = new Date().getTime();
            const auctionDate = new Date(bidDate).getTime();
            const auctionEndTime = auctionDate + bidDuration;

            // Chỉ ẩn Hammer khi phiên đấu giá đã kết thúc
            return now > auctionEndTime;
        } catch (error) {
            return true; // Nếu có lỗi, mặc định ẩn
        }
    }, [isAuctionPage, bidDate, bidDuration, sortedBids.length]);

    // Lắng nghe scroll để hiển thị icon
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Đăng ký nhận cập nhật số tin nhắn chưa đọc
    useEffect(() => {
        if (socket && userInfo?.userId) {
            // Đăng ký nhận cập nhật số tin nhắn chưa đọc
            socket.emit('subscribeCountUnreadMessages');

            // Lắng nghe sự kiện cập nhật số tin nhắn chưa đọc từ server
            socket.on('countUnreadMessages', (data) => {
                if (data) {
                    setUnreadCount(data);
                }
            });

            // Cleanup listener và hủy đăng ký khi component unmount
            return () => {
                socket.emit('unsubscribeCountUnreadMessages', {
                    userId: userInfo.userId
                });
                socket.off('countUnreadMessages');
            };
        }
    }, [socket, userInfo?.userId]);

    // Handle click event to scroll to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isMounted) return null;

    // Thay vì return sớm khi không có dữ liệu đấu giá, chỉ lưu lại thông tin lỗi
    let errorMessage = '';
    if (error) {
        errorMessage = 'Lỗi: ' + error.message;
        console.log('Error in BubbleIcons:', error);
    }

    // Get the first bid data if available
    const bidData = sortedBids[0];
    const showHammer = bidData?.bidDate && bidData?.bidId && !shouldHideHammer;

    // Đường dẫn chat - fix vấn đề có thể xảy ra với router
    const chatPath = userInfo?.userId ? '/chatbox' : '/login';

    return (
        <div className="fixed right-4 md:right-14 bottom-6 md:bottom-20 flex flex-col items-center gap-8 z-[9999]">
            {showHammer && (
                <div className="flex flex-col items-center">
                    <Hammer
                        bidDate={bidData.bidDate}
                        bidId={bidData.bidId}
                    />
                </div>
            )}
            
            {/* Chat Icon - luôn hiển thị */}
            <div className="relative" style={{ display: 'block' }}>
                {unreadCount > 0 && (
                    <div className="absolute text-neutral-50 top-[-6px] right-0 w-5 h-5 rounded-[50%] flex items-center justify-center bg-secondary-600 leading-[140%] font-semibold text-sm md:text-base">
                        {unreadCount}
                    </div>
                )}
                <button
                    onClick={() => router.push(chatPath)}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-[50%] bg-white flex items-center justify-center shadow-lg"
                >
                    <Image
                        src="/images/chat.svg"
                        alt="chat"
                        width={24}
                        height={24}
                        className="w-6 h-6 md:w-8 md:h-8"
                        priority
                    />
                </button>
            </div>
            
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-[50%] bg-secondary-200 flex items-center justify-center shadow-lg"
                >
                    <Image
                        src="/images/arrow-top.svg"
                        alt="arrow-up"
                        width={24}
                        height={24}
                        className="w-6 h-6 md:w-8 md:h-8"
                        priority
                    />
                </button>
            )}
            {process.env.NODE_ENV === 'development' && errorMessage && (
                <div className="text-xs text-gray-500 mt-2">
                    {errorMessage}
                </div>
            )}
        </div>
    );
}
