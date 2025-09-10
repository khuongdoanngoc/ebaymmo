'use client';

import Image from 'next/image';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useGetBidsForUsersSubscription } from '@/generated/graphql';
import ChatItem from '@/components/HammerIcon/ChatItem';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { formatDateForPostgres } from '@/utils/format';

export default function WaitingRoom() {
    const router = useRouter();
    const { data: session } = useSession();
    const accessToken = session?.user?.accessToken;
    const loggedRef = useRef(false);
    const [debugInfo, setDebugInfo] = useState<string>('');

    // Tạo timestamp hiện tại với format PostgreSQL và trừ đi 1 giờ để đảm bảo
    const now = new Date();
    now.setHours(now.getHours() - 1); // Lùi lại 1 giờ để đảm bảo bắt được các phiên sắp diễn ra
    const currentDate = formatDateForPostgres(now);

    const { data: bidsData, loading } = useGetBidsForUsersSubscription({});

    useEffect(() => {
        // Nếu không có session, chuyển hướng về trang đăng nhập
        if (!accessToken) {
            router.push('/auth/login');
        }
    }, [accessToken, router]);

    useEffect(() => {
        // Kiểm tra dữ liệu đấu giá và chuyển hướng đến phòng đấu giá nếu có
        if (bidsData?.bids && bidsData.bids.length > 0) {
            const bidId = bidsData.bids[0].bidId;

            // Chuyển hướng đến phòng đấu giá
            if (bidId) {
                router.push(`/bid/${bidId}`);
            }
        }
    }, [bidsData, router]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] p-4 flex flex-col gap-6 justify-center items-center">
                <Image
                    src="/images/loading.svg"
                    alt="Đang tải..."
                    width={100}
                    height={100}
                    className="animate-spin"
                />
                <h3 className="text-2xl font-bold text-center">
                    Đang tìm phiên đấu giá...
                </h3>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] p-4 flex flex-col gap-6 max-w-[500px] mx-auto">
            <h3 className="text-3xl font-bold">Phòng chờ đấu giá</h3>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col items-center gap-4">
                    <Image
                        src="/images/binoculars.png"
                        alt="Tìm kiếm"
                        width={120}
                        height={120}
                    />
                    <h4 className="text-xl font-bold text-center">
                        Không tìm thấy phiên đấu giá nào
                    </h4>
                    <p className="text-gray-600 text-center">
                        Hiện tại không có phiên đấu giá nào đang diễn ra hoặc
                        sắp diễn ra. Vui lòng quay lại sau.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-2 bg-gray-100 rounded-md text-sm">
                            <p>Debug Info: {debugInfo || 'No data'}</p>
                            <p>Current Date: {new Date().toLocaleString()}</p>
                            <p>Format Date: {currentDate}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-bold mb-4">Đấu giá gần đây</h4>
                {accessToken && (
                    <ChatItem
                        currentBidId="waiting-room"
                        accessToken={accessToken}
                        categoryName="Waiting Room"
                    />
                )}
            </div>
        </div>
    );
}
